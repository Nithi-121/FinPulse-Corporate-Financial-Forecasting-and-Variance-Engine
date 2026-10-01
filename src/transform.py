from __future__ import annotations

import json
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw"
PROCESSED_DIR = ROOT / "data" / "processed"
COMPANIES = json.loads((ROOT / "config" / "companies.json").read_text(encoding="utf-8"))
TAG_GROUPS = json.loads((ROOT / "config" / "tag_map.json").read_text(encoding="utf-8"))


def load_tag_facts(ticker: str, cik: str, tag: str) -> pd.DataFrame:
    path = RAW_DIR / f"{ticker.lower()}_companyfacts.json"
    payload = json.loads(path.read_text(encoding="utf-8"))
    if str(payload.get("cik", "")).zfill(10) != cik:
        raise ValueError(f"CIK mismatch in {path.name}: expected {cik}")
    concept = payload.get("facts", {}).get("us-gaap", {}).get(tag)
    if not concept:
        return pd.DataFrame()

    rows = []
    for fact in concept.get("units", {}).get("USD", []):
        if fact.get("form") not in {"10-Q", "10-K"} or not fact.get("start") or not fact.get("end"):
            continue
        rows.append({
            "company": ticker,
            "tag": tag,
            "period_start": fact["start"],
            "period_end": fact["end"],
            "value": float(fact["val"]),
            "unit": "USD",
            "form": fact["form"],
            "fiscal_year": fact.get("fy"),
            "fiscal_period": fact.get("fp"),
            "filed": fact.get("filed"),
            "accn": fact.get("accn"),
            "frame": fact.get("frame"),
        })

    result = pd.DataFrame(rows)
    if result.empty:
        return result
    result["period_start"] = pd.to_datetime(result["period_start"])
    result["period_end"] = pd.to_datetime(result["period_end"])
    result["filed"] = pd.to_datetime(result["filed"])
    result["duration_days"] = (result["period_end"] - result["period_start"]).dt.days + 1
    return result.sort_values(["filed", "accn"]).drop_duplicates(
        ["tag", "period_start", "period_end"], keep="last"
    )


def resolve_metric_facts(ticker: str, cik: str, metric: str) -> pd.DataFrame:
    candidates = []
    for priority, tag_group in enumerate(TAG_GROUPS[metric]):
        tag_frames = [load_tag_facts(ticker, cik, tag) for tag in tag_group]
        if any(frame.empty for frame in tag_frames):
            continue
        result = tag_frames[0].copy()
        for component in tag_frames[1:]:
            result = result.merge(
                component,
                on=["company", "period_start", "period_end", "unit", "form", "fiscal_year", "fiscal_period", "filed", "accn"],
                suffixes=("", "_component"),
            )
            result["value"] = result["value"] + result.pop("value_component")
            result["tag"] = result["tag"] + "+" + result.pop("tag_component")
            if "frame_component" in result:
                result["frame"] = result["frame"].fillna(result.pop("frame_component"))
            result = result.drop(columns=["duration_days_component"], errors="ignore")
        if result.empty:
            continue
        result["metric"] = metric
        result["tag_priority"] = priority
        candidates.append(result)

    if not candidates:
        return pd.DataFrame()
    combined = pd.concat(candidates, ignore_index=True)
    combined = combined.sort_values(["filed", "tag_priority"], ascending=[False, True], na_position="last")
    return combined.drop_duplicates(
        ["company", "metric", "period_start", "period_end"], keep="first"
    ).drop(columns="tag_priority")


def duration_kind(days: int) -> str:
    if 70 <= days <= 110:
        return "quarter"
    if 235 <= days <= 300:
        return "nine_month_ytd"
    if 330 <= days <= 400:
        return "annual"
    return "other"


