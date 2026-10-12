-- ============================================================
--  Rebuild merit_rankings correctly after deleting/recreating it.
--  Run this in the Supabase SQL Editor BEFORE re-running the import.
--
--  Dropping a table also drops its RLS policy, its unique constraint
--  and its index. Without them:
--    • the import fails (upsert needs unique(year, country_code))
--    • the website reads nothing (publishable key needs "Public read")
-- ============================================================

create table if not exists merit_rankings (
  id           serial  primary key,
  year         integer not null,
  rank         integer not null,
  country_code text    not null references countries(code),
  gdp_rank     integer,             -- Country's GDP ranking
  wrces_rank   integer,             -- Country's WRCES ranking
  difference   integer,             -- gdp_rank minus wrces_rank
  points       numeric,             -- Raw merit points
  final_points numeric not null,    -- Normalized final points  <-- what the site now displays
  change       text,                -- stored as "+/-" column in CSV
  unique(year, country_code)        -- REQUIRED: the import upserts on this
);

-- Row-level security + the read policy the website depends on
alter table merit_rankings enable row level security;

drop policy if exists "Public read" on merit_rankings;
create policy "Public read" on merit_rankings for select using (true);

create index if not exists idx_merit_year_rank on merit_rankings(year, rank);
