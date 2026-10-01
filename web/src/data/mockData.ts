// ============================================================
// FinPulse – Central Data Layer
// To swap in real data: replace the `const` exports with async
// fetch() calls pointing at /public/data/*.json or a FastAPI endpoint.
// ============================================================

// ── Interfaces ──────────────────────────────────────────────
export interface QuarterlyFinancial {
  company: Company;
  period_end: string;          // ISO date string, e.g. "2024-01-31"
  fiscal_year: number;
  fiscal_quarter: number;
  revenue: number;             // absolute $
  gross_profit: number;
  operating_income: number;
  net_income: number;
  gross_margin: number;        // 0-1 fraction
  operating_margin: number;
  net_margin: number;
  revenue_yoy_growth: number | null;
}

export interface Forecast {
  company: Company;
  model: ForecastModel;
  period_end: string;
  yhat: number;
  lower: number;
  upper: number;
}

export interface BacktestRow {
  company: Company;
  model: ForecastModel;
  mape: number;
  smape: number;
  rmse: number;
  mase: number;
  origins: number;
  mae_skill_vs_naive: number;
}

export interface Anomaly {
  id: string;
  company: Company;
  metric: AnomalyMetric;
  period_end: string;
  residual_z: number;
  severity: 'Low' | 'Medium' | 'High';
  note: string;
}

export interface DataQuality {
  company: Company;
  quarters_covered: number;
  earliest: string;
  latest: string;
  revenue_gaps: number;
  tag_coverage_pct: number;
  validation_passed: boolean;
}

// ── Enum-style types ─────────────────────────────────────────
export type Company = 'HPE' | 'DELL' | 'CSCO' | 'IBM' | 'NTAP';
export type ForecastModel = 'Naive' | 'Seasonal Naive' | 'ARIMA' | 'Prophet' | 'XGBoost';
export type AnomalyMetric = 'Revenue' | 'Gross Margin' | 'Operating Margin';

export const COMPANIES: Company[] = ['HPE', 'DELL', 'CSCO', 'IBM', 'NTAP'];
export const COMPANY_FULL: Record<Company, string> = {
  HPE: 'Hewlett Packard Enterprise',
  DELL: 'Dell Technologies',
  CSCO: 'Cisco Systems',
  IBM: 'IBM Corporation',
  NTAP: 'NetApp',
};
export const MODELS: ForecastModel[] = ['Naive', 'Seasonal Naive', 'ARIMA', 'Prophet', 'XGBoost'];

// ── Color palette ─────────────────────────────────────────────
export const COMPANY_COLORS: Record<Company, string> = {
  HPE: '#3B82F6',
  DELL: '#22D3EE',
  CSCO: '#10B981',
  IBM: '#F59E0B',
  NTAP: '#A78BFA',
};

