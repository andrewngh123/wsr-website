-- ============================================================
-- WSR Database Schema — run this in Supabase SQL Editor
-- ============================================================

-- CONTINENTS
create table if not exists continents (
  code text primary key,   -- e.g. "EU", "AF", "AS", "AM", "OC"
  name text not null       -- e.g. "Europe"
);

insert into continents (code, name) values
  ('AF', 'Africa'),
  ('AM', 'Americas'),
  ('AS', 'Asia'),
  ('EU', 'Europe'),
  ('OC', 'Oceania')
on conflict (code) do nothing;

-- COUNTRIES
create table if not exists countries (
  code           text primary key,   -- IOC 3-letter code, e.g. "USA"
  name           text not null,
  iso_2          text not null,      -- 2-letter ISO code for flags, e.g. "us"
  iso_3          text,
  continent_code text references continents(code)
);

-- WRCES FINAL RANKINGS  (main ranking)
create table if not exists wrces_rankings (
  id           serial primary key,
  year         integer not null,
  rank         integer not null,
  country_code text    not null references countries(code),
  points       numeric not null,
  change       text,                -- e.g. "+3", "-1", or null
  unique(year, country_code)
);

-- WFCR RANKINGS  (World's Fittest Countries)
create table if not exists wfcr_rankings (
  id           serial primary key,
  year         integer not null,
  rank         integer not null,
  country_code text    not null references countries(code),
  points       numeric not null,
  change       text,
  unique(year, country_code)
);

-- WSPI RANKINGS  (World Sports Power Index)
create table if not exists wspi_rankings (
  id           serial primary key,
  year         integer not null,
  rank         integer not null,
  country_code text    not null references countries(code),
  points       numeric not null,
  change       text,
  unique(year, country_code)
);

-- MERIT RANKINGS  (WRCES Merit)
create table if not exists merit_rankings (
  id           serial primary key,
  year         integer not null,
  rank         integer not null,
  country_code text    not null references countries(code),
  points       numeric not null,
  change       text,
  unique(year, country_code)
);

-- ============================================================
-- Row Level Security — allow public read, no public write
-- ============================================================

alter table continents    enable row level security;
alter table countries     enable row level security;
alter table wrces_rankings enable row level security;
alter table wfcr_rankings  enable row level security;
alter table wspi_rankings  enable row level security;
alter table merit_rankings enable row level security;

create policy "Public read" on continents    for select using (true);
create policy "Public read" on countries     for select using (true);
create policy "Public read" on wrces_rankings for select using (true);
create policy "Public read" on wfcr_rankings  for select using (true);
create policy "Public read" on wspi_rankings  for select using (true);
create policy "Public read" on merit_rankings for select using (true);

-- ============================================================
-- Indexes for fast filtering
-- ============================================================

create index if not exists idx_wrces_year_rank on wrces_rankings(year, rank);
create index if not exists idx_wfcr_year_rank  on wfcr_rankings(year, rank);
create index if not exists idx_wspi_year_rank  on wspi_rankings(year, rank);
create index if not exists idx_merit_year_rank on merit_rankings(year, rank);
