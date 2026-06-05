-- ============================================================
-- Column reconciliation patch
-- Run this in Supabase → SQL Editor if the import script reports
-- "Could not find the '<column>' column ... in the schema cache".
--
-- Safe & idempotent: ADD COLUMN IF NOT EXISTS does nothing when the
-- column already exists. Brings wfcr/wspi/merit tables in line with
-- what scripts/import_data.py expects (matches schema.sql).
-- ============================================================

-- ── WFCR ───────────────────────────────────────────────────────────
alter table wfcr_rankings add column if not exists wrces           numeric;
alter table wfcr_rankings add column if not exists merit           numeric;
alter table wfcr_rankings add column if not exists wrces_points    numeric;
alter table wfcr_rankings add column if not exists obesity         numeric;
alter table wfcr_rankings add column if not exists pou             numeric;
alter table wfcr_rankings add column if not exists avg_pou_obesity numeric;
alter table wfcr_rankings add column if not exists change          text;

-- ── WSPI ───────────────────────────────────────────────────────────
alter table wspi_rankings add column if not exists wrces_points     numeric;
alter table wspi_rankings add column if not exists city_points      numeric;
alter table wspi_rankings add column if not exists proleague_points numeric;
alter table wspi_rankings add column if not exists change           text;

-- ── MERIT ──────────────────────────────────────────────────────────
alter table merit_rankings add column if not exists gdp_rank     integer;
alter table merit_rankings add column if not exists wrces_rank   integer;
alter table merit_rankings add column if not exists difference   integer;
alter table merit_rankings add column if not exists points       numeric;
alter table merit_rankings add column if not exists final_points numeric;
alter table merit_rankings add column if not exists change       text;

-- ── Tell PostgREST to refresh its schema cache immediately ─────────
notify pgrst, 'reload schema';
