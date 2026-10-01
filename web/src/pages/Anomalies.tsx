import React, { useMemo, useState } from 'react';
import { useCompany } from '../components/Layout';
import { ChartCard } from '../components/ui/ChartCard';
import { InsightCallout } from '../components/ui/InsightCallout';
import { anomalies, financials, fmtB, fmtZ, type Anomaly } from '../data/mockData';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ScatterChart, Scatter, ReferenceLine,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../lib/utils';

const SEV_COLORS: Record<Anomaly['severity'], string> = {
  Low:    '#F59E0B',
  Medium: '#F97316',
  High:   '#F43F5E',
};

const SEV_BG: Record<Anomaly['severity'], string> = {
  Low:    'bg-warning/10  text-warning  border-warning/20',
  Medium: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  High:   'bg-negative/10 text-negative border-negative/20',
};

export const Anomalies: React.FC = () => {
  const { company } = useCompany();
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [filterSev, setFilterSev] = useState<Anomaly['severity'] | 'All'>('All');
  const [sortBy, setSortBy] = useState<'period_end' | 'residual_z'>('residual_z');

  // Variance chart – actual vs naive forecast by period
  const compData = useMemo(() => financials.filter(f => f.company === company), [company]);
  const naiveForecasts = useMemo(() =>
    compData.slice(1).map((d, i) => ({
      name: `Q${d.fiscal_quarter}'${String(d.fiscal_year).slice(2)}`,
      actual:   +(d.revenue / 1e9).toFixed(2),
      forecast: +(compData[i].revenue / 1e9).toFixed(2),
      variance: +((d.revenue - compData[i].revenue) / 1e9).toFixed(2),
    })), [compData]);

  // Company anomalies
  const compAnomalies = useMemo(() => {
    let rows = anomalies.filter(a => a.company === company);
    if (filterSev !== 'All') rows = rows.filter(a => a.severity === filterSev);
    rows = [...rows].sort((a, b) => {
      if (sortBy === 'residual_z') return Math.abs(b.residual_z) - Math.abs(a.residual_z);
      return b.period_end.localeCompare(a.period_end);
    });
    return rows;
  }, [company, filterSev, sortBy]);

  // Scatter data for all anomalies
  const allAnomScatter = anomalies
    .filter(a => a.company === company)
    .map(a => ({
      name: a.period_end.slice(0, 7),
      z: +a.residual_z.toFixed(2),
      sev: a.severity,
      id: a.id,
    }));

  const highCount = compAnomalies.filter(a => a.severity === 'High').length;

  return (
    <div className="flex flex-col gap-6">
      <InsightCallout
        insight={`${company} has ${anomalies.filter(a => a.company === company).length} statistical anomaly flags across revenue and margins. ${
          highCount > 0 ? `${highCount} High-severity case${highCount > 1 ? 's' : ''} warrant immediate filing-level review.` : 'All flagged quarters have Low or Medium severity.'
        } These are model-derived signals, not accounting conclusions.`}
      />

      {/* Variance bar chart */}
      <ChartCard title="Actual vs Naïve Forecast Variance" subtitle="Quarter-over-quarter revenue variance ($B) — bars show actual minus prior quarter" delay={0.1}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={naiveForecasts} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v}B`} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const v = payload[0].value as number;
                return (
                  <div className="bg-[#111A2E] border border-white/10 rounded-xl p-3 text-xs">
                    <p className="text-gray-400 mb-1">{label}</p>
                    <p className={`font-mono font-bold ${v >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {v >= 0 ? '+' : ''}{fmtB(v * 1e9)}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="variance" radius={[4, 4, 0, 0]} barSize={28} name="Variance">
              {naiveForecasts.map((d, i) => (
                <Cell key={i} fill={d.variance >= 0 ? '#10B981' : '#F43F5E'} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Anomaly timeline scatter */}
      <ChartCard title="Z-Score Anomaly Map" subtitle="Click any point to view full details" delay={0.15}>
        <ResponsiveContainer width="100%" height={200}>
          <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} name="Period" />
            <YAxis dataKey="z" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} name="Z-Score" tickFormatter={v => `${v}σ`} />
            <ReferenceLine y={2.5}  stroke="#F59E0B" strokeDasharray="4 2" label={{ value: '+2.5σ', fill: '#F59E0B', fontSize: 10 }} />
            <ReferenceLine y={-2.5} stroke="#F59E0B" strokeDasharray="4 2" label={{ value: '-2.5σ', fill: '#F59E0B', fontSize: 10 }} />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-[#111A2E] border border-white/10 rounded-xl p-3 text-xs">
                    <p className="text-gray-300">{d.name}</p>
                    <p className="font-mono font-bold text-white">Z = {d.z}σ</p>
                    <p className={`font-semibold mt-0.5 ${SEV_BG[d.sev as Anomaly['severity']].split(' ')[1]}`}>{d.sev}</p>
                  </div>
                );
              }}
            />
            <Scatter
              data={allAnomScatter}
              onClick={(props: any) => {
                const a = anomalies.find(a => a.id === props.payload?.id);
                if (a) setSelectedAnomaly(a);
              }}
            >
              {allAnomScatter.map((d, i) => (
                <Cell
                  key={i}
                  fill={SEV_COLORS[d.sev as Anomaly['severity']]}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Filters + Table */}
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <span className="text-xs text-gray-400 font-medium">Filter by severity:</span>
        {(['All', 'High', 'Medium', 'Low'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterSev(s)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-semibold border transition-all',
              filterSev === s ? 'border-transparent text-white bg-accent' : 'border-white/10 text-gray-400 hover:border-white/20',
            )}
          >
            {s}
          </button>
        ))}
        <div className="flex-1" />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="bg-[#111A2E] border border-white/[0.08] text-gray-300 text-xs rounded-lg px-3 py-1.5 outline-none"
        >
          <option value="residual_z">Sort: Severity (|Z|)</option>
          <option value="period_end">Sort: Latest first</option>
        </select>
      </div>

      <motion.div
        className="rounded-2xl border border-white/[0.06] bg-[#111A2E]/80 overflow-hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Severity', 'Period', 'Metric', 'Z-Score', 'Note', ''].map(h => (
                <th key={h} className="text-left text-[10px] uppercase tracking-widest text-gray-500 px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {compAnomalies.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-500">
                  No anomalies match the current filter.
                </td>
              </tr>
            )}
            {compAnomalies.map((a, i) => (
              <motion.tr
                key={a.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer"
                onClick={() => setSelectedAnomaly(a)}
              >
                <td className="px-5 py-3">
                  <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border', SEV_BG[a.severity])}>
                    <AlertTriangle size={11} />
                    {a.severity}
                  </span>
                </td>
                <td className="px-5 py-3 font-mono text-gray-300">{a.period_end}</td>
                <td className="px-5 py-3 text-gray-300">{a.metric}</td>
                <td className={cn('px-5 py-3 font-mono font-semibold', a.residual_z < 0 ? 'text-negative' : 'text-positive')}>
                  {fmtZ(a.residual_z)}
                </td>
                <td className="px-5 py-3 text-gray-400 max-w-[300px] truncate">{a.note}</td>
                <td className="px-5 py-3 text-accent text-xs hover:underline">Details →</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Side drawer */}
      <AnimatePresence>
        {selectedAnomaly && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAnomaly(null)}
            />
            <motion.div
              className="fixed right-0 top-0 h-full w-full max-w-[420px] bg-[#0D1525] border-l border-white/[0.08] z-40 p-8 flex flex-col gap-6 shadow-2xl overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Anomaly Detail</p>
                  <h2 className="text-lg font-semibold text-white">{selectedAnomaly.company} — {selectedAnomaly.metric}</h2>
                </div>
                <button onClick={() => setSelectedAnomaly(null)} className="shrink-0 text-gray-500 hover:text-white transition-colors mt-0.5">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Period',    value: selectedAnomaly.period_end },
                  { label: 'Z-Score',   value: fmtZ(selectedAnomaly.residual_z) },
                  { label: 'Severity',  value: selectedAnomaly.severity },
                  { label: 'Direction', value: selectedAnomaly.residual_z < 0 ? '↓ Below forecast' : '↑ Above forecast' },
                ].map(item => (
                  <div key={item.label} className="rounded-xl border border-white/[0.06] bg-[#111A2E] p-4">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">{item.label}</p>
                    <p className={cn('font-mono font-semibold text-sm', 
                      item.label === 'Severity' ? SEV_BG[selectedAnomaly.severity].split(' ')[1] : 'text-white'
                    )}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#111A2E] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Info size={16} className="text-accent" />
                  <p className="text-sm font-semibold text-white">Explanation</p>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{selectedAnomaly.note}</p>
              </div>

              <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 text-xs text-gray-400 leading-relaxed">
                ⚠️ This flag is a statistical detection trigger, not an accounting conclusion. It requires filing-level and business-event review before treatment as an explanation.
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
