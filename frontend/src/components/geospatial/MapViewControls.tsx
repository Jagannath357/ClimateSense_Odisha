import React from 'react';
import { RotateCcw, Maximize2, Minimize2, RefreshCw, Layers } from 'lucide-react';
import { BasemapStyle } from '../../types';

interface MapViewControlsProps {
  onResetView: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onRefresh: () => void;
  loading: boolean;
  basemapStyle: BasemapStyle;
  onChangeBasemapStyle: (style: BasemapStyle) => void;
}

export const MapViewControls: React.FC<MapViewControlsProps> = ({
  onResetView,
  isFullscreen,
  onToggleFullscreen,
  onRefresh,
  loading,
  basemapStyle,
  onChangeBasemapStyle,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Basemap Style Switcher (100% Free, No Watermark, No API Key) */}
      <div className="inline-flex items-center p-0.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm text-xs">
        <span className="pl-2 pr-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 hidden sm:inline-flex items-center gap-1">
          <Layers className="w-3 h-3 text-teal-600 dark:text-teal-400" />
          Map:
        </span>
        <button
          type="button"
          onClick={() => onChangeBasemapStyle('canvas')}
          title="Clean Canvas (Dark/Light adaptive, no watermark)"
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
            basemapStyle === 'canvas'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Canvas
        </button>
        <button
          type="button"
          onClick={() => onChangeBasemapStyle('osm')}
          title="OpenStreetMap Standard Geography"
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
            basemapStyle === 'osm'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Street (OSM)
        </button>
        <button
          type="button"
          onClick={() => onChangeBasemapStyle('satellite')}
          title="Satellite Imagery"
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
            basemapStyle === 'satellite'
              ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Satellite
        </button>
      </div>

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

