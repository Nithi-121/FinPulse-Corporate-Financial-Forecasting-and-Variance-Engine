from __future__ import annotations

from pathlib import Path

import duckdb
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "data" / "finpulse.duckdb"
OUTPUT_DIR = ROOT / "data" / "processed"
CHART_DIR = ROOT / "dashboard" / "anomalies"
COMPANIES = ["HPE", "DELL", "CSCO", "IBM", "NTAP"]
MARGIN_METRICS = ["gross_margin", "operating_margin"]
MIN_RESIDUAL_HISTORY = 8
RESIDUAL_Z_THRESHOLD = 2.5
MIN_MARGIN_OBSERVATIONS = 20


def load_margins() -> pd.DataFrame:
    with duckdb.connect(str(DB_PATH), read_only=True) as connection:
        data = connection.execute(
            "SELECT company, period_end, gross_margin, operating_margin "
            "FROM financial_metrics ORDER BY company, period_end"
        ).df()
    data["period_end"] = pd.to_datetime(data["period_end"])
    return data


def add_trailing_residual_zscore(data: pd.DataFrame) -> pd.DataFrame:
    scored_groups = []
    for _, group in data.groupby("company", sort=False):
        group = group.sort_values("target_period_end").copy()
        residuals: list[float] = []
        zscores: list[float] = []
        for residual in group["variance_amount"].astype(float):
            if len(residuals) >= MIN_RESIDUAL_HISTORY:
                scale = float(np.std(residuals, ddof=1))
                zscores.append((residual - float(np.mean(residuals))) / scale if scale else np.nan)
            else:
                zscores.append(np.nan)
            residuals.append(residual)
        group["trailing_residual_zscore"] = zscores
        scored_groups.append(group)
    if not scored_groups:
        data["trailing_residual_zscore"] = pd.Series(dtype=float)
        return data
    return pd.concat(scored_groups, ignore_index=True)


