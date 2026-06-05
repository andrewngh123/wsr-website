-- ============================================================
-- WSR Database Schema — run this in Supabase SQL Editor
-- Covers all 10 CSV files in /databasefiles/
-- ============================================================


-- ── CONTINENTS ───────────────────────────────────────────────────────────────
create table if not exists continents (
  code text primary key,   -- e.g. "EU", "AF", "AS", "AM", "OC"
  name text not null
);

insert into continents (code, name) values
  ('AF', 'Africa'),
  ('AM', 'Americas'),
  ('AS', 'Asia'),
  ('EU', 'Europe'),
  ('OC', 'Oceania')
on conflict (code) do nothing;


-- ── COUNTRIES ────────────────────────────────────────────────────────────────
-- Source: countries.csv
-- Columns: code, name, iso_2, iso_3, continent_code
create table if not exists countries (
  code           text primary key,   -- IOC 3-letter code, e.g. "USA"
  name           text not null,
  iso_2          text not null,      -- 2-letter ISO for flags, e.g. "us"
  iso_3          text,
  continent_code text references continents(code)
);


-- ── SPORTS ───────────────────────────────────────────────────────────────────
-- Source: sport.csv
-- Columns: sport_id, name, coeff
create table if not exists sports (
  sport_id  integer primary key,
  name      text    not null,
  coeff     numeric               -- overall sport coefficient (popularity × universality)
);


-- ── DISCIPLINES ──────────────────────────────────────────────────────────────
-- Source: discipline.csv
-- Columns: discipline_id, sport_id, name, coefficient, coeff_men, coeff_women
create table if not exists disciplines (
  discipline_id integer primary key,
  sport_id      integer references sports(sport_id),
  name          text    not null,
  coefficient   numeric,
  coeff_men     numeric,
  coeff_women   numeric
);


-- ── WRCES FINAL RANKINGS ─────────────────────────────────────────────────────
-- Source: wrces_final.csv
-- Columns: id, year, rank, country_code, points, change
create table if not exists wrces_rankings (
  id           serial  primary key,
  year         integer not null,
  rank         integer not null,
  country_code text    not null references countries(code),
  points       numeric not null,
  change       text,              -- e.g. "+3", "-1", or null / "-"
  unique(year, country_code)
);


-- ── WRCES SPORT RANKINGS ─────────────────────────────────────────────────────
-- Source: wrces_sport.csv  (largest file: ~57k rows — per-sport country rankings)
-- Columns: rank_id, year, sport_id, sport_name, rank, country_code, points
create table if not exists wrces_sport_rankings (
  rank_id      integer primary key,
  year         integer not null,
  sport_id     integer references sports(sport_id),
  sport_name   text    not null,
  rank         integer not null,
  country_code text    not null references countries(code),
  points       numeric not null
);


-- ── WFCR RANKINGS ────────────────────────────────────────────────────────────
-- Source: wfcr.csv  (World's Fittest Countries Ranking)
-- Columns: id, year, rank, country_code, wrces, merit, wrces_points,
--          obesity, pou, avg_pou_obesity, points, +/-
create table if not exists wfcr_rankings (
  id              serial  primary key,
  year            integer not null,
  rank            integer not null,
  country_code    text    not null references countries(code),
  wrces           numeric,          -- WRCES sub-score
  merit           numeric,          -- Merit sub-score
  wrces_points    numeric,
  obesity         numeric,          -- Obesity index score
  pou             numeric,          -- Prevalence of undernourishment score
  avg_pou_obesity numeric,          -- Average of obesity + pou
  points          numeric not null, -- Final WFCR points
  change          text,             -- Rank change vs previous year
  unique(year, country_code)
);


-- ── WSPI RANKINGS ────────────────────────────────────────────────────────────
-- Source: wspi.csv  (World Sports Power Index)
-- Columns: id, year, rank, country_code, wrces_points, city_points,
--          proleague_points, points, change
create table if not exists wspi_rankings (
  id               serial  primary key,
  year             integer not null,
  rank             integer not null,
  country_code     text    not null references countries(code),
  wrces_points     numeric,         -- WRCES component score
  city_points      numeric,         -- City sports hosting score
  proleague_points numeric,         -- Professional league score
  points           numeric not null,-- Final WSPI points
  change           text,
  unique(year, country_code)
);


-- ── WRCES MERIT RANKINGS ─────────────────────────────────────────────────────
-- Source: wrces_merit.csv
-- Columns: id, year, rank, country_code, gdp_rank, wrces_rank,
--          difference, points, final_points, +/-
create table if not exists merit_rankings (
  id           serial  primary key,
  year         integer not null,
  rank         integer not null,
  country_code text    not null references countries(code),
  gdp_rank     integer,             -- Country's GDP ranking
  wrces_rank   integer,             -- Country's WRCES ranking
  difference   integer,             -- gdp_rank minus wrces_rank
  points       numeric,             -- Raw merit points
  final_points numeric not null,    -- Normalized final points
  change       text,                -- stored as "+/-" column in CSV
  unique(year, country_code)
);


-- ── GDP RANKINGS ─────────────────────────────────────────────────────────────
-- Source: gdp.csv  (used to compute Merit ranking)
-- Columns: id, year, rank, country_code, points
create table if not exists gdp_rankings (
  id           serial  primary key,
  year         integer not null,
  rank         integer not null,
  country_code text    not null references countries(code),
  points       numeric not null,
  unique(year, country_code)
);


-- ============================================================
-- Row Level Security — public read, no public write
-- ============================================================

alter table continents          enable row level security;
alter table countries           enable row level security;
alter table sports              enable row level security;
alter table disciplines         enable row level security;
alter table wrces_rankings      enable row level security;
alter table wrces_sport_rankings enable row level security;
alter table wfcr_rankings       enable row level security;
alter table wspi_rankings       enable row level security;
alter table merit_rankings      enable row level security;
alter table gdp_rankings        enable row level security;

create policy "Public read" on continents           for select using (true);
create policy "Public read" on countries            for select using (true);
create policy "Public read" on sports               for select using (true);
create policy "Public read" on disciplines          for select using (true);
create policy "Public read" on wrces_rankings       for select using (true);
create policy "Public read" on wrces_sport_rankings for select using (true);
create policy "Public read" on wfcr_rankings        for select using (true);
create policy "Public read" on wspi_rankings        for select using (true);
create policy "Public read" on merit_rankings       for select using (true);
create policy "Public read" on gdp_rankings         for select using (true);


-- ============================================================
-- Indexes for fast filtering and lookups
-- ============================================================

create index if not exists idx_wrces_year_rank       on wrces_rankings(year, rank);
create index if not exists idx_wrces_sport_year_sport on wrces_sport_rankings(year, sport_id);
create index if not exists idx_wrces_sport_year_ctry  on wrces_sport_rankings(year, country_code);
create index if not exists idx_wfcr_year_rank         on wfcr_rankings(year, rank);
create index if not exists idx_wspi_year_rank         on wspi_rankings(year, rank);
create index if not exists idx_merit_year_rank        on merit_rankings(year, rank);
create index if not exists idx_gdp_year_rank          on gdp_rankings(year, rank);
create index if not exists idx_countries_iso2         on countries(iso_2);
create index if not exists idx_disciplines_sport      on disciplines(sport_id);
