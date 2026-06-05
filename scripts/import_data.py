"""
WSR Data Import Script
======================
Run this AFTER creating tables with schema.sql.

Requirements:
    pip install supabase

Usage:
    1. Set your Supabase credentials below (or as environment variables)
    2. Run: python import_data.py

The script uploads all 10 CSV files into Supabase in the correct order,
handling all known data incompatibilities automatically.
"""

import csv
import os
import sys
from pathlib import Path

# ── Configuration ─────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://sliiydlqtuopadtbrwtx.supabase.co")

# IMPORTANT: imports must use the service_role SECRET key (it bypasses Row-Level
# Security). Do NOT hardcode it here and do NOT commit it. Pass it at runtime:
#     SUPABASE_SERVICE_KEY="sb_secret_..." python3 scripts/import_data.py
# The publishable key below is only a fallback and will be blocked by RLS.
SUPABASE_KEY = (
    os.environ.get("SUPABASE_SERVICE_KEY")
    or os.environ.get("SUPABASE_KEY")
    or "sb_publishable_EUKi091P-ppf3buSFPEvFw_dRYojraQ"
)

# Path to the databasefiles folder — adjust if needed
DATA_DIR = Path(__file__).parent.parent.parent / "databasefiles"
# ─────────────────────────────────────────────────────────────────────────────

BATCH_SIZE = 500   # rows per upload batch (safe limit for Supabase free tier)


def get_client():
    try:
        from supabase import create_client
    except ImportError:
        print("ERROR: supabase package not installed.")
        print("Run:  pip install supabase")
        sys.exit(1)

    return create_client(SUPABASE_URL, SUPABASE_KEY)


def clean_num(val):
    """Convert empty string or '-' to None, otherwise return float."""
    v = str(val).strip()
    if v in ("", "-", "N/A", "null", "None"):
        return None
    try:
        return float(v)
    except ValueError:
        return None


def safe_int(val):
    """Return int(val), or None if blank / '#N/A' / non-numeric."""
    v = str(val).strip()
    if v in ("", "-", "#N/A", "N/A", "null", "None"):
        return None
    try:
        return int(float(v))   # tolerate "12.0"
    except ValueError:
        return None


def clean_change(val):
    """Convert '-' or '' change values to None, keep numeric strings."""
    v = str(val).strip()
    if v in ("", "-"):
        return None
    # Remove leading '+' for storage, keep sign for negatives
    return v


def upsert_batch(client, table: str, rows: list, on_conflict: str | None = None):
    """Upload rows in batches, printing progress.

    on_conflict: comma-separated columns of the unique constraint to match on
    when re-running. Required for tables whose primary key is a serial `id`
    (not present in the CSV) but which have a separate unique(year, country_code)
    constraint — otherwise re-runs try to INSERT and hit the unique constraint.
    """
    total = len(rows)
    uploaded = 0
    for i in range(0, total, BATCH_SIZE):
        batch = rows[i:i + BATCH_SIZE]
        if on_conflict:
            client.table(table).upsert(batch, on_conflict=on_conflict).execute()
        else:
            client.table(table).upsert(batch).execute()
        uploaded += len(batch)
        print(f"  {table}: {uploaded}/{total}")
    print(f"  ✓ {table} complete ({total} rows)")


# ── 1. CONTINENTS ─────────────────────────────────────────────────────────────
def import_continents(client):
    print("\n[1/9] Importing continents...")
    rows = []
    with open(DATA_DIR / "continent.csv") as f:
        for r in csv.DictReader(f):
            rows.append({
                "code": r["code"].strip(),
                "name": r["name"].strip().capitalize(),  # "africa" → "Africa"
            })
    upsert_batch(client, "continents", rows)


# ── 2. COUNTRIES ──────────────────────────────────────────────────────────────
def import_countries(client):
    print("\n[2/9] Importing countries...")
    rows = []
    with open(DATA_DIR / "countries.csv") as f:
        for r in csv.DictReader(f):
            rows.append({
                "code":           r["code"].strip(),
                "name":           r["name"].strip(),
                "iso_2":          r["iso_2"].strip().lower(),
                "iso_3":          r["iso_3"].strip() or None,
                "continent_code": r["continent_code"].strip() or None,
            })
    upsert_batch(client, "countries", rows)


