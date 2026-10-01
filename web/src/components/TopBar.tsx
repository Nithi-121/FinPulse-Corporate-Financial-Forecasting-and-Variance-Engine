import React from 'react';
import { Download, Sun } from 'lucide-react';
import { COMPANIES, COMPANY_FULL, type Company } from '../data/mockData';

interface TopBarProps {
  company: Company;
  setCompany: (c: Company) => void;
}

const MONOGRAM_COLORS: Record<Company, string> = {
  HPE:  'bg-[#01A982]/20 text-[#01A982]',
  DELL: 'bg-blue-500/20  text-blue-400',
  CSCO: 'bg-[#00BCEB]/20 text-[#00BCEB]',
  IBM:   'bg-[#1F70C1]/20 text-[#1F70C1]',
  NTAP: 'bg-purple-500/20 text-purple-400',
};

export const TopBar: React.FC<TopBarProps> = ({ company, setCompany }) => {
  return (
    <header className="h-16 shrink-0 border-b border-white/[0.06] bg-[#0D1525]/80 backdrop-blur-md sticky top-0 z-10 flex items-center gap-3 px-4 md:px-6">
      {/* Company selector */}
      <div className="flex items-center gap-2">
        <div className={`shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${MONOGRAM_COLORS[company]}`}>
          {company.slice(0, 2)}
        </div>
        <select
          value={company}
          onChange={(e) => setCompany(e.target.value as Company)}
          className="bg-[#0B1120] border border-white/[0.08] text-white text-sm rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-accent focus:border-accent outline-none cursor-pointer"
        >
          {COMPANIES.map((c) => (
            <option key={c} value={c}>
              {c} — {COMPANY_FULL[c]}
            </option>
          ))}
        </select>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-white/[0.08] rounded-lg px-3 py-1.5 transition-colors hover:border-white/20"
          title="Toggle theme (coming soon)"
        >
          <Sun size={15} />
          <span>Light</span>
        </button>

        <button className="flex items-center gap-1.5 bg-accent hover:bg-accent/90 active:bg-accent/80 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">
          <Download size={15} />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </header>
  );
};
