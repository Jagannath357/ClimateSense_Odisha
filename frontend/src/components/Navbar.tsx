import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, CloudSun, Activity, Menu, X } from 'lucide-react';
import { api } from '../services/api';

interface NavbarProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick, isSidebarOpen }) => {
  const { theme, toggleTheme } = useTheme();
  const [backendReady, setBackendReady] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkBackend = async () => {
      try {
        const health = await api.getHealth();
        if (isMounted) setBackendReady(health.status === 'healthy');
      } catch {
        if (isMounted) setBackendReady(false);
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle Navigation"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 via-cyan-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20 shrink-0">
              <CloudSun className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
                  ClimateSense <span className="text-teal-600 dark:text-teal-400">Odisha</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  ML Platform
                </span>
              </div>
              <p className="hidden md:block text-xs text-slate-500 dark:text-slate-400">
                NASA POWER 2001–2025 • Empirical Climatology & 1-Day Forecasts
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Backend Status indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <span
              className={`w-2 h-2 rounded-full ${
                backendReady === null
                  ? 'bg-amber-400 animate-pulse'
                  : backendReady
                  ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
                  : 'bg-rose-500 ring-2 ring-rose-500/20'
              }`}
            />
            <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Activity className="w-3 h-3 text-slate-400" />
              {backendReady === null ? 'Connecting...' : backendReady ? 'Backend Online' : 'Backend Disconnected'}
            </span>
          </div>

          {/* Theme Toggle Button System */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 shadow-inner">
            <button
              type="button"
              onClick={() => theme !== 'light' && toggleTheme()}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200 ${
                theme === 'light'
                  ? 'bg-white text-teal-700 shadow-sm border border-slate-200/90'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title="Switch to Light Theme"
              aria-label="Light theme"
            >
              <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-500' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Light</span>
            </button>
            <button
              type="button"
              onClick={() => theme !== 'dark' && toggleTheme()}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-slate-900 text-teal-300 shadow-sm border border-slate-700'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title="Switch to Dark Theme"
              aria-label="Dark theme"
            >
              <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Dark</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