# ── 3. SPORTS ─────────────────────────────────────────────────────────────────
def import_sports(client):
    print("\n[3/9] Importing sports...")
    rows = []
    with open(DATA_DIR / "sport.csv") as f:
        for r in csv.DictReader(f):
            rows.append({
                "sport_id": int(r["sport_id"]),
                "name":     r["name"].strip(),
                "coeff":    clean_num(r["coeff"]),
            })
    upsert_batch(client, "sports", rows)


# ── 4. DISCIPLINES ────────────────────────────────────────────────────────────
def import_disciplines(client):
    print("\n[4/9] Importing disciplines...")
    rows = []
    with open(DATA_DIR / "discipline.csv") as f:
        for r in csv.DictReader(f):
            rows.append({
                "discipline_id": int(r["discipline_id"]),
                "sport_id":      int(r["sport_id"]),
                "name":          r["name"].strip(),
                "coefficient":   clean_num(r["coefficient"]),
                "coeff_men":     clean_num(r["coeff_men"]),
                "coeff_women":   clean_num(r["coeff_women"]),
            })
    upsert_batch(client, "disciplines", rows)


# ── 5. WRCES FINAL RANKINGS ───────────────────────────────────────────────────
def import_wrces(client):
    print("\n[5/9] Importing WRCES final rankings...")
    rows = []
    with open(DATA_DIR / "wrces_final.csv") as f:
        for r in csv.DictReader(f):
            rows.append({
                "year":         int(r["year"]),
                "rank":         int(r["rank"]),
                "country_code": r["country_code"].strip(),
                "points":       clean_num(r["points"]),
                "change":       clean_change(r["change"]),
            })
    upsert_batch(client, "wrces_rankings", rows, on_conflict="year,country_code")


# ── 6. WFCR RANKINGS ─────────────────────────────────────────────────────────
def import_wfcr(client):
    print("\n[6/9] Importing WFCR rankings...")
    rows = []
    with open(DATA_DIR / "wfcr.csv") as f:
        for r in csv.DictReader(f):
            # CSV has extra empty columns at the end — only use named keys
            rows.append({
                "year":            int(r["year"]),
                "rank":            int(r["rank"]),
                "country_code":    r["country_code"].strip(),
                "wrces":           clean_num(r.get("wrces")),
                "merit":           clean_num(r.get("merit")),
                "wrces_points":    clean_num(r.get("wrces_points")),
                "obesity":         clean_num(r.get("obesity")),
                "pou":             clean_num(r.get("pou")),
                "avg_pou_obesity": clean_num(r.get("avg_pou_obesity")),
                "points":          clean_num(r["points"]),
                "change":          clean_change(r.get("change", "")),
            })
    upsert_batch(client, "wfcr_rankings", rows, on_conflict="year,country_code")


# ── 7. WSPI RANKINGS ──────────────────────────────────────────────────────────
def import_wspi(client):
    print("\n[7/9] Importing WSPI rankings...")
    rows = []
    with open(DATA_DIR / "wspi.csv") as f:
        for r in csv.DictReader(f):
            rows.append({
                "year":              int(r["year"]),
                "rank":              int(r["rank"]),
                "country_code":      r["country_code"].strip(),
                "wrces_points":      clean_num(r.get("wrces_points")),
                "city_points":       clean_num(r.get("city_points")),
                "proleague_points":  clean_num(r.get("proleague_points")),
                "points":            clean_num(r["points"]),
                "change":            clean_change(r.get("change", "")),
            })
    upsert_batch(client, "wspi_rankings", rows, on_conflict="year,country_code")


