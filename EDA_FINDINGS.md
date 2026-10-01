# Phase 4 exploratory findings

Generated from the current SEC Company Facts snapshot on 2026-09-30. Recreate the tables and charts with `.\.venv\Scripts\python.exe src\eda.py`. These are exploratory findings, not causal claims or validated forecast rules.

## Hypothesis matrix

| Hypothesis | Result | Evidence | Interpretation limit |
|---|---|---|---|
| Revenue has a repeatable fiscal-quarter pattern | Supported descriptively | Median within-company difference between the highest and lowest quarter-of-year revenue index is 9.2%. | The index is an aggregate historical pattern; it does not establish stable seasonality or adjust for business mix and acquisitions. |
| Gross margin is less variable than YoY revenue growth | Supported descriptively | Gross-margin standard deviation is lower for all 4 comparable companies. | Only companies with at least 8 observations in both series qualify; HPE gross margin coverage ends in 2020. |
| Revenue growth persists quarter to quarter | Supported descriptively | Median lag-1 autocorrelation of YoY revenue growth is 0.65. | Sample sizes are small and irregular; gaps are retained, not interpolated. |
| Peer companies' YoY revenue growth moves together | Supported descriptively | Median correlation is 0.40 across 4 pairs with at least 8 shared calendar-quarter observations. | Calendar-quarter bucketing only approximates alignment for issuers with different fiscal calendars. |
| Seasonal naive is a competitive baseline | Evaluated in Phase 5 | Performance varied by company across 53 one-quarter-ahead origins. | Eligible history is limited; see `BACKTEST_FINDINGS.md` for the rolling-origin results and model-selection caveat. |

## Stationarity diagnostics

The Augmented Dickey-Fuller test was run on available revenue and gap-aware YoY revenue growth histories. At a conventional 5% threshold, none of the reported p-values rejects the unit-root null. This is weak evidence only: the histories are short, have structural breaks, and are not uniformly continuous. Do not difference or select a model solely from these p-values; compare forecasts on chronological holdouts.

| Company | Series | N | ADF p-value |
|---|---|---:|---:|
| HPE | Revenue | 41 | 0.284 |
| HPE | YoY revenue growth | 15 | 0.611 |
| DELL | Revenue | 45 | 0.993 |
| DELL | YoY revenue growth | 23 | 0.966 |
| CSCO | Revenue | 64 | 0.940 |
| CSCO | YoY revenue growth | 28 | 0.192 |
| IBM | Revenue | 57 | 0.696 |
| NTAP | Revenue | 59 | 0.312 |
| NTAP | YoY revenue growth | 24 | 0.187 |

Growth histories are shorter than revenue histories because the SQL view suppresses growth when the fiscal-year comparison is unavailable or discontinuous.

## Review before modeling

- Recent DELL and NTAP revenue growth has sharp spikes. Verify those periods against filings and acquisitions before interpreting the spikes as recurring dynamics.
- HPE's sharp recent revenue changes also need filing-level context before forecasting.
- The growth charts intentionally break lines at missing periods; do not connect or fill those gaps for model fitting without an explicit policy.
- Financial values are latest-restated history, not point-in-time snapshots. Historical backtests therefore have a restatement look-ahead limitation.

## Artifacts

- `data/processed/hypothesis_matrix.csv`
- `data/processed/adf_diagnostics.csv`
- `dashboard/eda/` (six PNG charts)
- `notebooks/01_eda.ipynb` (walkthrough)
