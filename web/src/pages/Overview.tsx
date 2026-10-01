import React, { useMemo } from 'react';
import { useCompany } from '../components/Layout';
import { KpiCard } from '../components/ui/KpiCard';
import { ChartCard } from '../components/ui/ChartCard';
import { InsightCallout } from '../components/ui/InsightCallout';
import {
  financials, forecasts, anomalies,
  COMPANIES, COMPANY_COLORS, fmtB, fmtPct,
} from '../data/mockData';
import {
  DollarSign, TrendingUp, Percent, AlertTriangle, BarChart2, Zap,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LineChart, Line, Legend,
} from 'recharts';

// Custom tooltip
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111A2E] border border-white/10 rounded-xl p-3 shadow-xl text-xs">
      <p className="text-gray-400 mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-300">{p.name}:</span>
          <span className="font-mono font-semibold text-white">{typeof p.value === 'number' ? fmtB(p.value * 1e9) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export const Overview: React.FC = () => {
  const { company } = useCompany();

  // ── Filtered data ──────────────────────────────────────────
  const compData = useMemo(() => financials.filter(f => f.company === company), [company]);
  const latest   = compData[compData.length - 1];
  const prior4   = compData[compData.length - 5]; // ~4 quarters ago for YoY

  const compAnomCount = anomalies.filter(a => a.company === company).length;
  const nextQForecast = forecasts.find(f => f.company === company && f.model === 'XGBoost');

  // ── Revenue chart data (history + forecast region) ─────────
  const historyChart = compData.map(d => ({
    name: `Q${d.fiscal_quarter}'${String(d.fiscal_year).slice(2)}`,
    actual: +(d.revenue / 1e9).toFixed(2),
    forecast: null as number | null,
    lower: null as number | null,
    upper: null as number | null,
  }));

  const forecastChart = forecasts
    .filter(f => f.company === company && f.model === 'XGBoost')
    .map((f) => ({
      name: f.period_end.slice(0, 7),
      actual: null as number | null,
      forecast: +(f.yhat / 1e9).toFixed(2),
      lower: +(f.lower / 1e9).toFixed(2),
      upper: +(f.upper / 1e9).toFixed(2),
    }));

  const combinedChart = [...historyChart, ...forecastChart];

  // ── Peer comparison data (latest margin for all companies) ──
  const peerData = COMPANIES.map(c => {
    const d = financials.filter(f => f.company === c).pop();
    return { company: c, op_margin: d ? +(d.operating_margin * 100).toFixed(1) : 0 };
  }).sort((a, b) => b.op_margin - a.op_margin);

  // ── YoY growth heatmap approximation (bar chart) ───────────
  const growthData = compData
    .filter(d => d.revenue_yoy_growth !== null)
    .map(d => ({
      name: `Q${d.fiscal_quarter}'${String(d.fiscal_year).slice(2)}`,
      growth: +(((d.revenue_yoy_growth ?? 0) * 100)).toFixed(1),
    }));

  const yoy = latest && prior4 ? (latest.revenue - prior4.revenue) / prior4.revenue : null;

  return (
    <div className="flex flex-col gap-6">
      {/* CFO Brief */}
      <InsightCallout
        insight={`${company} reported $${(latest?.revenue / 1e9).toFixed(1)}B in revenue for its latest quarter. ${
          yoy !== null ? `Year-over-year growth stands at ${yoy >= 0 ? '+' : ''}${(yoy * 100).toFixed(1)}%, ` : ''
        }with gross margins at ${fmtPct(latest?.gross_margin ?? 0)} and operating margins at ${fmtPct(latest?.operating_margin ?? 0)}. ${
          compAnomCount > 0 ? `${compAnomCount} statistical anomal${compAnomCount > 1 ? 'ies require' : 'y requires'} review.` : 'No active anomalies detected.'
        }`}
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 xl:grid-cols-6 gap-4">
        <KpiCard title="Latest Revenue" value={fmtB(latest?.revenue ?? 0)}
          delta={yoy} icon={DollarSign} iconColor="accent" delay={0.05} />
        <KpiCard title="YoY Growth" value={yoy !== null ? `${yoy >= 0 ? '+' : ''}${(yoy * 100).toFixed(1)}%` : 'N/A'}
          icon={TrendingUp} iconColor={yoy !== null && yoy >= 0 ? 'positive' : 'negative'} delta={null} delay={0.10} />
        <KpiCard title="Gross Margin" value={fmtPct(latest?.gross_margin ?? 0)}
          icon={Percent} iconColor="cyan" delay={0.15} />
        <KpiCard title="Operating Margin" value={fmtPct(latest?.operating_margin ?? 0)}
          icon={BarChart2} iconColor="positive" delay={0.20} />
        <KpiCard title="Next Q Forecast" value={nextQForecast ? fmtB(nextQForecast.yhat) : '—'}
          icon={Zap} iconColor="warning" delay={0.25} />
        <KpiCard title="Anomaly Flags" value={compAnomCount.toString()}
          icon={AlertTriangle} iconColor={compAnomCount > 0 ? 'negative' : 'positive'} delay={0.30} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main revenue chart */}
        <ChartCard
          title="Revenue History & 4-Quarter Forecast"
          subtitle="Quarterly actuals (solid) and XGBoost projections (dashed) in $B"
          className="xl:col-span-2"
          delay={0.35}
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={combinedChart} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fctGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22D3EE" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v}B`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="actual"   name="Actual"   stroke="#3B82F6" strokeWidth={2.5} fill="url(#actGrad)" connectNulls={false} />
              <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#22D3EE" strokeWidth={2.5} strokeDasharray="6 3" fill="url(#fctGrad)" connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Peer comparison */}
        <ChartCard title="Peer Op-Margin Ranking" subtitle="Latest quarter operating margin (%)" delay={0.40}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={peerData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis type="number" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
              <YAxis dataKey="company" type="category" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} width={40} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-[#111A2E] border border-white/10 rounded-xl p-3 text-xs">
                    <p className="font-mono font-bold text-white">{payload[0].payload.company}</p>
                    <p className="text-gray-400">Op Margin: <span className="text-positive font-semibold">{payload[0].value}%</span></p>
                  </div>
                );
              }} />
              <Bar dataKey="op_margin" radius={[0, 6, 6, 0]} barSize={22} name="Op Margin">
                {peerData.map(d => (
                  <Cell key={d.company} fill={COMPANY_COLORS[d.company]} fillOpacity={d.company === company ? 1 : 0.4} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* YoY growth chart */}
        <ChartCard title="YoY Revenue Growth" subtitle="Quarter-over-quarter growth rate vs same period prior year" delay={0.45}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={growthData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const v = payload[0].value as number;
                return (
                  <div className="bg-[#111A2E] border border-white/10 rounded-xl p-3 text-xs">
                    <p className="text-gray-400 mb-1">{label}</p>
                    <p className={`font-mono font-bold ${v >= 0 ? 'text-positive' : 'text-negative'}`}>{v >= 0 ? '+' : ''}{v}%</p>
                  </div>
                );
              }} />
              <Bar dataKey="growth" radius={[4, 4, 0, 0]} barSize={28} name="YoY Growth">
                {growthData.map((d, i) => (
                  <Cell key={i} fill={d.growth >= 0 ? '#10B981' : '#F43F5E'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Margin trends */}
        <ChartCard title="Margin Trends" subtitle="Gross, operating, and net margin over time" delay={0.50}>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={compData.map(d => ({
              name: `Q${d.fiscal_quarter}'${String(d.fiscal_year).slice(2)}`,
              Gross:     +(d.gross_margin * 100).toFixed(1),
              Operating: +(d.operating_margin * 100).toFixed(1),
              Net:       +(d.net_margin * 100).toFixed(1),
            }))} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF', paddingTop: 8 }} />
              <Line type="monotone" dataKey="Gross"     stroke="#22D3EE" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Operating" stroke="#10B981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Net"       stroke="#A78BFA" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};