def forecast_variances(forecasts: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    variances = forecasts.copy()
    variances["target_period_end"] = pd.to_datetime(variances["target_period_end"])
    variances["origin_period_end"] = pd.to_datetime(variances["origin_period_end"])
    variances["variance_amount"] = variances["actual"] - variances["forecast"]
    variances["variance_pct_of_forecast"] = np.where(
        variances["forecast"].abs() > 0,
        variances["variance_amount"] / variances["forecast"].abs(),
        np.nan,
    )
    baseline = variances.loc[variances["model"] == "naive"].copy()
    baseline = add_trailing_residual_zscore(baseline)
    baseline["anomaly_flag"] = baseline["trailing_residual_zscore"].abs() >= RESIDUAL_Z_THRESHOLD
    baseline["anomaly_method"] = "trailing naive residual z-score"
    return variances, baseline


def margin_anomalies(data: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    scored_frames = []
    eligibility = []
    for company in COMPANIES:
        for metric in MARGIN_METRICS:
            series = data.loc[data["company"] == company, ["company", "period_end", metric]].dropna().copy()
            count = len(series)
            is_eligible = count >= MIN_MARGIN_OBSERVATIONS
            eligibility.append(
                {
                    "company": company,
                    "metric": metric,
                    "observations": count,
                    "minimum_observations": MIN_MARGIN_OBSERVATIONS,
                    "status": "scored retrospectively" if is_eligible else "insufficient observations",
                }
            )
            if not is_eligible:
                continue
            estimator = IsolationForest(
                n_estimators=200,
                contamination=0.05,
                random_state=42,
            )
            values = series[[metric]].to_numpy(dtype=float)
            estimator.fit(values)
            series["anomaly_score"] = -estimator.score_samples(values)
            series["anomaly_flag"] = estimator.predict(values) == -1
            series["anomaly_method"] = "retrospective Isolation Forest; contamination=0.05"
            series = series.rename(columns={metric: "margin_value"})
            series["metric"] = metric
            scored_frames.append(series)
    scores = pd.concat(scored_frames, ignore_index=True) if scored_frames else pd.DataFrame()
    return scores, pd.DataFrame(eligibility)


def plot_variances(baseline: pd.DataFrame) -> Path:
    CHART_DIR.mkdir(parents=True, exist_ok=True)
    fig, axes = plt.subplots(len(COMPANIES), 1, figsize=(11, 10), sharex=True)
    for axis, company in zip(axes, COMPANIES):
        subset = baseline.loc[baseline["company"] == company].sort_values("target_period_end")
        axis.axhline(0, color="#667780", linewidth=0.8)
        plotted = subset["variance_pct_of_forecast"].mul(100).copy()
        gaps = subset["target_period_end"].diff().dt.days
        plotted.loc[gaps.notna() & ~gaps.between(70, 120)] = np.nan
        axis.plot(subset["target_period_end"], plotted, color="#176B87", linewidth=1.2)
        flagged = subset[subset["anomaly_flag"]]
        axis.scatter(flagged["target_period_end"], flagged["variance_pct_of_forecast"] * 100, color="#D1495B", s=30, zorder=3)
        axis.set_title(company, loc="left", fontsize=10, fontweight="bold")
        axis.set_ylabel("Variance %")
        axis.grid(axis="y", color="#D9E1E5", linewidth=0.7)
        axis.spines[["top", "right", "left"]].set_visible(False)
    axes[-1].set_xlabel("Target period end")
    fig.suptitle("Actual minus naive forecast, as % of forecast", y=1.005, fontsize=14, fontweight="bold")
    fig.tight_layout()
    path = CHART_DIR / "naive_forecast_variance.png"
    fig.savefig(path, dpi=160, bbox_inches="tight")
    plt.close(fig)
    return path


def plot_margin_scores(scores: pd.DataFrame, metric: str) -> Path:
    CHART_DIR.mkdir(parents=True, exist_ok=True)
    fig, axes = plt.subplots(len(COMPANIES), 1, figsize=(11, 10), sharex=True)
    for axis, company in zip(axes, COMPANIES):
        subset = scores.loc[(scores["company"] == company) & (scores["metric"] == metric)].sort_values("period_end")
        if subset.empty:
            axis.text(0.5, 0.5, "Insufficient history or metric unavailable", ha="center", va="center", transform=axis.transAxes)
        else:
            plotted = subset["margin_value"].copy()
            gaps = subset["period_end"].diff().dt.days
            plotted.loc[gaps.notna() & ~gaps.between(70, 120)] = np.nan
            subset["plot_value"] = plotted
            normal = subset[~subset["anomaly_flag"]]
            flagged = subset[subset["anomaly_flag"]]
            axis.plot(subset["period_end"], subset["plot_value"], color="#176B87", linewidth=1.1)
            axis.scatter(normal["period_end"], normal["margin_value"], color="#176B87", s=14)
            axis.scatter(flagged["period_end"], flagged["margin_value"], color="#D1495B", s=32, zorder=3)
        axis.set_title(company, loc="left", fontsize=10, fontweight="bold")
        axis.set_ylabel("Margin")
        axis.grid(axis="y", color="#D9E1E5", linewidth=0.7)
        axis.spines[["top", "right", "left"]].set_visible(False)
    axes[-1].set_xlabel("Fiscal period end")
    fig.suptitle(f"{metric.replace('_', ' ').title()} anomaly candidates", y=1.005, fontsize=14, fontweight="bold")
    fig.tight_layout()
    path = CHART_DIR / f"{metric}_anomalies.png"
    fig.savefig(path, dpi=160, bbox_inches="tight")
    plt.close(fig)
    return path


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    forecasts = pd.read_csv(OUTPUT_DIR / "rolling_origin_forecasts.csv")
    variances, residual_scores = forecast_variances(forecasts)
    margins = load_margins()
    margin_scores, eligibility = margin_anomalies(margins)
    residual_flags = residual_scores.loc[residual_scores["anomaly_flag"]].copy()
    margin_flags = margin_scores.loc[margin_scores["anomaly_flag"]].copy()
    variances.to_csv(OUTPUT_DIR / "forecast_variance_by_model.csv", index=False)
    residual_scores.to_csv(OUTPUT_DIR / "naive_residual_scores.csv", index=False)
    residual_flags.to_csv(OUTPUT_DIR / "forecast_residual_anomalies.csv", index=False)
    margin_scores.to_csv(OUTPUT_DIR / "margin_anomaly_scores.csv", index=False)
    margin_flags.to_csv(OUTPUT_DIR / "margin_anomalies.csv", index=False)
    eligibility.to_csv(OUTPUT_DIR / "margin_anomaly_eligibility.csv", index=False)
    plots = [plot_variances(residual_scores)]
    plots.extend(plot_margin_scores(margin_scores, metric) for metric in MARGIN_METRICS)
    print("Forecast variance rows by model:")
    print(variances.groupby(["company", "model"]).size().to_string())
    print("\nTrailing naive residual anomalies (abs z >= 2.5):")
    if residual_flags.empty:
        print("None")
    else:
        print(residual_flags[["company", "target_period_end", "actual", "forecast", "variance_pct_of_forecast", "trailing_residual_zscore"]].to_string(index=False))
    print("\nMargin anomaly eligibility:")
    print(eligibility.to_string(index=False))
    print(f"\nFlagged margin observations: {len(margin_flags)}")
    print(f"Saved charts to {CHART_DIR}")
    for path in plots:
        print(f"- {path.name}")


if __name__ == "__main__":
    main()
