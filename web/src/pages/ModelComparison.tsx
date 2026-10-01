import React, { useMemo } from 'react';
import { useCompany } from '../components/Layout';
import { ChartCard } from '../components/ui/ChartCard';
import { InsightCallout } from '../components/ui/InsightCallout';
import { backtestMetrics, COMPANIES, MODELS, fmtB, fmtPct, type ForecastModel } from '../data/mockData';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { Trophy } from 'lucide-react';

const MODEL_COLORS: Record<ForecastModel, string> = {
  'Naive':          '#6B7280',
  'Seasonal Naive': '#A78BFA',
  'ARIMA':          '#22D3EE',
  'Prophet':        '#F59E0B',
  'XGBoost':        '#10B981',
};

const RANK_BADGE: Record<number, { label: string; class: string }> = {
  1: { label: '🥇', class: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  2: { label: '🥈', class: 'text-gray-300  bg-gray-300/10  border-gray-300/20' },
  3: { label: '🥉', class: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
};

export const ModelComparison: React.FC = () => {
  const { company } = useCompany();

  const compRows = useMemo(() =>
    backtestMetrics
      .filter(m => m.company === company)
      .sort((a, b) => a.mase - b.mase),
    [company]);

  const winner = compRows[0];

  // Grouped bar data (mase by model for all companies)
  const groupedData = useMemo(() => MODELS.map(m => {
    const row: Record<string, any> = { model: m };
    COMPANIES.forEach(c => {
      const found = backtestMetrics.find(b => b.company === c && b.model === m);
      row[c] = found ? +found.mase.toFixed(3) : null;
    });
    return row;
  }), []);

  // Radar data for current company
  const radarData = useMemo(() => [
    { metric: 'MAPE', ...Object.fromEntries(compRows.map(r => [r.model, +(1 - r.mape).toFixed(3)])) },
    { metric: 'sMAPE', ...Object.fromEntries(compRows.map(r => [r.model, +(1 - r.smape).toFixed(3)])) },
    { metric: '1/MASE', ...Object.fromEntries(compRows.map(r => [r.model, +(1 / r.mase).toFixed(3)])) },
    { metric: 'Skill', ...Object.fromEntries(compRows.map(r => [r.model, +r.mae_skill_vs_naive.toFixed(3)])) },
  ], [compRows]);

  return (
    <div className="flex flex-col gap-6">
      <InsightCallout
        insight={`For ${company}, the best model is ${winner?.model} with a MASE of ${winner?.mase.toFixed(3)} — ${(winner?.mae_skill_vs_naive * 100).toFixed(1)}% better than the naïve baseline. ${
          winner?.mae_skill_vs_naive < 0.05 ? 'The naive baseline is very competitive here; gains from complex models are marginal.' : 'Complex models deliver meaningful accuracy improvements.'
        }`}
      />

      {/* Leaderboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {compRows.map((row, i) => {
          const badge = RANK_BADGE[i + 1];
          const isWinner = i === 0;
          return (
            <motion.div
              key={row.model}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                'rounded-2xl border p-5 flex flex-col gap-2 transition-all',
                isWinner
                  ? 'border-yellow-400/30 bg-yellow-400/5 shadow-[0_0_24px_-4px_rgba(250,204,21,0.15)]'
                  : 'border-white/[0.06] bg-[#111A2E]/80',
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border',
                  badge?.class ?? 'text-gray-400 bg-gray-400/10 border-gray-400/20',
                )}>
                  {badge?.label ?? `#${i + 1}`}
                </span>
                {isWinner && <Trophy size={16} className="text-yellow-400" />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full" style={{ background: MODEL_COLORS[row.model as ForecastModel] }} />
                  <p className="text-sm font-semibold text-white">{row.model}</p>
                </div>
                <p className="font-mono text-xs text-gray-400">MASE: <span className="text-white font-semibold">{row.mase.toFixed(3)}</span></p>
                <p className="font-mono text-xs text-gray-400">MAPE: <span className="text-white font-semibold">{fmtPct(row.mape)}</span></p>
                <p className="font-mono text-xs text-gray-400">Skill: <span className={row.mae_skill_vs_naive > 0 ? 'text-positive' : 'text-gray-400'}>
                  {row.mae_skill_vs_naive > 0 ? '+' : ''}{(row.mae_skill_vs_naive * 100).toFixed(1)}%
                </span></p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Grouped MASE bar */}
        <ChartCard title="MASE by Model — All Companies" subtitle="Lower is better. Dashed at 1.0 = naïve benchmark" delay={0.2}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={groupedData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="model" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} domain={[0, 1.1]} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                contentStyle={{ backgroundColor: '#111A2E', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12 }}
                itemStyle={{ color: '#E5E7EB', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
              {COMPANIES.map(c => (
                <Bar key={c} dataKey={c} fill="#3B82F6" barSize={10} radius={[3, 3, 0, 0]}
                  style={{ fill: { HPE: '#3B82F6', DELL: '#22D3EE', CSCO: '#10B981', IBM: '#F59E0B', NTAP: '#A78BFA' }[c] }}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Radar chart */}
        <ChartCard title="Multi-Metric Radar" subtitle={`Model performance profile for ${company} — higher = better`} delay={0.25}>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              {compRows.slice(0, 5).map((row) => (
                <Radar
                  key={row.model}
                  dataKey={row.model}
                  stroke={MODEL_COLORS[row.model as ForecastModel]}
                  fill={MODEL_COLORS[row.model as ForecastModel]}
                  fillOpacity={0.08}
                  strokeWidth={1.5}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111A2E', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12 }}
                itemStyle={{ fontSize: 12 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Full metrics table */}
      <motion.div
        className="rounded-2xl border border-white/[0.06] bg-[#111A2E]/80 overflow-hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white">Full Backtest Metrics — {company}</h3>
          <p className="text-xs text-gray-400 mt-0.5">Expanding-window rolling-origin backtest. Rows ranked by MASE (ascending).</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['#', 'Model', 'Origins', 'MAPE', 'sMAPE', 'RMSE', 'MASE', 'Skill vs Naïve'].map(h => (
                  <th key={h} className="text-left text-[10px] uppercase tracking-widest text-gray-500 px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compRows.map((row, i) => (
                <motion.tr
                  key={row.model}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                  className={cn('border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]', i === 0 && 'bg-yellow-400/5')}
                >
                  <td className="px-5 py-3">
                    <span className={cn('text-sm', RANK_BADGE[i + 1]?.label ? '' : 'text-gray-500 font-mono')}>{RANK_BADGE[i + 1]?.label ?? `#${i + 1}`}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ background: MODEL_COLORS[row.model as ForecastModel] }} />
                      <span className="font-medium text-white">{row.model}</span>
                      {i === 0 && <span className="text-[10px] font-semibold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">WINNER</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-gray-300">{row.origins}</td>
                  <td className="px-5 py-3 font-mono text-gray-300">{fmtPct(row.mape)}</td>
                  <td className="px-5 py-3 font-mono text-gray-300">{fmtPct(row.smape)}</td>
                  <td className="px-5 py-3 font-mono text-gray-300">{fmtB(row.rmse)}</td>
                  <td className="px-5 py-3 font-mono font-semibold text-white">{row.mase.toFixed(3)}</td>
                  <td className={cn('px-5 py-3 font-mono font-semibold', row.mae_skill_vs_naive > 0.05 ? 'text-positive' : 'text-gray-400')}>
                    {row.mae_skill_vs_naive > 0 ? '+' : ''}{(row.mae_skill_vs_naive * 100).toFixed(1)}%
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};
