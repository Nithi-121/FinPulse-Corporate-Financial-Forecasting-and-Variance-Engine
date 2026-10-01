import React, { createContext, useContext, useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { type Company } from '../data/mockData';

// ── Context ───────────────────────────────────────────────────
interface DashboardCtx {
  company: Company;
  setCompany: (c: Company) => void;
}
export const DashboardContext = createContext<DashboardCtx>({
  company: 'HPE',
  setCompany: () => {},
});
export const useCompany = () => useContext(DashboardContext);

// ── Layout ────────────────────────────────────────────────────
export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [company, setCompany] = useState<Company>('HPE');

  return (
    <DashboardContext.Provider value={{ company, setCompany }}>
      <div className="flex h-screen bg-[#0B1120] text-gray-100 overflow-hidden selection:bg-accent/30">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar company={company} setCompany={setCompany} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
            <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </DashboardContext.Provider>
  );
};
