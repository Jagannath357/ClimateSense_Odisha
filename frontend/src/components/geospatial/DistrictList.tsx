import React, { useMemo, useState } from 'react';
import { ArrowUpDown, MapPin } from 'lucide-react';
import {
  GeospatialDistrictPrediction,
  WeatherParameterKey,
} from '../../types';
import {
  formatParameterValue,
  getParameterColor,
  WEATHER_PARAMETER_META,
} from '../../data/odishaDistricts';
import { useTheme } from '../../context/ThemeContext';

interface DistrictListProps {
  districts: GeospatialDistrictPrediction[];
  activeParameter: WeatherParameterKey;
  selectedDistrictId: string | null;
  onSelectDistrict: (districtId: string) => void;
}

export const DistrictList: React.FC<DistrictListProps> = ({
  districts,
  activeParameter,
  selectedDistrictId,
  onSelectDistrict,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [sortBy, setSortBy] = useState<'value' | 'name'>('value');

  const meta = WEATHER_PARAMETER_META[activeParameter];

  const sortedDistricts = useMemo(() => {
    const copy = [...districts];
    if (sortBy === 'name') {
      copy.sort((a, b) =>
        a.district_display_name.localeCompare(b.district_display_name)
      );
    } else {
      copy.sort((a, b) => {
        const va = a[activeParameter];
        const vb = b[activeParameter];
        if (va === null || va === undefined) return 1;
        if (vb === null || vb === undefined) return -1;
        return vb - va;
      });
    }
    return copy;
  }, [districts, activeParameter, sortBy]);

  const maxVal = useMemo(() => {
    let m = 0;
    for (const d of districts) {
      const v = d[activeParameter];
      if (v !== null && v !== undefined && v > m) m = v;
    }
    return m;
  }, [districts, activeParameter]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full max-h-[600px]">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            15 Study Districts
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Ranked by {meta.shortLabel} ({meta.unit})
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSortBy((s) => (s === 'value' ? 'name' : 'value'))}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 transition"
          title="Toggle sort order"
        >
          <ArrowUpDown className="w-3 h-3 text-teal-600 dark:text-teal-400" />
          <span>{sortBy === 'value' ? 'By Value' : 'A–Z'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 p-2 space-y-1">
        {sortedDistricts.map((d) => {
          const val = d[activeParameter];
          const color = getParameterColor(activeParameter, val, isDark);
          const isSelected = d.district === selectedDistrictId;
          const pct =
            val !== null && val !== undefined && maxVal > 0
              ? Math.max(4, Math.min(100, (val / maxVal) * 100))
              : 0;

          return (
            <button
              key={d.district}
              type="button"
              onClick={() => onSelectDistrict(d.district)}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition flex flex-col gap-1.5 ${
                isSelected
                  ? 'bg-teal-50 dark:bg-teal-950/60 ring-1 ring-teal-500/70'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {d.district_display_name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                    {d.region}
                  </span>
                </div>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white shrink-0 font-mono">
                  {formatParameterValue(activeParameter, val)}
                </span>
              </div>

              {/* Relative Bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
                {d.status === 'climatological_estimate' && (
                  <span className="text-[9px] font-bold uppercase text-amber-600 dark:text-amber-400 shrink-0">
                    Clim.
                  </span>
                )}
                {d.status === 'unavailable' && (
                  <span className="text-[9px] font-bold uppercase text-rose-600 dark:text-rose-400 shrink-0">
                    N/A
                  </span>
                )}
                {isSelected && (
                  <MapPin className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

