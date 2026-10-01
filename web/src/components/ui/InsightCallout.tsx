import React from 'react';
import { cn } from '../../lib/utils';
import { Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

interface InsightCalloutProps {
  insight: string;
  className?: string;
}

export const InsightCallout: React.FC<InsightCalloutProps> = ({ insight, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className={cn(
        'relative overflow-hidden rounded-xl border border-accent/20 px-5 py-4',
        'bg-gradient-to-r from-accent/10 via-[#111A2E] to-[#111A2E]',
        'flex items-start gap-4',
        className,
      )}
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 h-full w-0.5 rounded-full bg-gradient-to-b from-accent to-cyan" />

      <div className="mt-0.5 shrink-0 rounded-full bg-accent/20 p-2 text-accent">
        <Lightbulb size={18} />
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-accent mb-1">CFO Brief</p>
        <p className="text-sm text-gray-200 leading-relaxed">{insight}</p>
      </div>
    </motion.div>
  );
};
