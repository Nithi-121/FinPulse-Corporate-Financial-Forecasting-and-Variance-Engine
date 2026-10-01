# Phase 5 revenue backtest

Generated 2026-09-30 from the current SEC Company Facts snapshot. Recreate with the Phase 5 command in `README.md`. This is an initial model comparison, not a production model selection.

## Protocol

- Forecast target: reported quarterly revenue, one quarter ahead.
- Validation: expanding-window rolling origins; each forecast is made using only earlier observations in that uninterrupted segment.
- Minimum training history: 12 quarters. A run is split when adjacent period ends are not 70-120 days apart. Missing quarters are not interpolated.
- Models: last-value naive, four-quarter seasonal naive, drift, damped Holt trend, and ARIMA(1,1,0) with drift.
- Metrics: MAE, RMSE, MAPE, sMAPE, MASE, and MAE skill versus naive. Lower errors are better; positive skill means lower MAE than naive.

## Coverage and initial results

There are 53 forecast origins across four eligible issuers (265 model forecasts when all five models fit). The company-specific sample sizes are small, especially HPE. IBM is excluded because the current revenue series has recurring approximately 182-day gaps and no uninterrupted 13-quarter run.

| Company | Origins | Lowest MAE model | MAE skill vs naive | Best-model MASE | Seasonal-naive skill vs naive |
|---|---:|---|---:|---:|---:|
| CSCO | 14 | Naive | 0.0% | 0.88 | -98.1% |
| DELL | 21 | ARIMA(1,1,0) | 9.0% | 1.19 | -88.7% |
| HPE | 7 | Seasonal naive | 2.2% | 1.67 | 2.2% |
| NTAP | 11 | Seasonal naive | 64.3% | 0.37 | 64.3% |

Seasonal naive is not uniformly competitive. Its strong NTAP result and weak CSCO/DELL results are hypotheses for further review, not stable conclusions. HPE's apparent 2.2% gain is too small to rely on with seven origins. The winners above are selected on the same limited backtest used to score them, so their errors are optimistically biased; retain naive as a credible fallback and reserve later periods or nested validation for selection.

## Important limitations

- Data are latest-restated, not point-in-time. A historical origin can therefore contain values revised after that date.
- Revenue facts have structural gaps. Excluding broken runs prevents fake quarter adjacency but sharply reduces evaluation coverage.
- Continuity uses 70-120 day period-end spacing because fiscal year/quarter labels are not consistent enough for this check in every company's history.
- One-quarter-ahead performance says nothing directly about multi-quarter forecasts. Phase 6 should define intended horizons and prediction intervals before deployment.
- Check DELL, HPE, and NTAP acquisition/reporting changes against filings before using historical growth as a recurring pattern.

## Reproducible outputs

- `data/processed/rolling_origin_forecasts.csv`: every origin/model/actual/forecast/error.
- `data/processed/backtest_metrics.csv`: aggregate metrics by company and model.
- `data/processed/backtest_eligibility.csv`: coverage, segment count, and origin count by company.
- `dashboard/backtest/mase_by_company.png`: scaled error comparison.
- `src/backtest.py`: complete rolling-origin implementation.
