-- ============================================================
--  WSR ADMIN — private tables for the hidden admin dashboard
--  Run this ONCE in Supabase → SQL Editor (safe to re-run).
--
--  These tables mirror the "DATA STORAGE & ANALYSIS" and
--  "FINALRANKING" workbooks. They are PRIVATE:
--    • RLS is enabled with NO policies, and anon/authenticated
--      grants are revoked, so the publishable key used by the
--      public website cannot read or write them.
--    • Only the server-side service_role key (SUPABASE_SERVICE_KEY,
--      never a NEXT_PUBLIC_* var) can touch them.
--  The public website tables (wrces_rankings etc.) are untouched.
-- ============================================================


-- ── ADMIN USERS ──────────────────────────────────────────────────────────────
-- Seeded by scripts/seed_admin_users.mjs — passwords are scrypt hashes.
create table if not exists admin_users (
  id              serial      primary key,
  username        text        not null unique,     -- lowercase login name
  display_name    text        not null,
  password_hash   text        not null,            -- scrypt$N$r$p$salt$hash
  token_version   integer     not null default 0,  -- bump to log the user out everywhere
  failed_attempts integer     not null default 0,
  locked_until    timestamptz,
  last_login_at   timestamptz,
  created_at      timestamptz not null default now()
);


-- ── COUNTRIES (COUNTRIESLIST.xlsx — the canonical 206 NOCs) ──────────────────
create table if not exists ds_countries (
  code           text primary key,   -- e.g. "LBN"
  name           text not null unique, -- canonical upper-case name, e.g. "LEBANON"
  iso_2          text,               -- for flags
  iso_3          text,
  continent_code text
);


-- ── CATEGORIES (sheet "CATEGORIES") ──────────────────────────────────────────
create table if not exists ds_categories (
  sport text primary key,
  type  text not null check (type in ('IND', 'TEAM', 'PART')),
  note  text                          -- e.g. "WATER POLO" for AQUATICS
);


-- ── ENTRIES (sheet "BY COUNTRY", Excel table SPORTS_2021) ────────────────────
-- One row per country per sport per year. Not unique on (year, sport, country):
-- the workbook has a few genuine double entries, and Excel sums them.
create table if not exists ds_entries (
  id           bigserial primary key,
  year         integer not null,
  sport        text    not null references ds_categories(sport) on update cascade,
  rank         integer not null,
  country      text    not null,       -- canonical name (unmatched names kept as-is)
  country_code text    references ds_countries(code),
  points       numeric not null,
  updated_at   timestamptz not null default now(),
  updated_by   text
);

create index if not exists idx_ds_entries_year_sport on ds_entries(year, sport);
create index if not exists idx_ds_entries_country    on ds_entries(country, year);
create index if not exists idx_ds_entries_sport      on ds_entries(sport, year);


-- ── FINAL RANK (sheet "FINAL RANK") — archival combined ranking per year ─────
create table if not exists ds_final_rank (
  id           serial  primary key,
  year         integer not null,
  rank         integer not null,
  country      text    not null,
  country_code text    references ds_countries(code),
  points       numeric not null,
  progress     text,                   -- "-", "NEW" or a signed number
  unique (year, country)
);

create index if not exists idx_ds_final_rank_year on ds_final_rank(year, rank);


-- ── SETTINGS (key/value: latest sports added, last import, …) ────────────────
create table if not exists ds_settings (
  key        text primary key,
  value      jsonb,
  updated_at timestamptz not null default now()
);


-- ── AUDIT LOG — every change made from the dashboard ─────────────────────────
create table if not exists ds_audit_log (
  id         bigserial   primary key,
  at         timestamptz not null default now(),
  username   text        not null,
  action     text        not null,     -- create | update | delete | recompute | settings
  table_name text        not null,
  record_id  text,
  before     jsonb,
  after      jsonb
);

create index if not exists idx_ds_audit_at on ds_audit_log(at desc);


