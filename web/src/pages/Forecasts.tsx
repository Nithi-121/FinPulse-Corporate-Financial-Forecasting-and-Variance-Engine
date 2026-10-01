import React, { useMemo, useState } from 'react';
import { useCompany } from '../components/Layout';
import { ChartCard } from '../components/ui/ChartCard';
import { InsightCallout } from '../components/ui/InsightCallout';
import { financials, forecasts, backtestMetrics, fmtB, fmtPct, type ForecastModel, MODELS } from '../data/mockData';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const METRIC_COLORS: Record<string, string> = {
  Naive: '#6B7280',
  'Seasonal Naive': '#A78BFA',
  ARIMA: '#22D3EE',
  Prophet: '#F59E0B',
  XGBoost: '#10B981',
};

export const Forecasts: React.FC = () => {
  const { company } = useCompany();
  const [activeModel, setActiveModel] = useState<ForecastModel>('XGBoost');

  const history = useMemo(() =>
    financials.filter(f => f.company === company).map(d => ({
      name: `Q${d.fiscal_quarter}'${String(d.fiscal_year).slice(2)}`,
      actual: +(d.revenue / 1e9).toFixed(2),
      type: 'actual' as const,
    })), [company]);

  const fcastRows = useMemo(() =>
    forecasts.filter(f => f.company === company && f.model === activeModel)
      .map(f => ({
        name: f.period_end.slice(0, 7),
        yhat:  +(f.yhat  / 1e9).toFixed(2),
        lower: +(f.lower / 1e9).toFixed(2),
        upper: +(f.upper / 1e9).toFixed(2),
      })), [company, activeModel]);

  const metrics = useMemo(() =>
    backtestMetrics.find(m => m.company === company && m.model === activeModel),
    [company, activeModel]);

  // Best model across all for the insight callout
  const allModelsForLast = useMemo(() =>
    MODELS.map(m => {
      const bt = backtestMetrics.find(b => b.company === company && b.model === m);
      return { model: m, mase: bt?.mase ?? 1, mape: bt?.mape ?? 0.05, skill: bt?.mae_skill_vs_naive ?? 0 };
    }), [company]);

  const combinedChart = [
    ...history,
    ...fcastRows.map(f => ({ name: f.name, actual: undefined as any, yhat: f.yhat, lower: f.lower, upper: f.upper })),
  ];

  const bestModel = allModelsForLast.slice().sort((a, b) => a.mase - b.mase)[0];

  return (
    <div className="flex flex-col gap-6">
      <InsightCallout
        insight={`For ${company}, the ${bestModel.model} model achieves the best backtest score with a MASE of ${bestModel.mase.toFixed(2)} and ${(bestModel.skill * 100).toFixed(1)}% skill over the naïve baseline. The next-quarter revenue forecast ranges between ${fmtB(fcastRows[0]?.lower * 1e9 || 0)} and ${fmtB(fcastRows[0]?.upper * 1e9 || 0)}.`}
      />

      {/* Model selector */}
      <div className="flex flex-wrap gap-2">
        {MODELS.map(m => (
          <button
            key={m}
            onClick={() => setActiveModel(m)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium border transition-all',
              activeModel === m
                ? 'border-transparent text-white'
                : 'border-white/10 text-gray-400 hover:text-gray-200 hover:border-white/20',
            )}
            style={activeModel === m ? { background: METRIC_COLORS[m], boxShadow: `0 0 16px ${METRIC_COLORS[m]}60` } : {}}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Metrics strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'MAPE',          value: metrics ? fmtPct(metrics.mape)  : '—' },
          { label: 'sMAPE',         value: metrics ? fmtPct(metrics.smape) : '—' },
          { label: 'RMSE',          value: metrics ? fmtB(metrics.rmse)    : '—' },
          { label: 'MASE',          value: metrics ? metrics.mase.toFixed(3) : '—' },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-xl border border-white/[0.06] bg-[#111A2E]/80 p-4 text-center"
          >
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">{m.label}</p>
            <p className="font-mono text-xl font-bold text-white">{m.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Main forecast chart */}
      <ChartCard
        title={`Revenue Forecast — ${activeModel}`}
        subtitle="Historical actuals (solid) with 4-quarter projections and 90% confidence band"
        delay={0.2}
      >
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={combinedChart} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="actGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v}B`} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-[#111A2E] border border-white/10 rounded-xl p-3 shadow-xl text-xs space-y-1">
                    <p className="text-gray-400 font-medium">{label}</p>
                    {payload.map((p: any) => p.value != null && (
                      <div key={p.dataKey} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ background: p.color ?? p.fill }} />
                        <span className="text-gray-300">{p.name}:</span>
                        <span className="font-mono font-semibold text-white">${p.value}B</span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <ReferenceLine x={history[history.length - 1]?.name} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 2" label={{ value: 'Now', fill: '#9CA3AF', fontSize: 11 }} />
            <Area type="monotone" dataKey="actual" name="Actual" stroke="#3B82F6" strokeWidth={2.5} fill="url(#actGrad2)" connectNulls={false} />
            <Area type="monotone" dataKey="upper"  name="Upper"  stroke="none" fill={METRIC_COLORS[activeModel]} fillOpacity={0.08} connectNulls={false} />
            <Area type="monotone" dataKey="lower"  name="Lower"  stroke="none" fill="#0B1120" fillOpacity={1} connectNulls={false} />
            <Line  type="monotone" dataKey="yhat"   name="Forecast" stroke={METRIC_COLORS[activeModel]} strokeWidth={2.5} strokeDasharray="6 3" dot={false} connectNulls={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 4-quarter forecast table */}
      <ChartCard title="Next 4 Quarters — Point Estimate & Confidence Bounds" delay={0.3}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Quarter', 'Low', 'Point Estimate', 'High', 'Range Width'].map(h => (
                  <th key={h} className="text-left text-[10px] uppercase tracking-widest text-gray-500 pb-3 pr-6">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fcastRows.map((f, i) => (
                <motion.tr
                  key={f.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.07 }}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3 pr-6 font-medium text-white">{f.name}</td>
                  <td className="py-3 pr-6 font-mono text-negative">{fmtB(f.lower * 1e9)}</td>
                  <td className="py-3 pr-6">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-white">{fmtB(f.yhat * 1e9)}</span>
                      <div className="flex-1 hidden sm:block h-1.5 bg-white/10 rounded-full overflow-hidden max-w-[120px]">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${((f.yhat - f.lower) / (f.upper - f.lower)) * 100}%`, background: METRIC_COLORS[activeModel] }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-6 font-mono text-positive">{fmtB(f.upper * 1e9)}</td>
                  <td className="py-3 font-mono text-gray-400">{fmtB((f.upper - f.lower) * 1e9)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
};
