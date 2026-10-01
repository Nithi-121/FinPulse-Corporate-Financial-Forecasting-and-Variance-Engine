# FinPulse Interview Preparation

## Why did you start with simple forecasting baselines?

Quarterly company histories are short and uneven. A last-value naive forecast is a useful floor, while seasonal naive tests whether the same fiscal quarter last year adds information. More complicated models should earn their place on expanding-window backtests rather than on a random split.

## Why did seasonal naive not win everywhere?

The result varies by issuer. It was much worse than naive for CSCO and DELL, marginally better for HPE, and substantially better for NTAP in this sample. HPE has only seven forecast origins, so its small apparent gain is especially uncertain. These results are a baseline comparison, not proof of a stable model ranking.

## How did you construct Q4 when filings report year-to-date values?

For matching fiscal-year periods, I subtract the latest nine-month year-to-date value from the annual value. I preserve the filing/tag provenance and prefer directly reported quarterly facts when available. The method and reconciliation caveats are documented in `DATA_QUALITY.md`.

## How did you prevent look-ahead leakage?

Each rolling origin trains only on earlier observations from the same uninterrupted revenue segment. The training window expands over time; no random split or interpolation is used. Residual anomaly z-scores also use prior errors only. One remaining limitation is that the SEC Company Facts data are latest-restated rather than point-in-time snapshots.

## Why is IBM excluded from the revenue backtest?

Its current revenue facts contain recurring gaps of roughly six months. The pipeline requires a minimum continuous run of quarterly observations and does not invent the missing quarters, so IBM has no eligible rolling-origin segment under that rule.

## What did the anomaly review find?

The flags include both business events and reporting-basis changes. For example, the DELL FY2021 Q1 variance reflects a later discontinued-operations presentation, while DELL FY2027 Q1 has a genuine scale change supported by the reported AI server demand. Statistical flags are investigation candidates, not automatic accounting errors.

## What would you improve next?

Add point-in-time filing snapshots and a genuine four-quarter-ahead backtest with calibrated prediction intervals. Then compare any more complex model against the same issuer-specific naive baseline on a later untouched evaluation window.

## Resume bullet drafts

- Built a corporate financial analytics pipeline that normalized SEC XBRL filings for five technology companies into quarterly revenue, income, and margin metrics using Python, Pandas, Parquet, and DuckDB.
- Implemented expanding-window rolling-origin evaluation across 53 eligible one-quarter revenue origins and five baseline/model families, with no random train/test split.
- Found issuer-specific MAE improvements over naive of 9.0% for DELL and 64.3% for NTAP; retained naive as CSCO's best model and documented the small-sample and latest-restated-data limitations.
