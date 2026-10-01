import React from 'react';
import { dataQuality, COMPANY_FULL, type Company } from '../data/mockData';
import { CheckCircle, XCircle, AlertTriangle, Database, Calendar, Tag, FlaskConical } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const STATUS_ICON: Record<string, React.ReactNode> = {
  ok:   <CheckCircle size={16} className="text-positive" />,
  warn: <AlertTriangle size={16} className="text-warning" />,
  fail: <XCircle size={16} className="text-negative" />,
};

export const DataQuality: React.FC = () => {
  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Data Quality</h1>
        <p className="text-sm text-gray-400">
          Pipeline health metrics sourced from SEC EDGAR XBRL APIs. Latest-restated values used where comparative filings are available.
        </p>
      </div>

      {/* Company cards */}
      <div className="flex flex-col gap-4">
        {dataQuality.map((dq, i) => {
          const coverage = dq.tag_coverage_pct;
          const status = !dq.validation_passed ? 'fail' : dq.revenue_gaps > 0 ? 'warn' : 'ok';
          return (
            <motion.div
              key={dq.company}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                'rounded-2xl border p-6 bg-[#111A2E]/80',
                status === 'ok'   && 'border-positive/20',
                status === 'warn' && 'border-warning/20',
                status === 'fail' && 'border-negative/20',
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    {STATUS_ICON[status]}
                    <h3 className="text-base font-semibold text-white">{dq.company} — {COMPANY_FULL[dq.company as Company]}</h3>
                  </div>
                  <p className="text-xs text-gray-400 ml-7">
                    {dq.earliest} → {dq.latest} · {dq.quarters_covered} quarters
                  </p>
                </div>
                <span className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
                  status === 'ok'   && 'bg-positive/10 text-positive border-positive/20',
                  status === 'warn' && 'bg-warning/10  text-warning  border-warning/20',
                  status === 'fail' && 'bg-negative/10 text-negative border-negative/20',
                )}>
                  {status === 'ok' ? 'All checks passed' : status === 'warn' ? 'Warnings present' : 'Validation failed'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                {[
                  { icon: Calendar, label: 'Quarters', value: dq.quarters_covered },
                  { icon: Database, label: 'Revenue gaps', value: dq.revenue_gaps, warn: dq.revenue_gaps > 0 },
                  { icon: Tag,      label: 'Tag coverage', value: `${(dq.tag_coverage_pct * 100).toFixed(0)}%`, warn: dq.tag_coverage_pct < 0.95 },
                  { icon: FlaskConical, label: 'Validation', value: dq.validation_passed ? '✓ Passed' : '✗ Failed', fail: !dq.validation_passed },
                ].map(item => (
                  <div key={item.label} className="rounded-xl border border-white/[0.06] bg-[#0D1525] p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <item.icon size={13} className="text-gray-500" />
                      <p className="text-[10px] uppercase tracking-widest text-gray-500">{item.label}</p>
                    </div>
                    <p className={cn(
                      'font-mono text-sm font-semibold',
                      (item as any).fail ? 'text-negative' : (item as any).warn ? 'text-warning' : 'text-white',
                    )}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Coverage bar */}
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>XBRL Tag Coverage</span>
                  <span className="font-mono">{(coverage * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', coverage >= 0.95 ? 'bg-positive' : 'bg-warning')}
                    style={{ width: `${coverage * 100}%` }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Q4 Derivation explainer */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl border border-accent/20 bg-accent/5 p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-accent/20 rounded-full text-accent"><FlaskConical size={18} /></div>
          <h3 className="text-base font-semibold text-white">How Q4 is Derived</h3>
        </div>
        <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
          <p>SEC XBRL filings report metrics on both a <span className="text-white font-medium">quarterly</span> (instant/3-month) and <span className="text-white font-medium">annual</span> (instant/12-month) basis. However, Q4 is not always filed explicitly as a 3-month period — companies often file only the annual 10-K value.</p>
          <p>The FinPulse pipeline derives Q4 using the formula:</p>
          <div className="bg-[#0B1120] rounded-xl p-3 font-mono text-sm text-cyan border border-white/[0.06]">
            Q4_value = Annual_value - (Q1 + Q2 + Q3)
          </div>
          <p>This derivation is only performed when all three interim quarters are present. Where this results in a negative or implausible value (e.g., due to restatements), the quarter is flagged as a gap rather than estimated.</p>
        </div>
      </motion.div>

      {/* Validation checklist */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl border border-white/[0.06] bg-[#111A2E]/80 p-6"
      >
        <h3 className="text-base font-semibold text-white mb-4">Pipeline Validation Checks</h3>
        <div className="space-y-3">
          {[
            { label: 'SEC EDGAR company facts API accessible', ok: true },
            { label: 'Raw XBRL JSON cached successfully for all 5 companies', ok: true },
            { label: 'Quarterly tag mapping covers revenue, gross profit, operating income', ok: true },
            { label: 'Continuity rule: adjacent quarters within 70–120 day gap', ok: true },
            { label: 'IBM revenue has no 6-month gaps breaking continuity', ok: false, note: 'IBM excluded from backtest for this reason' },
            { label: 'DuckDB financial_metrics view loaded', ok: true },
            { label: 'All backtest models produced at least 7 rolling origins', ok: true },
            { label: 'Isolation Forest margin scores generated for all eligible series', ok: true },
          ].map((check, i) => (
            <div key={i} className="flex items-start gap-3">
              {check.ok
                ? <CheckCircle size={16} className="text-positive mt-0.5 shrink-0" />
                : <XCircle    size={16} className="text-negative mt-0.5 shrink-0" />
              }
              <div>
                <p className={cn('text-sm', check.ok ? 'text-gray-200' : 'text-gray-400 line-through')}>{check.label}</p>
                {check.note && <p className="text-xs text-warning mt-0.5">{check.note}</p>}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