// ── Realistic Quarterly Financials ───────────────────────────
const raw: {
  c: Company; ye: number; qn: number; pe: string;
  rev: number; gp: number; oi: number; ni: number;
}[] = [
  // HPE – quarterly revenue ~$7-8B
  { c:'HPE', ye:2022, qn:1, pe:'2022-01-31', rev:7.0,  gp:2.2, oi:0.60, ni:0.46 },
  { c:'HPE', ye:2022, qn:2, pe:'2022-04-30', rev:6.9,  gp:2.1, oi:0.55, ni:0.40 },
  { c:'HPE', ye:2022, qn:3, pe:'2022-07-31', rev:7.0,  gp:2.2, oi:0.62, ni:0.44 },
  { c:'HPE', ye:2022, qn:4, pe:'2022-10-31', rev:8.0,  gp:2.5, oi:0.75, ni:0.58 },
  { c:'HPE', ye:2023, qn:1, pe:'2023-01-31', rev:7.2,  gp:2.3, oi:0.64, ni:0.49 },
  { c:'HPE', ye:2023, qn:2, pe:'2023-04-30', rev:7.0,  gp:2.2, oi:0.60, ni:0.42 },
  { c:'HPE', ye:2023, qn:3, pe:'2023-07-31', rev:7.4,  gp:2.4, oi:0.68, ni:0.51 },
  { c:'HPE', ye:2023, qn:4, pe:'2023-10-31', rev:7.7,  gp:2.3, oi:0.63, ni:0.45 },
  { c:'HPE', ye:2024, qn:1, pe:'2024-01-31', rev:7.4,  gp:2.4, oi:0.66, ni:0.49 },
  { c:'HPE', ye:2024, qn:2, pe:'2024-04-30', rev:7.6,  gp:2.5, oi:0.70, ni:0.52 },

  // DELL – quarterly revenue ~$20-25B
  { c:'DELL', ye:2022, qn:1, pe:'2022-01-31', rev:24.5, gp:5.2, oi:2.10, ni:1.25 },
  { c:'DELL', ye:2022, qn:2, pe:'2022-04-30', rev:26.1, gp:5.5, oi:2.30, ni:1.40 },
  { c:'DELL', ye:2022, qn:3, pe:'2022-07-31', rev:26.4, gp:5.6, oi:2.35, ni:1.45 },
  { c:'DELL', ye:2022, qn:4, pe:'2022-10-31', rev:25.0, gp:5.3, oi:2.15, ni:1.28 },
  { c:'DELL', ye:2023, qn:1, pe:'2023-01-31', rev:20.9, gp:4.5, oi:1.70, ni:0.95 },
  { c:'DELL', ye:2023, qn:2, pe:'2023-04-30', rev:20.9, gp:4.5, oi:1.65, ni:0.88 },
  { c:'DELL', ye:2023, qn:3, pe:'2023-07-31', rev:22.9, gp:4.9, oi:1.90, ni:1.10 },
  { c:'DELL', ye:2023, qn:4, pe:'2023-10-31', rev:22.3, gp:4.8, oi:1.85, ni:1.05 },
  { c:'DELL', ye:2024, qn:1, pe:'2024-01-31', rev:21.9, gp:4.7, oi:1.75, ni:1.00 },
  { c:'DELL', ye:2024, qn:2, pe:'2024-04-30', rev:22.2, gp:4.8, oi:1.82, ni:1.08 },

  // CSCO – quarterly revenue ~$14-15B
  { c:'CSCO', ye:2022, qn:1, pe:'2022-01-31', rev:12.7, gp:7.9, oi:3.50, ni:2.70 },
  { c:'CSCO', ye:2022, qn:2, pe:'2022-04-30', rev:12.8, gp:7.9, oi:3.55, ni:2.75 },
  { c:'CSCO', ye:2022, qn:3, pe:'2022-07-31', rev:13.1, gp:8.1, oi:3.70, ni:2.85 },
  { c:'CSCO', ye:2022, qn:4, pe:'2022-10-31', rev:13.6, gp:8.4, oi:3.85, ni:3.00 },
  { c:'CSCO', ye:2023, qn:1, pe:'2023-01-31', rev:13.6, gp:8.4, oi:3.85, ni:3.00 },
  { c:'CSCO', ye:2023, qn:2, pe:'2023-04-30', rev:14.6, gp:9.1, oi:4.20, ni:3.30 },
  { c:'CSCO', ye:2023, qn:3, pe:'2023-07-31', rev:15.2, gp:9.5, oi:4.50, ni:3.55 },
  { c:'CSCO', ye:2023, qn:4, pe:'2023-10-31', rev:14.7, gp:9.1, oi:4.10, ni:3.20 },
  { c:'CSCO', ye:2024, qn:1, pe:'2024-01-31', rev:12.8, gp:7.9, oi:3.40, ni:2.60 },
  { c:'CSCO', ye:2024, qn:2, pe:'2024-04-30', rev:12.7, gp:7.8, oi:3.35, ni:2.55 },

  // IBM – quarterly revenue ~$14-16B
  { c:'IBM', ye:2022, qn:1, pe:'2022-03-31', rev:14.2, gp:7.1, oi:1.50, ni:0.75 },
  { c:'IBM', ye:2022, qn:2, pe:'2022-06-30', rev:15.5, gp:7.8, oi:1.80, ni:1.00 },
  { c:'IBM', ye:2022, qn:3, pe:'2022-09-30', rev:14.1, gp:7.0, oi:1.45, ni:0.70 },
  { c:'IBM', ye:2022, qn:4, pe:'2022-12-31', rev:16.7, gp:8.4, oi:2.10, ni:1.30 },
  { c:'IBM', ye:2023, qn:1, pe:'2023-03-31', rev:14.3, gp:7.2, oi:1.55, ni:0.78 },
  { c:'IBM', ye:2023, qn:2, pe:'2023-06-30', rev:15.5, gp:7.8, oi:1.82, ni:1.05 },
  { c:'IBM', ye:2023, qn:3, pe:'2023-09-30', rev:14.8, gp:7.4, oi:1.65, ni:0.90 },
  { c:'IBM', ye:2023, qn:4, pe:'2023-12-31', rev:17.4, gp:8.7, oi:2.30, ni:1.50 },
  { c:'IBM', ye:2024, qn:1, pe:'2024-03-31', rev:14.5, gp:7.3, oi:1.60, ni:0.82 },
  { c:'IBM', ye:2024, qn:2, pe:'2024-06-30', rev:15.8, gp:7.9, oi:1.90, ni:1.10 },

  // NTAP – quarterly revenue ~$1.4-1.7B
  { c:'NTAP', ye:2022, qn:1, pe:'2022-07-31', rev:1.46, gp:0.92, oi:0.25, ni:0.20 },
  { c:'NTAP', ye:2022, qn:2, pe:'2022-10-31', rev:1.66, gp:1.04, oi:0.31, ni:0.25 },
  { c:'NTAP', ye:2022, qn:3, pe:'2023-01-31', rev:1.61, gp:1.00, oi:0.28, ni:0.22 },
  { c:'NTAP', ye:2022, qn:4, pe:'2023-04-30', rev:1.58, gp:0.98, oi:0.27, ni:0.21 },
  { c:'NTAP', ye:2023, qn:1, pe:'2023-07-31', rev:1.51, gp:0.94, oi:0.24, ni:0.18 },
  { c:'NTAP', ye:2023, qn:2, pe:'2023-10-31', rev:1.56, gp:0.97, oi:0.26, ni:0.20 },
  { c:'NTAP', ye:2023, qn:3, pe:'2024-01-31', rev:1.56, gp:0.97, oi:0.26, ni:0.20 },
  { c:'NTAP', ye:2023, qn:4, pe:'2024-04-30', rev:1.67, gp:1.04, oi:0.30, ni:0.24 },
  { c:'NTAP', ye:2024, qn:1, pe:'2024-07-31', rev:1.54, gp:0.96, oi:0.25, ni:0.19 },
  { c:'NTAP', ye:2024, qn:2, pe:'2024-10-31', rev:1.60, gp:1.00, oi:0.28, ni:0.22 },
];

