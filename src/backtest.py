from __future__ import annotations

import warnings
from pathlib import Path

import duckdb
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.holtwinters import ExponentialSmoothing


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "data" / "finpulse.duckdb"
OUTPUT_DIR = ROOT / "data" / "processed"
CHART_DIR = ROOT / "dashboard" / "backtest"
MIN_TRAINING_QUARTERS = 12
MIN_QUARTER_DAYS = 70
MAX_QUARTER_DAYS = 120
COMPANIES = ["HPE", "DELL", "CSCO", "IBM", "NTAP"]


def load_revenue() -> pd.DataFrame:
    with duckdb.connect(str(DB_PATH), read_only=True) as connection:
        data = connection.execute(
            "SELECT company, period_end, revenue FROM financial_metrics "
            "WHERE revenue IS NOT NULL ORDER BY company, period_end"
        ).df()
    data["period_end"] = pd.to_datetime(data["period_end"])
    return data


def continuous_segments(data: pd.DataFrame) -> list[pd.DataFrame]:
    data = data.sort_values("period_end").drop_duplicates("period_end").reset_index(drop=True)
    if data.empty:
        return []
    day_gaps = data["period_end"].diff().dt.days
    segment_ids = day_gaps.lt(MIN_QUARTER_DAYS) | day_gaps.gt(MAX_QUARTER_DAYS)
    segment_ids.iloc[0] = True
    return [group.reset_index(drop=True) for _, group in data.groupby(segment_ids.cumsum())]


def forecast_models(history: np.ndarray) -> dict[str, float]:
    predictions = {
        "naive": float(history[-1]),
        "seasonal_naive": float(history[-4]),
        "drift": float(history[-1] + (history[-1] - history[0]) / (len(history) - 1)),
    }
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        try:
            fit = ExponentialSmoothing(
                history, trend="add", damped_trend=True, initialization_method="estimated"
            ).fit(optimized=True)
            predictions["holt_damped"] = float(fit.forecast(1)[0])
        except (ValueError, np.linalg.LinAlgError, FloatingPointError):
            pass
        try:
            fit = ARIMA(history, order=(1, 1, 0), trend="t").fit()
            predictions["arima_110"] = float(fit.forecast(1)[0])
        except (ValueError, np.linalg.LinAlgError, FloatingPointError):
            pass
    return {name: value for name, value in predictions.items() if np.isfinite(value)}


def rolling_origin_backtest(data: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    forecasts: list[dict] = []
    eligibility: list[dict] = []
    for company in COMPANIES:
        company_data = data.loc[data["company"] == company]
        segments = continuous_segments(company_data)
        segment_count = sum(len(segment) >= MIN_TRAINING_QUARTERS + 1 for segment in segments)
        test_origins = sum(max(0, len(segment) - MIN_TRAINING_QUARTERS) for segment in segments)
        eligibility.append(
            {
                "company": company,
                "revenue_observations": len(company_data),
                "continuous_segments": len(segments),
                "segments_eligible": segment_count,
                "rolling_origins": test_origins,
                "minimum_training_quarters": MIN_TRAINING_QUARTERS,
                "continuity_rule_days": f"{MIN_QUARTER_DAYS}-{MAX_QUARTER_DAYS}",
                "status": "eligible" if test_origins else "insufficient continuous history",
            }
        )
        for segment_number, segment in enumerate(segments, start=1):
            values = segment["revenue"].to_numpy(dtype=float)
            for origin in range(MIN_TRAINING_QUARTERS, len(segment)):
                history = values[:origin]
                actual = float(values[origin])
                scale = float(np.mean(np.abs(np.diff(history))))
                for model, forecast in forecast_models(history).items():
                    denominator = abs(actual) + abs(forecast)
                    forecasts.append(
                        {
                            "company": company,
                            "metric": "revenue",
                            "segment": segment_number,
                            "origin_period_end": segment.loc[origin - 1, "period_end"],
                            "target_period_end": segment.loc[origin, "period_end"],
                            "training_quarters": origin,
                            "model": model,
                            "actual": actual,
                            "forecast": forecast,
                            "absolute_error": abs(actual - forecast),
                            "squared_error": (actual - forecast) ** 2,
                            "ape": abs(actual - forecast) / abs(actual) if actual else np.nan,
                            "smape": 2 * abs(actual - forecast) / denominator if denominator else np.nan,
                            "mase": abs(actual - forecast) / scale if scale else np.nan,
                        }
                    )

    forecast_frame = pd.DataFrame(forecasts)
    if forecast_frame.empty:
        raise RuntimeError("No eligible continuous revenue histories for rolling-origin evaluation.")
    metrics = (
        forecast_frame.groupby(["company", "model"], as_index=False)
        .agg(
            forecast_origins=("absolute_error", "size"),
            mae=("absolute_error", "mean"),
            rmse=("squared_error", lambda values: float(np.sqrt(values.mean()))),
            mape=("ape", "mean"),
            smape=("smape", "mean"),
            mase=("mase", "mean"),
        )
    )
    naive_mae = metrics.loc[metrics["model"] == "naive", ["company", "mae"]].rename(
        columns={"mae": "naive_mae"}
    )
    metrics = metrics.merge(naive_mae, on="company", how="left")
    metrics["mae_skill_vs_naive"] = 1 - metrics["mae"] / metrics["naive_mae"]
    metrics = metrics.sort_values(["company", "mae"]).reset_index(drop=True)
    return forecast_frame, metrics, pd.DataFrame(eligibility)


def plot_mase(metrics: pd.DataFrame) -> Path:
    CHART_DIR.mkdir(parents=True, exist_ok=True)
    chart_path = CHART_DIR / "mase_by_company.png"
    pivot = metrics.pivot(index="company", columns="model", values="mase")
    order = [name for name in ["naive", "seasonal_naive", "drift", "holt_damped", "arima_110"] if name in pivot]
    pivot = pivot[order]
    axis = pivot.plot(kind="bar", figsize=(10, 5), color=["#176B87", "#E07A5F", "#4C956C", "#745296", "#D8A031"][: len(order)])
    axis.axhline(1, color="#667780", linestyle="--", linewidth=1, label="In-sample naive scale")
    axis.set(title="One-quarter-ahead revenue error by company", ylabel="Mean absolute scaled error (MASE)", xlabel="Company")
    axis.grid(axis="y", color="#D9E1E5", linewidth=0.7)
    axis.spines[["top", "right", "left"]].set_visible(False)
    axis.legend(frameon=False, ncol=3)
    axis.figure.tight_layout()
    axis.figure.savefig(chart_path, dpi=160, bbox_inches="tight")
    plt.close(axis.figure)
    return chart_path


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    data = load_revenue()
    forecasts, metrics, eligibility = rolling_origin_backtest(data)
    forecasts.to_csv(OUTPUT_DIR / "rolling_origin_forecasts.csv", index=False)
    metrics.to_csv(OUTPUT_DIR / "backtest_metrics.csv", index=False)
    eligibility.to_csv(OUTPUT_DIR / "backtest_eligibility.csv", index=False)
    chart = plot_mase(metrics)
    print("Rolling-origin eligibility:")
    print(eligibility.to_string(index=False))
    print("\nMean errors by company and model (lower is better):")
    print(metrics.to_string(index=False, formatters={"mape": "{:.1%}".format, "smape": "{:.1%}".format, "mae_skill_vs_naive": "{:.1%}".format}))
    print(f"\nSaved {len(forecasts)} forecast rows, metrics, and {chart}")


if __name__ == "__main__":
    main()
