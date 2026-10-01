from __future__ import annotations

from pathlib import Path

import duckdb


ROOT = Path(__file__).resolve().parents[1]
PARQUET_PATH = ROOT / "data" / "processed" / "quarterly_financials.parquet"
DB_PATH = ROOT / "data" / "finpulse.duckdb"
SQL_PATH = ROOT / "sql" / "views.sql"


def main() -> None:
    if not PARQUET_PATH.exists():
        raise FileNotFoundError(f"Run src/transform.py first; missing {PARQUET_PATH}")
    connection = duckdb.connect(str(DB_PATH))
    try:
        connection.execute(
            "CREATE OR REPLACE TABLE quarterly_financials AS SELECT * FROM read_parquet(?)",
            [str(PARQUET_PATH)],
        )
        connection.execute(SQL_PATH.read_text(encoding="utf-8"))
        result = connection.execute(
            "SELECT company, COUNT(*) AS quarters FROM financial_metrics "
            "GROUP BY company ORDER BY company"
        ).fetchall()
        print(f"Loaded {PARQUET_PATH.name} into {DB_PATH.name}")
        for company, count in result:
            print(f"{company}: {count} distinct quarter ends")
    finally:
        connection.close()


if __name__ == "__main__":
    main()
