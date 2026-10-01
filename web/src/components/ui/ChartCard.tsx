import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
  action?: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title, subtitle, children, className, delay = 0, action,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'rounded-2xl border border-white/[0.06] bg-[#111A2E]/80 backdrop-blur p-6',
        'shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] flex flex-col gap-4',
        'hover:border-white/[0.10] transition-colors duration-300',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-white leading-tight">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="min-h-[260px] w-full flex-1">{children}</div>
    </motion.div>
  );
};
