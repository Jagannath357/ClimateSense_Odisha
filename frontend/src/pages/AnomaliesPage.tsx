import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { District, AnomalyResponse } from '../types';
import { useTheme } from '../context/ThemeContext';
import { AnomalyTooltip } from '../components/ChartTooltips';
import {
  AlertTriangle,
  MapPin,
  Calendar,
  Layers,
  ShieldAlert,
  Flame,
  Snowflake
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend
} from 'recharts';

export const AnomaliesPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('cuttack');
  const [data, setData] = useState<AnomalyResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    api.getDistricts().then(res => {
      if (isMounted) setDistricts(res.districts);
    });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchAnomalies = async () => {
      setLoading(true);
      try {
        const res = await api.getClimateAnomalies(selectedDistrict);
        if (isMounted) setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAnomalies();
    return () => { isMounted = false; };
  }, [selectedDistrict]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
            <span>Climate Anomaly Detection</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Observed departures from the 2001–2010 normal baseline & daily climatological Z-score extreme excursions.
          </p>
        </div>
      </div>

      {/* District Toolbar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-teal-600" />
            Filter District:
          </span>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-900 dark:text-slate-100 shadow-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            {districts.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.region})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
          <Calendar className="w-3.5 h-3.5" />
          <span>Climatological Normal Baseline: <strong>2001–2010 (10-Year Mean)</strong></span>
        </div>
      </div>

      {/* Mandatory Scientific Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-sm block">Scientific & Operational Distinction</span>
          <p className="leading-relaxed opacity-95">
            {data?.method_disclaimer ||
              'Statistical or ML anomalies indicate numerical deviations from historical climatology and do not automatically denote meteorological disasters or civil emergencies.'}
          </p>
        </div>
      </div>

      {/* Annual Temperature Anomaly Chart */}
      {data && data.annual_anomalies && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Annual Mean Temperature Anomaly in {selectedDistrict.toUpperCase()} (°C vs 2001–2010 Baseline)
              </h3>
              <p className="text-xs text-slate-500">
                Red bars denote warmer-than-baseline years; blue bars denote cooler-than-baseline years.
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.annual_anomalies} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.7} />
                <XAxis
                  dataKey="year"
                  stroke={isDark ? '#64748b' : '#94a3b8'}
                  tick={{ fontSize: 11, fill: isDark ? '#cbd5e1' : '#475569' }}
                />
                <YAxis
                  stroke={isDark ? '#64748b' : '#94a3b8'}
                  tick={{ fontSize: 11, fill: isDark ? '#cbd5e1' : '#475569' }}
                />
                <Tooltip
                  content={<AnomalyTooltip />}
                  cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' }}
                />
                <Bar dataKey="T2M_anomaly" name="Temp Anomaly (°C)" radius={[4, 4, 0, 0]}>
                  {data.annual_anomalies.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.T2M_anomaly >= 0
                          ? isDark ? '#f87171' : '#dc2626'
                          : isDark ? '#38bdf8' : '#0284c7'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Daily Climatological Extremes Table */}
      {data && data.recent_extremes && data.recent_extremes.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>Detected Daily Extreme Climatological Excursions (|Z| ≥ 2.5)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Days where recorded observations deviated by ≥ 2.5 standard deviations from the 25-year day-of-year normal.
              </p>
            </div>
            <span className="text-xs text-slate-400">{data.recent_extremes.length} extreme dates logged</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Variable</th>
                  <th className="py-2.5 px-3">Observed</th>
                  <th className="py-2.5 px-3">25-Yr Normal</th>
                  <th className="py-2.5 px-3">Std Dev</th>
                  <th className="py-2.5 px-3">Z-Score</th>
                  <th className="py-2.5 px-3">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.recent_extremes.map((ex, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">{ex.date}</td>
                    <td className="py-2.5 px-3 font-mono">{ex.variable}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{ex.observed_value} {ex.unit}</td>
                    <td className="py-2.5 px-3 text-slate-400">{ex.historical_day_mean} {ex.unit}</td>
                    <td className="py-2.5 px-3 text-slate-400">±{ex.historical_day_std}</td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      <span className={ex.z_score > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}>
                        {ex.z_score > 0 ? `+${ex.z_score}` : ex.z_score}σ
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold ${
                        ex.anomaly_category.includes('High')
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                      }`}>
                        {ex.anomaly_category.includes('High') ? <Flame className="w-3 h-3 text-rose-500" /> : <Snowflake className="w-3 h-3 text-blue-500" />}
                        {ex.anomaly_category}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