def make_quarter_rows(facts: pd.DataFrame) -> pd.DataFrame:
    if facts.empty:
        return facts
    facts = facts.copy()
    facts["kind"] = facts["duration_days"].map(duration_kind)
    rows = []
    for record in facts[facts["kind"] == "quarter"].to_dict("records"):
        rows.append({**record, "fiscal_quarter": record["fiscal_period"], "source_type": "reported_quarter"})

    annuals = facts[facts["kind"] == "annual"]
    nine_months = facts[facts["kind"] == "nine_month_ytd"]
    for annual in annuals.to_dict("records"):
        matches = nine_months[
            (nine_months["period_start"] == annual["period_start"])
            & (nine_months["period_end"] < annual["period_end"])
        ]
        if pd.notna(annual["fiscal_year"]):
            matches = matches[matches["fiscal_year"] == annual["fiscal_year"]]
        if matches.empty:
            continue
        ytd = matches.sort_values("period_end").iloc[-1]
        rows.append({
            **annual,
            "period_start": ytd["period_end"] + pd.DateOffset(days=1),
            "value": annual["value"] - ytd["value"],
            "fiscal_quarter": "Q4",
            "source_type": "derived_q4_annual_less_ytd",
        })

    if not rows:
        return pd.DataFrame()
    result = pd.DataFrame(rows)
    result["source_priority"] = result["source_type"].map({"reported_quarter": 0, "derived_q4_annual_less_ytd": 1})
    result["has_frame"] = result["frame"].notna()
    result = result.sort_values(["source_priority", "has_frame", "filed"], ascending=[True, False, False], na_position="last")
    result = result.drop_duplicates(["company", "metric", "period_end"], keep="first")
    return result.drop(columns=["kind", "source_priority", "has_frame"], errors="ignore")


def build_company(ticker: str, cik: str) -> list[pd.DataFrame]:
    outputs = []
    for metric in TAG_GROUPS:
        facts = resolve_metric_facts(ticker, cik, metric)
        quarters = make_quarter_rows(facts)
        if quarters.empty:
            print(f"WARNING {ticker}: no quarter facts for {metric}")
            continue
        outputs.append(quarters)
        print(f"{ticker} {metric}: {len(quarters)} quarters, {quarters['period_end'].min().date()} to {quarters['period_end'].max().date()}")
    return outputs


def derive_gross_profit(financials: pd.DataFrame) -> pd.DataFrame:
    existing = financials[financials["metric"] == "gross_profit"]
    have = set(zip(existing["company"], existing["period_end"]))
    revenue = financials[financials["metric"] == "revenue"].set_index(["company", "period_end"])
    cost = financials[financials["metric"] == "cost_of_revenue"].set_index(["company", "period_end"])
    rows = []
    for company, period_end in revenue.index.intersection(cost.index):
        if (company, period_end) in have:
            continue
        rev, cor = revenue.loc[(company, period_end)], cost.loc[(company, period_end)]
        rows.append({
            "company": company,
            "metric": "gross_profit",
            "period_start": rev["period_start"],
            "period_end": period_end,
            "value": rev["value"] - cor["value"],
            "unit": "USD",
            "form": rev["form"],
            "fiscal_year": rev["fiscal_year"],
            "fiscal_period": rev["fiscal_period"],
            "filed": rev["filed"],
            "accn": rev["accn"],
            "frame": rev.get("frame"),
            "tag": f"DERIVED({rev['tag']} - {cor['tag']})",
            "duration_days": rev["duration_days"],
            "fiscal_quarter": rev["fiscal_quarter"],
            "source_type": "derived_revenue_less_cost",
        })
    return pd.concat([financials, pd.DataFrame(rows)], ignore_index=True) if rows else financials


def main() -> None:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    frames = []
    for ticker, cik in COMPANIES.items():
        frames.extend(build_company(ticker, cik))
    if not frames:
        raise RuntimeError("No quarterly financial facts were created")
    financials = derive_gross_profit(pd.concat(frames, ignore_index=True))
    financials["fiscal_quarter"] = financials["fiscal_quarter"].replace({"FY": "Q4"})
    financials = financials.rename(columns={"fiscal_period": "reported_fiscal_period"})
    financials = financials.sort_values(["company", "metric", "period_end"])
    out_path = PROCESSED_DIR / "quarterly_financials.parquet"
    financials.to_parquet(out_path, index=False)
    print(f"\nWrote {len(financials):,} rows to {out_path}")
    print(financials.groupby(["company", "metric"]).size().to_string())


if __name__ == "__main__":
    main()
