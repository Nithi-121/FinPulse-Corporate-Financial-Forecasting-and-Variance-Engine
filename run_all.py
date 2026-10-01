from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
PIPELINE_STEPS = (
    "src/extract.py",
    "src/transform.py",
    "src/load.py",
    "src/eda.py",
    "src/backtest.py",
    "src/variance.py",
    "src/export_dashboard.py",
)


def run_pipeline() -> None:
    user_agent = os.environ.get("SEC_USER_AGENT", "").strip()
    if not user_agent or "@" not in user_agent:
        raise SystemExit(
            "Set SEC_USER_AGENT to a descriptive project name and contact email before running the pipeline."
        )

    for step in PIPELINE_STEPS:
        print(f"\n=== {step} ===", flush=True)
        subprocess.run([sys.executable, str(ROOT / step)], cwd=ROOT, check=True)

    print("\nFinPulse pipeline completed successfully.", flush=True)


if __name__ == "__main__":
    run_pipeline()
