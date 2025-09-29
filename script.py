#!/usr/bin/env python3
"""
Sync TABLE DATA from Local -> Dev Postgres without touching enums/types/schemas.

Approach:
  1) TRUNCATE target schema (CASCADE, restart identity) except excluded tables
  2) pg_dump -Fc --data-only from local
  3) pg_restore --data-only into dev

Requires: pg_dump, pg_restore, psql in PATH
"""

import subprocess, sys, tempfile, os
from typing import List

# ===== HARD-CODED CONFIG =====
SRC_DB = "postgresql://postgres:admin@localhost:5432/italian_shoes"
DST_DB = "postgresql://adminuser:adminuser%40123@13.232.130.45:5432/italianshoedb"
SCHEMA = "public"

# Tables to exclude completely
EXCLUDE_TABLES = [
    "_prisma_migrations",
    "product",
    "product_variant",
    "product_images",
    "product_materials",
    "product_gemstones",
    "product_reviews"
]  

TRUNCATE_DESTINATION = True
DISABLE_TRIGGERS_DURING_RESTORE = True
# =============================


def check_cmd(name: str):
    try:
        subprocess.run([name, "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    except Exception:
        print(f"ERROR: '{name}' not found in PATH.", file=sys.stderr)
        sys.exit(1)

def sql_quote(val: str) -> str:
    return "'" + val.replace("'", "''") + "'"

def run_psql_sql(dsn: str, sql: str):
    cmd = ["psql", dsn, "-v", "ON_ERROR_STOP=1", "-X", "-q", "-c", sql]
    subprocess.run(cmd, check=True)

def truncate_target(dsn: str, schema: str, exclude_tables: List[str]):
    not_in = ""
    if exclude_tables:
        not_in = " AND tablename NOT IN (" + ", ".join(sql_quote(t) for t in exclude_tables) + ") "
    sql = f"""
DO $$
DECLARE stmt text;
BEGIN
  SELECT 'TRUNCATE TABLE ' || string_agg(format('%I.%I', schemaname, tablename), ', ')
         || ' RESTART IDENTITY CASCADE;'
    INTO stmt
    FROM pg_tables
   WHERE schemaname = {sql_quote(schema)} {not_in};

  IF stmt IS NOT NULL THEN
    EXECUTE stmt;
  END IF;
END $$;
""".strip()
    run_psql_sql(dsn, sql)

def main():
    print("===== Postgres Data Sync (local -> dev) =====")
    print(f"Source:      {SRC_DB}")
    print(f"Destination: {DST_DB}")
    print(f"Schema:      {SCHEMA}")
    print(f"Exclude:     {EXCLUDE_TABLES if EXCLUDE_TABLES else '[]'}")
    print(f"Truncate:    {'YES' if TRUNCATE_DESTINATION else 'NO'}")
    print("=============================================")

    for tool in ("psql", "pg_dump", "pg_restore"):
        check_cmd(tool)

    try:
        if TRUNCATE_DESTINATION:
            print("→ Truncating destination tables (CASCADE, restart identity)...")
            truncate_target(DST_DB, SCHEMA, EXCLUDE_TABLES)

        dump_args = [
            "pg_dump",
            SRC_DB,
            "--format=custom",
            "--data-only",
            "--no-owner",
            "--no-privileges",
            f"--schema={SCHEMA}",
        ]
        for t in EXCLUDE_TABLES:
            dump_args.append(f"--exclude-table-data={SCHEMA}.{t}")

        with tempfile.TemporaryDirectory() as td:
            dump_path = os.path.join(td, "data.dump")
            dump_args += ["--file", dump_path]

            print("→ Running pg_dump (custom format)...")
            subprocess.run(dump_args, check=True)

            restore_args = [
                "pg_restore",
                "--data-only",
                "--no-owner",
                "--no-privileges",
                f"--dbname={DST_DB}",
            ]
            if DISABLE_TRIGGERS_DURING_RESTORE:
                restore_args.append("--disable-triggers")

            restore_args.append(dump_path)

            print("→ Running pg_restore into destination...")
            subprocess.run(restore_args, check=True)

        print("✅ Sync complete (tables only; enums/types untouched).")
    except subprocess.CalledProcessError as e:
        print(f"ERROR (subprocess): {e}", file=sys.stderr)
        sys.exit(e.returncode if e.returncode else 1)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