// Compute derived fields and YoY growth
export const financials: QuarterlyFinancial[] = raw.map((r) => {
  const revB = r.rev * 1e9;
  const gpB  = r.gp  * 1e9;
  const oiB  = r.oi  * 1e9;
  const niB  = r.ni  * 1e9;

  // find prior year same quarter
  const prior = raw.find(p => p.c === r.c && p.ye === r.ye - 1 && p.qn === r.qn);
  const yoy = prior ? (r.rev - prior.rev) / prior.rev : null;

  return {
    company: r.c,
    period_end: r.pe,
    fiscal_year: r.ye,
    fiscal_quarter: r.qn,
    revenue: revB,
    gross_profit: gpB,
    operating_income: oiB,
    net_income: niB,
    gross_margin: r.gp / r.rev,
    operating_margin: r.oi / r.rev,
    net_margin: r.ni / r.rev,
    revenue_yoy_growth: yoy,
  };
});

// ── Forecasts (next 4 quarters from each company) ─────────────
const forecastSeeds: Record<Company, { base: number; growth: number }> = {
  HPE:  { base: 7.6,  growth: 0.02 },
  DELL: { base: 22.2, growth: 0.03 },
  CSCO: { base: 12.7, growth: -0.01 },
  IBM:  { base: 15.8, growth: 0.01 },
  NTAP: { base: 1.60, growth: 0.025 },
};

const futureQuarters = [
  '2024-07-31','2024-10-31','2025-01-31','2025-04-30',
];

export const forecasts: Forecast[] = COMPANIES.flatMap(c =>
  MODELS.flatMap(m => {
    const { base, growth } = forecastSeeds[c];
    // Each model has slightly different accuracy bias
    const bias: Record<ForecastModel, number> = {
      'Naive': 0, 'Seasonal Naive': 0.005,
      'ARIMA': 0.012, 'Prophet': 0.015, 'XGBoost': 0.018,
    };
    const errMult: Record<ForecastModel, number> = {
      'Naive': 0.04, 'Seasonal Naive': 0.035,
      'ARIMA': 0.025, 'Prophet': 0.022, 'XGBoost': 0.02,
    };
    return futureQuarters.map((pe, i) => {
      const yhat = (base + bias[m]) * Math.pow(1 + growth, i + 1) * 1e9;
      const err  = yhat * errMult[m];
      return { company: c, model: m, period_end: pe, yhat, lower: yhat - err * 1.5, upper: yhat + err * 1.5 };
    });
  })
);

