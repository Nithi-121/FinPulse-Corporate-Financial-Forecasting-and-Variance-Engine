import React from 'react';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

interface KpiCardProps {
  title: string;
  value: string;
  delta?: number | null;
  deltaLabel?: string;
  icon: React.ElementType;
  iconColor?: string;
  className?: string;
  delay?: number;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title, value, delta, deltaLabel = 'vs prior year', icon: Icon, iconColor = 'accent', className, delay = 0,
}) => {
  const isPos   = delta !== undefined && delta !== null && delta > 0;
  const isNeg   = delta !== undefined && delta !== null && delta < 0;
  const isFlat  = delta !== undefined && delta !== null && delta === 0;

  const iconBg: Record<string, string> = {
    accent:   'bg-accent/10   text-accent',
    positive: 'bg-positive/10 text-positive',
    negative: 'bg-negative/10 text-negative',
    warning:  'bg-warning/10  text-warning',
    cyan:     'bg-cyan/10     text-cyan',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111A2E]/80 backdrop-blur p-5',
        'shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] transition-all duration-300',
        'hover:shadow-[0_0_30px_-4px_rgba(59,130,246,0.2)] hover:border-accent/30 group',
        className,
      )}
    >
      {/* Glow blob */}
      <div className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-accent/5 blur-2xl group-hover:bg-accent/10 transition-colors duration-500" />

      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">{title}</p>
        <div className={cn('shrink-0 rounded-full p-2 transition-colors', iconBg[iconColor] ?? iconBg.accent)}>
          <Icon size={16} />
        </div>
      </div>

      <p className="font-mono text-[1.75rem] font-bold leading-none tracking-tight text-white mb-3">
        {value}
      </p>

      {delta !== undefined && delta !== null && (
        <div className="flex items-center gap-1.5">
          <span className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
            isPos  && 'bg-positive/15 text-positive',
            isNeg  && 'bg-negative/15 text-negative',
            isFlat && 'bg-gray-700/50  text-gray-400',
          )}>
            {isPos  && <TrendingUp  size={11} />}
            {isNeg  && <TrendingDown size={11} />}
            {isFlat && <Minus size={11} />}
            {isPos ? '+' : ''}{(Math.abs(delta) * 100).toFixed(1)}%
          </span>
          <span className="text-[11px] text-gray-500">{deltaLabel}</span>
        </div>
      )}
    </motion.div>
  );
};
