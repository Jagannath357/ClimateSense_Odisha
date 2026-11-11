import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DashboardSummary } from '../types';
import { useTheme } from '../context/ThemeContext';
import { MultiSeriesTooltip } from '../components/ChartTooltips';
import {
  Thermometer,
  CloudRain,
  Droplets,
  Wind,
  Layers,
  Sparkles,
  Database,
  Calendar,
  AlertCircle,
  ArrowRight,
  MapPin
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

interface OverviewPageProps {
  onNavigateToPrediction: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigateToPrediction }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const result = await api.getDashboardSummary();
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to connect to backend.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSummary();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Loading ClimateSense Odisha state analytics...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-3xl mx-auto my-12 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-rose-900 dark:text-rose-200">Unable to load dashboard data</h3>
        <p className="text-sm text-rose-700 dark:text-rose-300">
          {error || 'Make sure the FastAPI backend is running on http://127.0.0.1:8000.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-8 md:p-10 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Machine Learning Climatology Suite
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            ClimateSense <span className="text-teal-400">Odisha</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Intelligent Climate Monitoring, Statistical Anomaly Detection & Leakage-Safe Next-Day Weather Prediction powered by 25 years of NASA POWER daily observations across 15 Odisha districts.
          </p>
          <div className="pt-2">
            <button
              onClick={onNavigateToPrediction}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-teal-500/25 group"
            >
              <span>Launch Next-Day Prediction</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Top 4 Key Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Districts Analyzed</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{data.total_districts}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Observations</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{data.total_observations.toLocaleString()}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Temporal Coverage</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">2001 – 2025</p>
            <p className="text-[11px] text-slate-400">25 Full Years</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">ML Forecast Models</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">6 Targets</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Hurdle Rain + Lag Trees</p>
          </div>
        </div>
      </div>

      {/* State Averages at Latest Observation Date */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>State-Wide Climate Snapshot ({data.latest_available_date})</span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Calculated across all 15 districts for the latest dataset date
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
              <span>Mean Temperature</span>
              <Thermometer className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {data.state_averages.T2M} <span className="text-sm font-normal text-slate-500">°C</span>
            </p>
            <p className="text-[11px] text-slate-400">
              Min: {data.state_averages.T2M_MIN}°C • Max: {data.state_averages.T2M_MAX}°C
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
              <span>Relative Humidity</span>
              <Droplets className="w-4 h-4 text-cyan-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {data.state_averages.RH2M} <span className="text-sm font-normal text-slate-500">%</span>
            </p>
            <p className="text-[11px] text-slate-400">At 2m above ground</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
              <span>Precipitation</span>
              <CloudRain className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {data.state_averages.PRECTOTCORR} <span className="text-sm font-normal text-slate-500">mm/day</span>
            </p>
            <p className="text-[11px] text-slate-400">Corrected daily accumulation</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
              <span>Wind Speed</span>
              <Wind className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {data.state_averages.WS2M} <span className="text-sm font-normal text-slate-500">m/s</span>
            </p>
            <p className="text-[11px] text-slate-400">Standard 2m surface wind</p>
          </div>
        </div>
      </div>

      {/* 30-Day State-Wide Time Series Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent 30-Day Multi-Variable Progression (State Mean)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              December 2025 daily mean temperature, humidity, and rainfall patterns
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.recent_climate_series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.7} />
              <XAxis
                dataKey="date"
                stroke={isDark ? '#64748b' : '#94a3b8'}
                tick={{ fontSize: 11, fill: isDark ? '#cbd5e1' : '#475569' }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis
                yAxisId="left"
                stroke={isDark ? '#64748b' : '#94a3b8'}
                tick={{ fontSize: 11, fill: isDark ? '#cbd5e1' : '#475569' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke={isDark ? '#64748b' : '#94a3b8'}
                tick={{ fontSize: 11, fill: isDark ? '#cbd5e1' : '#475569' }}
              />
              <Tooltip content={<MultiSeriesTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line yAxisId="left" type="monotone" dataKey="T2M" stroke="#ef4444" name="Temp (°C)" strokeWidth={2} dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="RH2M" stroke="#06b6d4" name="Humidity (%)" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="PRECTOTCORR" stroke="#3b82f6" name="Rainfall (mm/day)" strokeWidth={2} dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="WS2M" stroke="#10b981" name="Wind (m/s)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* District Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>15 Monitored Districts of Odisha</span>
          </h2>
          <span className="text-xs text-slate-500">Sorted alphabetically</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.districts.map((d) => (
            <div
              key={d.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500/50 transition duration-150 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">{d.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{d.region}</p>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                  {d.elevation_m}m elev
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <div>
                  <span className="text-slate-400">Temperature:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{d.latest_T2M} °C</p>
                </div>
                <div>
                  <span className="text-slate-400">Humidity:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{d.latest_RH2M} %</p>
                </div>
                <div>
                  <span className="text-slate-400">Rainfall:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{d.latest_PRECTOTCORR} mm</p>
                </div>
                <div>
                  <span className="text-slate-400">Wind Speed:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{d.latest_WS2M} m/s</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Findings Card */}
      <div className="p-6 rounded-2xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Database className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Verified Empirical Observations & Safeguards</span>
        </h3>
        <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
          {data.key_findings.map((finding, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
              <span>{finding}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

