from __future__ import annotations

from pathlib import Path

import duckdb
import matplotlib.pyplot as plt
import pandas as pd
from itertools import combinations
from statsmodels.graphics.tsaplots import plot_acf
from statsmodels.tsa.stattools import adfuller


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "data" / "finpulse.duckdb"
OUTPUT_DIR = ROOT / "data" / "processed"
CHART_DIR = ROOT / "dashboard" / "eda"
COMPANIES = ["HPE", "DELL", "CSCO", "IBM", "NTAP"]


def load_data() -> tuple[pd.DataFrame, pd.DataFrame]:
    with duckdb.connect(str(DB_PATH), read_only=True) as connection:
        metrics = connection.execute("SELECT * FROM financial_metrics ORDER BY company, period_end").df()
        growth = connection.execute("SELECT * FROM financial_growth ORDER BY company, period_end").df()
    metrics["period_end"] = pd.to_datetime(metrics["period_end"])
    growth["period_end"] = pd.to_datetime(growth["period_end"])
    return metrics, growth


def build_hypothesis_matrix(metrics: pd.DataFrame, growth: pd.DataFrame) -> pd.DataFrame:
    seasonal_strength = []
    margin_vs_growth = []
    growth_persistence = []

    for company, frame in metrics.groupby("company"):
        revenue = frame.dropna(subset=["revenue"])
        if len(revenue) >= 12:
            normalized = revenue.groupby("fiscal_quarter")["revenue"].mean() / revenue["revenue"].mean()
            if normalized.size == 4:
                seasonal_strength.append(float(normalized.max() - normalized.min()))

        g = growth[growth["company"] == company]
        margin = frame["gross_margin"].dropna()
        revenue_growth = g["revenue_yoy_growth"].dropna()
        if len(margin) >= 8 and len(revenue_growth) >= 8:
            margin_vs_growth.append(float(margin.std() < revenue_growth.std()))
        if len(revenue_growth) >= 10:
            growth_persistence.append(float(revenue_growth.autocorr(lag=1)))

    peer_source = growth.dropna(subset=["revenue_yoy_growth"]).copy()
    peer_source["calendar_quarter"] = peer_source["period_end"].dt.to_period("Q").astype(str)
    peer_growth = peer_source.pivot(index="calendar_quarter", columns="company", values="revenue_yoy_growth")
    peer_pairs = []
    for left, right in combinations(peer_growth.columns, 2):
        paired = peer_growth[[left, right]].dropna()
        if len(paired) >= 8:
            peer_pairs.append(float(paired[left].corr(paired[right])))
    median_peer_corr = float(pd.Series(peer_pairs).median()) if peer_pairs else float("nan")

    rows = [
        {
            "hypothesis": "Revenue has a repeatable fiscal-quarter pattern",
            "test": "Within-company fiscal-quarter mean revenue, normalized by company mean",
            "result": "Supported descriptively" if seasonal_strength and pd.Series(seasonal_strength).median() > 0.05 else "Not supported descriptively",
            "evidence": f"Median max-minus-min quarter index spread: {pd.Series(seasonal_strength).median():.1%}" if seasonal_strength else "Insufficient four-quarter coverage",
        },
        {
            "hypothesis": "Gross margin is less variable than YoY revenue growth",
            "test": "Compare within-company standard deviations where both series have at least 8 observations",
            "result": "Supported descriptively" if margin_vs_growth and pd.Series(margin_vs_growth).mean() > 0.5 else "Not supported descriptively",
            "evidence": f"Margin standard deviation is lower for {int(sum(margin_vs_growth))}/{len(margin_vs_growth)} comparable companies" if margin_vs_growth else "Insufficient overlapping history",
        },
        {
            "hypothesis": "Revenue growth persists from one quarter to the next",
            "test": "Lag-1 autocorrelation of YoY revenue growth",
            "result": "Supported descriptively" if growth_persistence and pd.Series(growth_persistence).median() > 0.25 else "Not supported descriptively",
            "evidence": f"Median company lag-1 autocorrelation: {pd.Series(growth_persistence).median():.2f}" if growth_persistence else "Insufficient growth history",
        },
        {
            "hypothesis": "Peer companies' YoY revenue growth moves together",
            "test": "Pairwise YoY growth correlations by calendar quarter; at least 8 overlaps",
            "result": "Supported descriptively" if pd.notna(median_peer_corr) and median_peer_corr > 0 else ("Not supported descriptively" if pd.notna(median_peer_corr) else "Insufficient overlap"),
            "evidence": f"Median pairwise correlation: {median_peer_corr:.2f} across {len(peer_pairs)} company pairs" if pd.notna(median_peer_corr) else "Fewer than 8 calendar-quarter overlaps for every company pair",
        },
        {
            "hypothesis": "Seasonal naive is a competitive baseline",
            "test": "Four-quarter rolling-origin backtest against naive and candidate models",
            "result": "Evaluated in Phase 5",
            "evidence": "See BACKTEST_FINDINGS.md; performance varies by company and eligible history is limited",
        },
    ]
    return pd.DataFrame(rows)


def save_chart(fig: plt.Figure, filename: str) -> None:
    CHART_DIR.mkdir(parents=True, exist_ok=True)
    fig.tight_layout()
    fig.savefig(CHART_DIR / filename, dpi=160, bbox_inches="tight")
    plt.close(fig)


