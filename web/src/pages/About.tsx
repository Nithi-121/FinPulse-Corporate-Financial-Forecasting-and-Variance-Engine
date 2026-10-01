import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ExternalLink, Database, Cpu, BarChart2, ShieldCheck } from 'lucide-react';

const stack = [
  { icon: Activity,     label: 'React 18 + Vite',       desc: 'Component-based UI with fast HMR' },
  { icon: Cpu,          label: 'TypeScript',             desc: 'Full type safety across the data layer' },
  { icon: BarChart2,    label: 'Recharts',               desc: 'Composable, animated chart primitives' },
  { icon: Database,     label: 'DuckDB (backend)',       desc: 'Embedded analytical database for pipeline' },
  { icon: ShieldCheck,  label: 'Framer Motion',          desc: 'Page transitions and staggered animations' },
  { icon: ExternalLink, label: 'SEC EDGAR XBRL API',     desc: 'Public company facts data source' },
];

export const About: React.FC = () => {
  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
          <Activity size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">FinPulse</h1>
          <p className="text-sm text-gray-400">Investor-Grade Financial Analytics — v1.0</p>
        </div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-gray-300 text-sm leading-relaxed"
      >
        FinPulse is a corporate-finance analytics prototype that ingests SEC EDGAR XBRL filings for HPE, Dell, Cisco, IBM, and NetApp, transforms them into comparable quarterly metrics, evaluates revenue forecasts via an expanding-window backtest, and surfaces statistical anomalies for review. It is an <span className="text-white font-medium">analytical prototype</span> — not an investment, accounting, or regulatory decision system.
      </motion.p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stack.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-xl border border-white/[0.06] bg-[#111A2E]/80 p-4 flex items-start gap-4"
          >
            <div className="p-2 bg-accent/10 rounded-lg text-accent shrink-0"><item.icon size={18} /></div>
            <div>
              <p className="text-sm font-semibold text-white">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl border border-warning/20 bg-warning/5 p-5 text-sm text-gray-300 leading-relaxed"
      >
        <p className="font-semibold text-warning mb-2">⚠️ Important Disclaimers</p>
        <ul className="space-y-1.5 list-disc list-inside text-xs text-gray-400">
          <li>Historical values are latest-restated per the SEC facts service and may differ from original filings.</li>
          <li>IBM is excluded from the backtest due to recurring revenue gaps that break the continuity rule.</li>
          <li>Model rankings are in-sample backtest-selected; treat as exploratory, not production-grade.</li>
          <li>Anomaly flags are statistical triggers requiring filing-level human review before any conclusion.</li>
          <li>FinPulse accesses public SEC EDGAR APIs. Set a descriptive User-Agent per SEC fair-access guidance.</li>
        </ul>
      </motion.div>
    </div>
  );
};
