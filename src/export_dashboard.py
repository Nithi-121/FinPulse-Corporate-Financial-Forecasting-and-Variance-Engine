from __future__ import annotations

from pathlib import Path

import duckdb
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "data" / "finpulse.duckdb"
PROCESSED_DIR = ROOT / "data" / "processed"
EXPORT_DIR = ROOT / "dashboard" / "exports"


def main() -> None:
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    with duckdb.connect(str(DB_PATH), read_only=True) as connection:
        tables = {
            "financial_metrics.csv": "SELECT * FROM financial_metrics ORDER BY company, period_end",
            "financial_growth.csv": "SELECT * FROM financial_growth ORDER BY company, period_end",
        }
        for filename, query in tables.items():
            frame = connection.execute(query).df()
            frame.to_csv(EXPORT_DIR / filename, index=False)
            print(f"Exported {len(frame):,} rows: {filename}")

    processed_files = [
        "backtest_metrics.csv",
        "rolling_origin_forecasts.csv",
        "forecast_variance_by_model.csv",
        "forecast_residual_anomalies.csv",
        "margin_anomaly_scores.csv",
        "margin_anomalies.csv",
        "margin_anomaly_eligibility.csv",
    ]
    for filename in processed_files:
        source = PROCESSED_DIR / filename
        if not source.exists():
            raise FileNotFoundError(f"Run Phase 5 and Phase 6 before exporting: {source}")
        frame = pd.read_csv(source)
        frame.to_csv(EXPORT_DIR / filename, index=False)
        print(f"Exported {len(frame):,} rows: {filename}")


if __name__ == "__main__":
    main()
