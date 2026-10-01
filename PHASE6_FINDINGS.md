# Phase 6 variance and anomaly review

Run `.\.venv\Scripts\python.exe src\variance.py` after Phase 5 outputs exist. Variance reports cover every model; forecast anomaly z-scores use the pre-specified naive baseline so the residual detector does not select and score the same winning model. Margin flags are retrospective Isolation Forest candidates and need human review.

## Method

- Forecast variance is actual minus forecast; percentage variance divides by the absolute forecast.
- A naive residual z-score uses only earlier backtest errors for that company. It requires 8 prior errors and flags absolute z-scores of at least 2.5.
- Isolation Forest scores gross and operating margins separately for each company, only with at least 20 observations. It uses `contamination=0.05` and a fixed random seed. It labels approximately 5% of each eligible history; that is a review queue, not proof of an accounting error or business event.
- Charts and series preserve gaps. No values are interpolated.

## Forecast variance flags reviewed

| Company / period | Actual vs naive forecast | Statistical result | Plain-English review |
|---|---|---|---|
| DELL, 2020-05-01 | $20.078b vs $24.032b; -16.5% of forecast | Residual z = -3.22 | Not a clean operating anomaly. The current historical fact is from Dell's FY2022 filing after VMware results were presented as discontinued operations; Dell's contemporaneous FY2021 Q1 release reported $21.897b. This is a reporting-basis break and a point-in-time data limitation. See [Dell FY2022 10-K](https://www.sec.gov/Archives/edgar/data/1571996/000157199622000009/dell-20220128.htm) and [FY2021 Q1 release](https://investors.delltechnologies.com/news-releases/news-release-details/innovation-and-resiliency-drive-dell-technologies-first-quarter). |
| DELL, 2026-05-01 | $43.842b vs $33.379b; +31.3% of forecast | Residual z = +5.94 | A genuine scale break in the simple baseline. Dell reported Q1 FY2027 revenue up 88% year over year, including $16.1b of AI server revenue. The release supports a demand/product-mix explanation; it does not make this a recurring seasonal pattern. See [Dell Q1 FY2027 results](https://investors.delltechnologies.com/news-releases/news-release-details/dell-technologies-delivers-first-quarter-fiscal-2027-financial). |
| CSCO, 2020-01-25 | $12.005b vs $13.159b; -8.8% of forecast | Residual z = -3.26 | Cisco Q2 FY2020 revenue was down 4% year over year. The forecast is the previous quarter's value, so the flag may reflect ordinary fiscal-quarter seasonality as well as the reported decline; it is not evidence of a COVID impact (the quarter ended in January). See [Cisco Q2 FY2020 results](https://investor.cisco.com/news/news-details/2020/Cisco-Reports-Second-Quarter-Earnings/default.aspx). |

## Margin candidates reviewed

| Company / period | Flagged margin | Plain-English review |
|---|---:|---|
| CSCO gross margin, 2014-01-25 | 53.3% | The quarter included a $655m supplier component remediation charge in cost of sales. Cisco's later release provides the comparative quarter and charge; treat this as a documented one-off cost event. See [Cisco Q2 FY2015 results](https://investor.cisco.com/news/news-details/2015/Cisco-Reports-Second-Quarter-Earnings-20150211000000/default.aspx). |
| HPE operating margin, 2016-07-31 | 33.0% in the normalized data | The contemporaneous FY2016 Q3 release reported 20.5% GAAP operating margin and discussed an H3C divestiture gain. The current 33.0% comes from a later comparative filing after Enterprise Services was re-presented as discontinued operations. This is a source-basis reconciliation issue, not a trustworthy comparable margin. See [HPE FY2016 Q3 results](https://investors.hpe.com/~/media/Files/H/HP-Enterprise-IR/documents/q3-2016-earnings-press-release.pdf) and [HPE FY2017 Q3 10-Q](https://www.sec.gov/Archives/edgar/data/1645590/000162828017009143/hpe-07312017x10q.htm). |
| NTAP operating margin, 2015-07-31 | -1.9% | NetApp reported a $26m operating loss and $27m in restructuring and other charges for the quarter. The negative margin has a filing-supported restructuring explanation. See [NetApp Q1 FY2016 10-Q](https://www.sec.gov/Archives/edgar/data/1002047/000156459015007795/ntap-10q_20150731.htm). |

## Outputs

- `data/processed/forecast_variance_by_model.csv`: actual-vs-forecast amounts and percentage gaps for all backtest models.
- `data/processed/naive_residual_scores.csv`: rolling, past-only residual z-scores and flags.
- `data/processed/forecast_residual_anomalies.csv`: residual flags only.
- `data/processed/margin_anomaly_scores.csv`: per-period Isolation Forest scores.
- `data/processed/margin_anomalies.csv`: margin candidates only.
- `data/processed/margin_anomaly_eligibility.csv`: per-company metric coverage.
- `dashboard/anomalies/`: variance and margin-candidate charts.

## Interpretation

The checks surfaced known presentation changes as well as real events. Keep point-in-time/restatement caveats visible in any executive dashboard. Before using margins for comparisons across years, reconcile acquisition, divestiture, and discontinued-operation recasts. Statistical anomaly flags should remain candidates until reviewed against the filing for that period.