// ── Backtest Metrics ─────────────────────────────────────────
export const backtestMetrics: BacktestRow[] = [
  // HPE
  { company:'HPE', model:'Naive',         mape:.062, smape:.059, rmse:480e6, mase:1.00, origins:7, mae_skill_vs_naive:0.000 },
  { company:'HPE', model:'Seasonal Naive',mape:.058, smape:.055, rmse:450e6, mase:0.92, origins:7, mae_skill_vs_naive:0.022 },
  { company:'HPE', model:'ARIMA',         mape:.055, smape:.052, rmse:430e6, mase:0.89, origins:7, mae_skill_vs_naive:0.048 },
  { company:'HPE', model:'Prophet',       mape:.057, smape:.054, rmse:445e6, mase:0.91, origins:7, mae_skill_vs_naive:0.031 },
  { company:'HPE', model:'XGBoost',       mape:.053, smape:.050, rmse:415e6, mase:0.86, origins:7, mae_skill_vs_naive:0.063 },
  // DELL
  { company:'DELL', model:'Naive',         mape:.070, smape:.067, rmse:1800e6, mase:1.00, origins:21, mae_skill_vs_naive:0.000 },
  { company:'DELL', model:'Seasonal Naive',mape:.065, smape:.063, rmse:1650e6, mase:0.94, origins:21, mae_skill_vs_naive:0.040 },
  { company:'DELL', model:'ARIMA',         mape:.059, smape:.057, rmse:1520e6, mase:0.85, origins:21, mae_skill_vs_naive:0.090 },
  { company:'DELL', model:'Prophet',       mape:.062, smape:.060, rmse:1580e6, mase:0.88, origins:21, mae_skill_vs_naive:0.070 },
  { company:'DELL', model:'XGBoost',       mape:.058, smape:.056, rmse:1500e6, mase:0.84, origins:21, mae_skill_vs_naive:0.095 },
  // CSCO
  { company:'CSCO', model:'Naive',         mape:.042, smape:.040, rmse:580e6, mase:1.00, origins:14, mae_skill_vs_naive:0.000 },
  { company:'CSCO', model:'Seasonal Naive',mape:.042, smape:.040, rmse:575e6, mase:0.99, origins:14, mae_skill_vs_naive:0.005 },
  { company:'CSCO', model:'ARIMA',         mape:.041, smape:.039, rmse:565e6, mase:0.97, origins:14, mae_skill_vs_naive:0.012 },
  { company:'CSCO', model:'Prophet',       mape:.040, smape:.038, rmse:555e6, mase:0.96, origins:14, mae_skill_vs_naive:0.018 },
  { company:'CSCO', model:'XGBoost',       mape:.040, smape:.038, rmse:550e6, mase:0.95, origins:14, mae_skill_vs_naive:0.022 },
  // IBM
  { company:'IBM',  model:'Naive',         mape:.055, smape:.053, rmse:850e6, mase:1.00, origins:9,  mae_skill_vs_naive:0.000 },
  { company:'IBM',  model:'Seasonal Naive',mape:.052, smape:.050, rmse:810e6, mase:0.95, origins:9,  mae_skill_vs_naive:0.030 },
  { company:'IBM',  model:'ARIMA',         mape:.048, smape:.046, rmse:760e6, mase:0.88, origins:9,  mae_skill_vs_naive:0.072 },
  { company:'IBM',  model:'Prophet',       mape:.050, smape:.048, rmse:780e6, mase:0.91, origins:9,  mae_skill_vs_naive:0.058 },
  { company:'IBM',  model:'XGBoost',       mape:.046, smape:.044, rmse:730e6, mase:0.84, origins:9,  mae_skill_vs_naive:0.088 },
  // NTAP
  { company:'NTAP', model:'Naive',         mape:.085, smape:.082, rmse:140e6, mase:1.00, origins:11, mae_skill_vs_naive:0.000 },
  { company:'NTAP', model:'Seasonal Naive',mape:.030, smape:.028, rmse:50e6,  mase:0.36, origins:11, mae_skill_vs_naive:0.643 },
  { company:'NTAP', model:'ARIMA',         mape:.035, smape:.033, rmse:58e6,  mase:0.42, origins:11, mae_skill_vs_naive:0.590 },
  { company:'NTAP', model:'Prophet',       mape:.032, smape:.030, rmse:54e6,  mase:0.39, origins:11, mae_skill_vs_naive:0.618 },
  { company:'NTAP', model:'XGBoost',       mape:.028, smape:.026, rmse:46e6,  mase:0.33, origins:11, mae_skill_vs_naive:0.660 },
];

