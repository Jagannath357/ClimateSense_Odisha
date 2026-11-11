import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  CalendarDays,
  MapPinned,
  TrendingUp,
  AlertTriangle,
  Cpu,
  Info,
  ChevronRight
} from 'lucide-react';

export type PageId =
  | 'overview'
  | 'prediction'
  | 'historical'
  | 'geospatial'
  | 'trends'
  | 'anomalies'
  | 'performance'
  | 'about';

interface SidebarProps {
  currentPage: PageId;
  onPageSelect: (page: PageId) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onPageSelect,
  isOpen,
  onClose,
}) => {
  const navItems = [
    {
      id: 'overview' as PageId,
      label: 'Overview Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'prediction' as PageId,
      label: 'Next-Day Prediction',
      icon: Sparkles,
      badge: 'Core ML',
      badgeColor: 'bg-teal-500 text-white dark:bg-teal-400 dark:text-slate-950 font-bold',
    },
    {
      id: 'historical' as PageId,
      label: 'Historical Climate',
      icon: CalendarDays,
      badge: null,
    },
    {
      id: 'geospatial' as PageId,
      label: 'Geospatial Climate Map',
      icon: MapPinned,
      badge: 'NEW',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
    },
    {
      id: 'trends' as PageId,
      label: 'Climate Trends',
      icon: TrendingUp,
      badge: 'Sen Slope',
      badgeColor: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    },
    {
      id: 'anomalies' as PageId,
      label: 'Anomaly Detection',
      icon: AlertTriangle,
      badge: 'Baselines',
      badgeColor: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    },
    {
      id: 'performance' as PageId,
      label: 'Model Performance',
      icon: Cpu,
      badge: 'Validation',
      badgeColor: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300',
    },
    {
      id: 'about' as PageId,
      label: 'About Project',
      icon: Info,
      badge: null,
    },
  ];

  const handleSelect = (id: PageId) => {
    onPageSelect(id);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky top-16 left-0 z-40 w-64 shrink-0 h-[calc(100vh-4rem)] bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out overflow-y-auto flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-1.5">
          <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            Platform Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 shadow-sm border border-teal-200/70 dark:border-teal-800/80 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-teal-600 dark:text-teal-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md ${
                        item.badgeColor || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* District & Dataset Quick Stats Pill */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <div className="flex justify-between font-medium">
            <span>Coverage:</span>
            <span className="text-slate-800 dark:text-slate-200">15 Districts</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Observations:</span>
            <span className="text-slate-800 dark:text-slate-200">136,965 Days</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Data Span:</span>
            <span className="text-slate-800 dark:text-slate-200">2001 – 2025</span>
          </div>
        </div>
      </aside>
    </>
  );
};

