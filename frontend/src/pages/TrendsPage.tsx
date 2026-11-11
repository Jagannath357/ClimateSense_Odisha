import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { District, TrendRecord } from '../types';
import { useTheme } from '../context/ThemeContext';
import { TrendTooltip } from '../components/ChartTooltips';
import {
  TrendingUp,
  MapPin,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

export const TrendsPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedVariable, setSelectedVariable] = useState<string>('T2M');
  const [trends, setTrends] = useState<TrendRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const variables = [
    { id: 'T2M', label: 'Average Temperature (T2M)' },
    { id: 'T2M_MAX', label: 'Maximum Temperature (T2M_MAX)' },
    { id: 'T2M_MIN', label: 'Minimum Temperature (T2M_MIN)' },
    { id: 'PRECTOTCORR', label: 'Precipitation (PRECTOTCORR)' },
    { id: 'RH2M', label: 'Relative Humidity (RH2M)' },
    { id: 'WS2M', label: 'Wind Speed (WS2M)' },
  ];

  useEffect(() => {
    let isMounted = true;
    api.getDistricts().then(res => {
      if (isMounted) setDistricts(res.districts);
    });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchTrends = async () => {
      setLoading(true);
      try {
        const res = await api.getClimateTrends(selectedDistrict || undefined, selectedVariable || undefined);
        if (isMounted) setTrends(res.trends);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchTrends();
    return () => { isMounted = false; };
  }, [selectedDistrict, selectedVariable]);

  // Chart data: slope per district for selected variable
  const chartData = trends.map(t => ({
    district: t.district.toUpperCase(),
    slope: t.sen_slope_per_year,
    significant: t.is_statistically_significant
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            <span>Statistical Climate Trends</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Non-parametric Theil–Sen slope estimators and Kendall tau rank correlation tests across Odisha (2001–2025).
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="space-y-1">
          <label className="font-bold text-slate-600 dark:text-slate-300">Filter by District</label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
          >
            <option value="">All 15 Odisha Districts</option>
            {districts.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-bold text-slate-600 dark:text-slate-300">Climate Variable</label>
          <select
            value={selectedVariable}
            onChange={(e) => setSelectedVariable(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
          >
            {variables.map(v => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Slope Comparison Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Theil–Sen Annual Rate of Change (Δ / Year) for {selectedVariable}
            </h3>
            <p className="text-xs text-slate-500">
              Positive values indicate increasing long-term trajectory; colored bars highlight statistical significance (p &lt; 0.05).
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.7} />
              <XAxis
                dataKey="district"
                stroke={isDark ? '#64748b' : '#94a3b8'}
                tick={{ fontSize: 10, fill: isDark ? '#cbd5e1' : '#475569' }}
              />
              <YAxis
                stroke={isDark ? '#64748b' : '#94a3b8'}
                tick={{ fontSize: 10, fill: isDark ? '#cbd5e1' : '#475569' }}
              />
              <Tooltip
                content={<TrendTooltip />}
                cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' }}
              />
              <Bar dataKey="slope" name="Sen Slope / Year" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.slope >= 0
                        ? entry.significant
                          ? isDark ? '#f87171' : '#dc2626'
                          : isDark ? '#fca5a5' : '#f87171'
                        : entry.significant
                        ? isDark ? '#38bdf8' : '#0284c7'
                        : isDark ? '#7dd3fc' : '#38bdf8'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Statistical Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Comprehensive Trend Statistics (90 Series Computed)
          </h3>
          <span className="text-xs text-slate-400">{trends.length} series matching filters</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">District</th>
                <th className="py-2.5 px-3">Variable</th>
                <th className="py-2.5 px-3">Years</th>
                <th className="py-2.5 px-3">Sen Slope / Yr</th>
                <th className="py-2.5 px-3">95% CI</th>
                <th className="py-2.5 px-3">Kendall Tau</th>
                <th className="py-2.5 px-3">p-value</th>
                <th className="py-2.5 px-3">Significance</th>
                <th className="py-2.5 px-3">Direction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {trends.map((t, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 uppercase">
                    {t.district}
                  </td>
                  <td className="py-2.5 px-3 font-mono">{t.variable} ({t.unit})</td>
                  <td className="py-2.5 px-3">{t.years} yrs</td>
                  <td className="py-2.5 px-3 font-mono font-semibold">
                    {t.sen_slope_per_year > 0 ? `+${t.sen_slope_per_year}` : t.sen_slope_per_year}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                    [{t.sen_slope_ci_low}, {t.sen_slope_ci_high}]
                  </td>
                  <td className="py-2.5 px-3 font-mono">{t.kendall_tau}</td>
                  <td className="py-2.5 px-3 font-mono">{t.kendall_p_value}</td>
                  <td className="py-2.5 px-3">
                    {t.is_statistically_significant ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" />
                        Significant (p&lt;0.05)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded text-slate-500 bg-slate-100 dark:bg-slate-800">
                        <Minus className="w-3 h-3" />
                        p ≥ 0.05
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                      t.trend_direction === 'warming' || t.trend_direction === 'increasing'
                        ? 'text-red-500'
                        : t.trend_direction === 'cooling' || t.trend_direction === 'decreasing'
                        ? 'text-blue-500'
                        : 'text-slate-400'
                    }`}>
                      {t.trend_direction === 'warming' || t.trend_direction === 'increasing' ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : t.trend_direction === 'cooling' || t.trend_direction === 'decreasing' ? (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      ) : null}
                      {t.trend_direction}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scientific Distinction Disclaimer */}
      <div className="p-5 rounded-2xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
          <HelpCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Scientific Distinction: Trends vs Daily Forecasts</span>
        </div>
        <p>
          Historical climate trends calculate 25-year monotonic drift and robust slope estimators across observed annual district averages. They provide empirical evidence of long-term climate change trajectories and must NOT be confused with 1-day ahead operational weather forecasts, nor do they imply direct causal attribution without coupled earth-system modeling.
        </p>
      </div>
    </div>
  );
};