// ── Anomalies ────────────────────────────────────────────────
export const anomalies: Anomaly[] = [
  {
    id:'a1', company:'HPE', metric:'Revenue', period_end:'2023-10-31',
    residual_z:-3.2, severity:'High',
    note:'Revenue missed the naive forecast by –$0.42B due to supply chain disruptions in storage hardware. Management cited longer enterprise deal cycles.',
  },
  {
    id:'a2', company:'CSCO', metric:'Gross Margin', period_end:'2023-04-30',
    residual_z:2.5, severity:'Medium',
    note:'Gross margin expanded 180 bps above model expectation, driven by higher-margin software and subscription revenue mix shift.',
  },
  {
    id:'a3', company:'DELL', metric:'Revenue', period_end:'2023-01-31',
    residual_z:-2.8, severity:'High',
    note:'PC market slowdown caused a –$3.1B revenue miss vs. the prior year. Consumer segment particularly affected post-pandemic demand normalisation.',
  },
  {
    id:'a4', company:'NTAP', metric:'Operating Margin', period_end:'2023-01-31',
    residual_z:2.1, severity:'Medium',
    note:'Seasonal Q3 margin expansion partially explains the positive z-score; product mix skewed toward higher-margin cloud storage services.',
  },
  {
    id:'a5', company:'IBM', metric:'Revenue', period_end:'2023-12-31',
    residual_z:2.6, severity:'Medium',
    note:'Q4 outperformance driven by a strong consulting pipeline and mainframe refresh cycle. Revenue exceeded forecast by +$1.1B.',
  },
  {
    id:'a6', company:'CSCO', metric:'Revenue', period_end:'2024-01-31',
    residual_z:-3.6, severity:'High',
    note:'Cisco revenue declined sharply as customers worked down elevated inventory accumulated during supply shortages. Order normalization was sharper than modeled.',
  },
  {
    id:'a7', company:'NTAP', metric:'Revenue', period_end:'2023-10-31',
    residual_z:1.8, severity:'Low',
    note:'Minor positive deviation; NetApp benefited from a favorable product refresh cycle in the enterprise storage segment.',
  },
];

// ── Data Quality ─────────────────────────────────────────────
export const dataQuality: DataQuality[] = [
  { company:'HPE',  quarters_covered:10, earliest:'2022-01-31', latest:'2024-04-30', revenue_gaps:0, tag_coverage_pct:0.97, validation_passed:true },
  { company:'DELL', quarters_covered:10, earliest:'2022-01-31', latest:'2024-04-30', revenue_gaps:0, tag_coverage_pct:0.98, validation_passed:true },
  { company:'CSCO', quarters_covered:10, earliest:'2022-01-31', latest:'2024-04-30', revenue_gaps:0, tag_coverage_pct:0.96, validation_passed:true },
  { company:'IBM',  quarters_covered:10, earliest:'2022-03-31', latest:'2024-06-30', revenue_gaps:2, tag_coverage_pct:0.89, validation_passed:false },
  { company:'NTAP', quarters_covered:10, earliest:'2022-07-31', latest:'2024-10-31', revenue_gaps:0, tag_coverage_pct:0.95, validation_passed:true },
];

// ── Helper formatters (used in multiple pages) ────────────────
export function fmtB(v: number): string {
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v.toFixed(0)}`;
}
export function fmtPct(v: number, decimals = 1): string {
  return `${(v * 100).toFixed(decimals)}%`;
}
export function fmtZ(v: number): string {
  return v >= 0 ? `+${v.toFixed(2)}σ` : `${v.toFixed(2)}σ`;
}
