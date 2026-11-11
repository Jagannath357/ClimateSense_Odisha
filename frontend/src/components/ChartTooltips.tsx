import React from 'react';
import { useTheme } from '../context/ThemeContext';

export interface AnomalyTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
}

export const AnomalyTooltip: React.FC<AnomalyTooltipProps> = ({ active, payload, label }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const anomaly = Number(data.T2M_anomaly ?? payload[0].value ?? 0);
  const isPositive = anomaly >= 0;
  const observed = data.T2M !== undefined ? Number(data.T2M).toFixed(2) : null;
  const baseline = data.T2M_baseline !== undefined ? Number(data.T2M_baseline).toFixed(2) : null;

  return (
    <div
      className={`rounded-2xl p-4 shadow-2xl border text-xs min-w-[210px] transition-all backdrop-blur-md ${
        isDark
          ? 'bg-slate-900/95 border-slate-700/80 text-slate-100 shadow-black/60'
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/50'
      }`}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80 dark:border-slate-800">
        <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
          Year {label}
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isPositive
              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
          }`}
        >
          {isPositive ? '▲ Warmer' : '▼ Cooler'}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Temperature Anomaly:</span>
          <span
            className={`font-black font-mono text-sm ${
              isPositive ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'
            }`}
          >
            {isPositive ? `+${anomaly.toFixed(3)}` : anomaly.toFixed(3)} °C
          </span>
        </div>

        {observed !== null && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Annual Observed Mean:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{observed} °C</span>
          </div>
        )}

        {baseline !== null && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">2001–2010 Normal:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">{baseline} °C</span>
          </div>
        )}
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[10px] text-slate-400 leading-tight">
        Relative to 10-year climatological normal baseline
      </div>
    </div>
  );
};

export interface MultiSeriesTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
}

export const MultiSeriesTooltip: React.FC<MultiSeriesTooltipProps> = ({ active, payload, label }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!active || !payload || !payload.length) return null;

  return (
    <div
      className={`rounded-2xl p-4 shadow-2xl border text-xs min-w-[200px] transition-all backdrop-blur-md ${
        isDark
          ? 'bg-slate-900/95 border-slate-700/80 text-slate-100 shadow-black/60'
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/50'
      }`}
    >
      <div className="pb-2 mb-2 font-bold text-slate-900 dark:text-white border-b border-slate-200/80 dark:border-slate-800">
        Date / Period: <span className="font-mono text-teal-600 dark:text-teal-400">{label}</span>
      </div>

      <div className="space-y-1.5">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: entry.color || entry.stroke }}
              />
              <span className="text-slate-600 dark:text-slate-300 font-medium">{entry.name}:</span>
            </div>
            <span className="font-bold font-mono text-slate-900 dark:text-white">
              {entry.value !== null && entry.value !== undefined ? Number(entry.value).toFixed(2) : 'N/A'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export interface TrendTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
}

export const TrendTooltip: React.FC<TrendTooltipProps> = ({ active, payload, label }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const slope = Number(data.slope ?? payload[0].value ?? 0);
  const isPositive = slope >= 0;

  return (
    <div
      className={`rounded-2xl p-4 shadow-2xl border text-xs min-w-[210px] transition-all backdrop-blur-md ${
        isDark
          ? 'bg-slate-900/95 border-slate-700/80 text-slate-100 shadow-black/60'
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/50'
      }`}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80 dark:border-slate-800">
        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
          {label}
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            data.significant
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          {data.significant ? 'p < 0.05 (Sig)' : 'p ≥ 0.05'}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 dark:text-slate-400">Sen Slope / Year:</span>
          <span
            className={`font-black font-mono text-sm ${
              isPositive ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'
            }`}
          >
            {isPositive ? `+${slope.toFixed(6)}` : slope.toFixed(6)}
          </span>
        </div>
      </div>
    </div>
  );
};