# ── 8. MERIT RANKINGS ─────────────────────────────────────────────────────────
def import_merit(client):
    print("\n[8/9] Importing WRCES Merit rankings...")
    rows = []
    with open(DATA_DIR / "wrces_merit.csv") as f:
        for r in csv.DictReader(f):
            rows.append({
                "year":         int(r["year"]),
                "rank":         int(r["rank"]),
                "country_code": r["country_code"].strip(),
                "gdp_rank":     int(r["gdp_rank"]) if r.get("gdp_rank","").strip() else None,
                "wrces_rank":   int(r["wrces_rank"]) if r.get("wrces_rank","").strip() else None,
                "difference":   int(r["difference"]) if r.get("difference","").strip() else None,
                "points":       clean_num(r.get("points")),
                "final_points": clean_num(r["final_points"]),
                "change":       clean_change(r.get("change", "")),
            })
    upsert_batch(client, "merit_rankings", rows, on_conflict="year,country_code")


# ── 9. GDP RANKINGS ───────────────────────────────────────────────────────────
# gdp.csv uses full country NAMES (not codes) — we build a name→code map
def import_gdp(client):
    print("\n[9/9] Importing GDP rankings...")

    # Build name → code lookup from countries.csv
    name_to_code: dict[str, str] = {}
    with open(DATA_DIR / "countries.csv") as f:
        for r in csv.DictReader(f):
            name_to_code[r["name"].strip().upper()] = r["code"].strip()

    # Manual fixes where gdp.csv name differs from countries.csv
    MANUAL = {
        "MALDIVES":   "MDV",   # countries.csv has "MALDIVES ISLANDS"
        "SWAZILAND":  "SWZ",   # countries.csv has "ESWATINI"
        "TURKEY":     "TUR",   # countries.csv has "TURKIYE"
    }

    rows = []
    skipped = []
    with open(DATA_DIR / "gdp.csv") as f:
        for r in csv.DictReader(f):
            name = r["country_code"].strip()
            upper = name.upper()
            code = MANUAL.get(upper) or name_to_code.get(upper)
            if not code:
                skipped.append(name)
                continue
            rows.append({
                "year":         int(r["year"]),
                "rank":         int(r["rank"]),
                "country_code": code,
                "points":       clean_num(r["points"]),
            })

    if skipped:
        print(f"  ⚠ Skipped {len(skipped)} unrecognised GDP names: {skipped}")

    upsert_batch(client, "gdp_rankings", rows, on_conflict="year,country_code")


# ── 10. WRCES SPORT RANKINGS (large — ~57k rows) ─────────────────────────────
def import_wrces_sport(client):
    print("\n[10/10] Importing WRCES sport rankings (~57k rows, this will take a moment)...")
    rows = []
    skipped = 0
    with open(DATA_DIR / "wrces_sport.csv") as f:
        for r in csv.DictReader(f):
            rank_id = safe_int(r["rank_id"])
            rank    = safe_int(r["rank"])
            points  = clean_num(r["points"])
            country = r["country_code"].strip()
            # rank_id (primary key), rank, country_code and points are required
            if rank_id is None or rank is None or not country or points is None:
                skipped += 1
                continue
            rows.append({
                "rank_id":      rank_id,
                "year":         int(r["year"]),
                "sport_id":     safe_int(r["sport_id"]),   # null for "#N/A" sports
                "sport_name":   r["sport_name"].strip(),
                "rank":         rank,
                "country_code": country,
                "points":       points,
            })
    if skipped:
        print(f"  ⚠ Skipped {skipped} rows missing required fields")
    upsert_batch(client, "wrces_sport_rankings", rows)


# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("WSR Data Import")
    print("===============")
    print(f"Data directory: {DATA_DIR}")
    print(f"Supabase URL:   {SUPABASE_URL}")

    if not DATA_DIR.exists():
        print(f"\nERROR: Data directory not found: {DATA_DIR}")
        print("Make sure you're running this from the wsr-website/scripts/ folder,")
        print("or adjust the DATA_DIR path at the top of this script.")
        sys.exit(1)

    client = get_client()

    import_continents(client)
    import_countries(client)
    import_sports(client)
    import_disciplines(client)
    import_wrces(client)
    import_wfcr(client)
    import_wspi(client)
    import_merit(client)
    import_gdp(client)
    import_wrces_sport(client)

    print("\n✅ All data imported successfully!")
