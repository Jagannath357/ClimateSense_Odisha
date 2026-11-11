import React from 'react';
import { Database, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 dark:text-slate-400">
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>
            Data Source: <strong className="text-slate-700 dark:text-slate-300">NASA POWER Agroclimatology</strong> (MERRA-2 Reanalysis & CERES/GEWEX Solar Data).
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Chronologically Partitioned & Leakage-Safe ML</span>
          </span>
          <span>•</span>
          <span>Odisha, India (2001–2025)</span>
        </div>
      </div>
    </footer>
  );
};

