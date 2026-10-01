from __future__ import annotations

import json
import os
import re
import time
from pathlib import Path

import requests


ROOT = Path(__file__).resolve().parents[1]
COMPANIES_PATH = ROOT / "config" / "companies.json"
RAW_DIR = ROOT / "data" / "raw"
API_URL = "https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json"


def get_user_agent() -> str:
    user_agent = os.environ.get("SEC_USER_AGENT", "").strip()
    if not user_agent or "@" not in user_agent:
        raise RuntimeError("Set SEC_USER_AGENT to a project name and contact email before requesting SEC data.")
    return user_agent


def fetch_company_facts(session: requests.Session, ticker: str, cik: str) -> Path:
    output_path = RAW_DIR / f"{ticker.lower()}_companyfacts.json"
    if output_path.exists() and output_path.stat().st_size > 0:
        print(f"Using cached {ticker}: {output_path.name} ({output_path.stat().st_size:,} bytes)")
        return output_path

    response = session.get(API_URL.format(cik=cik), timeout=(10, 60))
    response.raise_for_status()
    payload = response.json()
    actual_cik = str(payload.get("cik", "")).zfill(10)
    if actual_cik != cik or not isinstance(payload.get("facts"), dict):
        raise ValueError(f"Unexpected SEC Company Facts response for {ticker}: CIK={actual_cik}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = output_path.with_suffix(".json.tmp")
    temp_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    temp_path.replace(output_path)
    print(f"Downloaded {ticker}: {output_path.name} ({output_path.stat().st_size:,} bytes)")
    return output_path


def main() -> None:
    user_agent = get_user_agent()
    companies = json.loads(COMPANIES_PATH.read_text(encoding="utf-8"))
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    with requests.Session() as session:
        session.headers.update({"User-Agent": user_agent, "Accept-Encoding": "gzip, deflate", "Accept": "application/json"})
        for index, (ticker, cik) in enumerate(companies.items()):
            if not re.fullmatch(r"\d{10}", cik):
                raise ValueError(f"Invalid 10-digit CIK for {ticker}: {cik!r}")
            fetch_company_facts(session, ticker, cik)
            if index < len(companies) - 1:
                time.sleep(0.2)
    print(f"Complete: {len(companies)} company facts files in {RAW_DIR}")


if __name__ == "__main__":
    main()