def plot_facet_series(data: pd.DataFrame, value: str, title: str, ylabel: str, filename: str) -> None:
    fig, axes = plt.subplots(len(COMPANIES), 1, figsize=(11, 12), sharex=True)
    for axis, company in zip(axes, COMPANIES):
        subset = data[data["company"] == company].sort_values("period_end")
        if subset[value].notna().any():
            axis.plot(subset["period_end"], subset[value], color="#176B87", linewidth=1.6)
        else:
            axis.text(0.5, 0.5, "Metric unavailable", ha="center", va="center", transform=axis.transAxes)
        axis.set_title(company, loc="left", fontsize=10, fontweight="bold")
        axis.set_ylabel(ylabel)
        axis.grid(axis="y", color="#D9E1E5", linewidth=0.7)
        axis.spines[["top", "right", "left"]].set_visible(False)
    axes[-1].set_xlabel("Fiscal period end")
    fig.suptitle(title, y=1.005, fontsize=14, fontweight="bold")
    save_chart(fig, filename)


def create_charts(metrics: pd.DataFrame, growth: pd.DataFrame) -> list[Path]:
    CHART_DIR.mkdir(parents=True, exist_ok=True)
    plot_facet_series(metrics, "revenue", "Reported quarterly revenue by company", "USD", "revenue_by_company.png")
    plot_facet_series(growth, "revenue_yoy_growth", "Year-over-year revenue growth", "Growth", "revenue_yoy_growth.png")
    plot_facet_series(metrics, "gross_margin", "Reported or derived gross margin", "Margin", "gross_margin.png")
    plot_facet_series(metrics, "operating_margin", "Operating margin", "Margin", "operating_margin.png")

    seasonal = metrics.dropna(subset=["revenue"]).copy()
    seasonal["revenue_index"] = seasonal["revenue"] / seasonal.groupby("company")["revenue"].transform("mean") * 100
    seasonal = seasonal.groupby(["company", "fiscal_quarter"], as_index=False)["revenue_index"].mean()
    fig, axis = plt.subplots(figsize=(9, 5))
    for company, frame in seasonal.groupby("company"):
        frame = frame.set_index("fiscal_quarter").reindex(["Q1", "Q2", "Q3", "Q4"])
        axis.plot(frame.index, frame["revenue_index"], marker="o", linewidth=1.8, label=company)
    axis.axhline(100, color="#667780", linestyle="--", linewidth=1)
    axis.set(title="Average revenue by fiscal quarter (company mean = 100)", ylabel="Indexed revenue")
    axis.grid(axis="y", color="#D9E1E5", linewidth=0.7)
    axis.spines[["top", "right", "left"]].set_visible(False)
    axis.legend(ncol=5, frameon=False, loc="upper center", bbox_to_anchor=(0.5, -0.14))
    save_chart(fig, "fiscal_quarter_seasonality.png")

    fig, axes = plt.subplots(len(COMPANIES), 1, figsize=(10, 12))
    for axis, company in zip(axes, COMPANIES):
        values = growth.loc[growth["company"] == company, "revenue_yoy_growth"].dropna()
        axis.set_title(company, loc="left", fontsize=10, fontweight="bold")
        if len(values) >= 8:
            plot_acf(values, lags=min(12, len(values) // 2 - 1), ax=axis, zero=False, bartlett_confint=False)
        else:
            axis.text(0.5, 0.5, "Insufficient history", ha="center", va="center", transform=axis.transAxes)
        axis.grid(axis="y", color="#D9E1E5", linewidth=0.7)
    fig.suptitle("Autocorrelation of YoY revenue growth", y=1.005, fontsize=14, fontweight="bold")
    save_chart(fig, "yoy_growth_acf.png")
    return sorted(CHART_DIR.glob("*.png"))


def adf_diagnostics(metrics: pd.DataFrame, growth_data: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for company in COMPANIES:
        series = metrics.loc[metrics["company"] == company].sort_values("period_end")
        for metric in ["revenue"]:
            values = series[metric].dropna()
            if len(values) >= 12:
                result = adfuller(values, autolag="AIC", result_object=True)
                rows.append({"company": company, "series": metric, "n": len(values), "adf_statistic": result.statistic, "p_value": result.pvalue, "used_lags": result.lags, "observations": result.nobs})
        growth = growth_data.loc[growth_data["company"] == company, "revenue_yoy_growth"].dropna()
        if len(growth) >= 12:
            result = adfuller(growth, autolag="AIC", result_object=True)
            rows.append({"company": company, "series": "revenue_yoy_growth", "n": len(growth), "adf_statistic": result.statistic, "p_value": result.pvalue, "used_lags": result.lags, "observations": result.nobs})
    return pd.DataFrame(rows)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    metrics, growth = load_data()
    matrix = build_hypothesis_matrix(metrics, growth)
    diagnostics = adf_diagnostics(metrics, growth)
    charts = create_charts(metrics, growth)
    matrix.to_csv(OUTPUT_DIR / "hypothesis_matrix.csv", index=False)
    diagnostics.to_csv(OUTPUT_DIR / "adf_diagnostics.csv", index=False)
    print("Hypothesis matrix:")
    print(matrix.to_string(index=False))
    print("\nADF diagnostics (p-values are diagnostics, not model-quality scores):")
    print(diagnostics.to_string(index=False))
    print(f"\nSaved {len(charts)} charts to {CHART_DIR}")
    for chart in charts:
        print(f"- {chart.name}")


if __name__ == "__main__":
    main()
