import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, AlertTriangle, GitCompare, ShieldCheck, Info,
  Activity, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { path: '/',          label: 'Overview',            icon: LayoutDashboard },
  { path: '/forecasts', label: 'Forecasts',           icon: TrendingUp },
  { path: '/anomalies', label: 'Variance & Anomalies',icon: AlertTriangle },
  { path: '/models',    label: 'Model Comparison',    icon: GitCompare },
  { path: '/quality',   label: 'Data Quality',        icon: ShieldCheck },
  { path: '/about',     label: 'About',               icon: Info },
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
      className="hidden md:flex flex-col shrink-0 bg-[#0D1525]/80 border-r border-white/[0.06] h-screen sticky top-0 z-20 backdrop-blur overflow-hidden"
    >
      {/* Logo */}
      <div className={cn('h-16 flex items-center border-b border-white/[0.06] gap-3 shrink-0', collapsed ? 'justify-center px-2' : 'px-5')}>
        <div className="shrink-0 bg-accent/20 p-2 rounded-lg text-accent">
          <Activity size={18} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="text-lg font-bold whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
            >
              FinPulse
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-1 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">Analytics</p>
        )}
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => cn(
              'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200',
              collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5',
              isActive
                ? 'bg-accent/10 text-accent shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2)]'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5',
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={17} className="shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className={cn('p-3 border-t border-white/[0.06] shrink-0', collapsed ? 'flex justify-center' : '')}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors w-full"
        >
          {collapsed ? <ChevronRight size={15} /> : <><ChevronLeft size={15} /><span>Collapse</span></>}
        </button>
      </div>
    </motion.aside>
  );
};
