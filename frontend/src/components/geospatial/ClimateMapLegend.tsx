import React from 'react';
import { WeatherParameterKey } from '../../types';
import { WEATHER_PARAMETER_META } from '../../data/odishaDistricts';

interface ClimateMapLegendProps {
  parameter: WeatherParameterKey;
  compact?: boolean;
}

export const ClimateMapLegend: React.FC<ClimateMapLegendProps> = ({
  parameter,
  compact = false,
}) => {
  const meta = WEATHER_PARAMETER_META[parameter];

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700/90 p-3 shadow-md">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
          {meta.legendTitle}
        </span>
      </div>

      {/* Parameter Color Stops */}
      <div className={`grid ${compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-5 lg:grid-cols-6'} gap-2`}>
        {meta.stops.map((stop) => (
          <div key={stop.label} className="flex items-center gap-2 min-w-0">
            <span
              className="w-3.5 h-3.5 rounded-sm shrink-0 border border-black/10 dark:border-white/15"
              style={{ backgroundColor: stop.color }}
            />
            <div className="min-w-0 leading-tight">
              <div className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">
                {stop.label}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {stop.range}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Boundary & Reliability Key */}
      <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-500 ring-2 ring-teal-500/30" />
          ML / Observed Study District (15)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-dashed border-amber-900 dark:border-amber-200" />
          Climatological Estimate
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-600" />
          Unavailable Data
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-2.5 rounded-sm bg-slate-200/60 dark:bg-slate-700/50 border border-slate-400/60" />
          Non-Study Odisha District (15)
        </span>
      </div>
    </div>
  );
};