-- ============================================================
--  Aggregation functions (pivot-table equivalents)
-- ============================================================

-- Distinct years present in either table, newest first.
create or replace function ds_years()
returns setof integer
language sql stable
as $$
  select year from (
    select distinct year from ds_entries
    union
    select distinct year from ds_final_rank
  ) y order by year desc
$$;

-- Per-year summary for the overview.
create or replace function ds_year_summary()
returns table (year integer, entries bigint, sports bigint, countries bigint, points numeric)
language sql stable
as $$
  select year, count(*), count(distinct sport), count(distinct country), sum(points)
  from ds_entries group by year order by year desc
$$;

-- "BY SPORT" pivot: per-country sum of points + entry count, optional
-- sport / year filters (null = "(All)").
create or replace function ds_sport_pivot(p_sport text default null, p_year integer default null)
returns table (country text, country_code text, points numeric, entries bigint, avg_rank numeric, best_rank integer)
language sql stable
as $$
  select country, max(country_code), sum(points), count(*), avg(rank), min(rank)
  from ds_entries
  where (p_sport is null or sport = p_sport)
    and (p_year  is null or year  = p_year)
  group by country
  order by sum(points) desc
$$;

-- Compare sports in a year (or across all years): entries, countries, total
-- points and the leading country (most points) per sport.
create or replace function ds_sport_summary(p_year integer default null)
returns table (sport text, type text, entries bigint, countries bigint, points numeric, leader text)
language sql stable
as $$
  with e as (
    select * from ds_entries where p_year is null or year = p_year
  ), per as (
    select sport, country, sum(points) as pts from e group by sport, country
  )
  select e.sport, c.type, count(*), count(distinct e.country), sum(e.points),
         (select per.country from per where per.sport = e.sport order by per.pts desc limit 1)
  from e join ds_categories c on c.sport = e.sport
  group by e.sport, c.type
  order by sum(e.points) desc
$$;

-- Combined standings for a year (FINALRANKING "Final Ranking" A–E):
-- SUMIF of points + COUNTIF of entries per country, over every canonical
-- country (so countries with no results show 0, like the workbook).
-- p_exclude drops sports — used for the "before latest sports" comparison.
create or replace function ds_standings(p_year integer, p_exclude text[] default '{}')
returns table (country text, country_code text, points numeric, sports bigint)
language sql stable
as $$
  with e as (
    select country, max(country_code) as country_code, sum(points) as points, count(*) as sports
    from ds_entries
    where year = p_year and not (sport = any(p_exclude))
    group by country
  )
  select coalesce(e.country, c.name), coalesce(e.country_code, c.code),
         coalesce(e.points, 0), coalesce(e.sports, 0)
  from e full outer join ds_countries c on c.name = e.country
  order by 3 desc
$$;


-- ============================================================
--  Lock everything down — service_role only
-- ============================================================

alter table admin_users   enable row level security;
alter table ds_countries  enable row level security;
alter table ds_categories enable row level security;
alter table ds_entries    enable row level security;
alter table ds_final_rank enable row level security;
alter table ds_settings   enable row level security;
alter table ds_audit_log  enable row level security;
-- (No policies on purpose: with RLS on and no policy, anon/authenticated see nothing.)

revoke all on admin_users, ds_countries, ds_categories, ds_entries,
              ds_final_rank, ds_settings, ds_audit_log
  from anon, authenticated;

revoke execute on function ds_years(), ds_year_summary(),
                           ds_sport_pivot(text, integer), ds_sport_summary(integer),
                           ds_standings(integer, text[])
  from public, anon, authenticated;
grant execute on function ds_years(), ds_year_summary(),
                          ds_sport_pivot(text, integer), ds_sport_summary(integer),
                           ds_standings(integer, text[])
  to service_role;

-- Tell PostgREST to pick up the new tables/functions immediately.
notify pgrst, 'reload schema';
