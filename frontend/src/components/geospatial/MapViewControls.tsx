import React from 'react';
import { RotateCcw, Maximize2, Minimize2, RefreshCw } from 'lucide-react';

interface MapViewControlsProps {
  onResetView: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export const MapViewControls: React.FC<MapViewControlsProps> = ({
  onResetView,
  isFullscreen,
  onToggleFullscreen,
  onRefresh,
  loading,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onResetView}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-sm transition"
      >
        <RotateCcw className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
        <span>Show All Districts</span>
      </button>

      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        title="Refresh geospatial data from backend"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-sm transition disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">Refresh</span>
      </button>

      <button
        type="button"
        onClick={onToggleFullscreen}
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-sm transition"
      >
        {isFullscreen ? (
          <>
            <Minimize2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="hidden sm:inline">Exit Fullscreen</span>
          </>
        ) : (
          <>
            <Maximize2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="hidden sm:inline">Fullscreen</span>
          </>
        )}
      </button>
    </div>
  );
};

