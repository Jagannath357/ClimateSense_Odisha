import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { District, PredictionResponse, PredictionHistoryRecord } from '../types';
import { useTheme } from '../context/ThemeContext';
import { MultiSeriesTooltip } from '../components/ChartTooltips';
import {
  Sparkles,
  Calendar,
  MapPin,
  Thermometer,
  CloudRain,
  Droplets,
  Wind,
  ShieldCheck,
  AlertTriangle,
  Info,
  Clock,
  Download,
  History,
  CheckCircle2
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

interface PredictionPageProps {
  initialDistrict?: string | null;
  initialDate?: string | null;
}

export const PredictionPage: React.FC<PredictionPageProps> = ({
  initialDistrict,
  initialDate,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    initialDistrict || 'cuttack'
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || '2025-12-30'
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [history, setHistory] = useState<PredictionHistoryRecord[]>([]);

  // Load districts and prediction history on mount
  useEffect(() => {
    let isMounted = true;
    const initData = async () => {
      try {
        const dRes = await api.getDistricts();
        if (isMounted) {
          setDistricts(dRes.districts);
          if (dRes.districts.length > 0 && !selectedDistrict) {
            setSelectedDistrict(dRes.districts[0].id);
          }
        }
        const hRes = await api.getPredictionHistory(15);
        if (isMounted) setHistory(hRes.history);
      } catch (err: any) {
        if (isMounted) setError('Failed to initialize districts: ' + err.message);
      }
    };
    initData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePredict = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedDistrict || !selectedDate) return;

    try {
      setLoading(true);
      setError(null);
      const res = await api.predictNextDay(selectedDistrict, selectedDate);
      setPrediction(res);
      // Refresh history
      const hRes = await api.getPredictionHistory(15);
      setHistory(hRes.history);
    } catch (err: any) {
      setError(err.message || 'Failed to generate prediction.');
    } finally {
      setLoading(false);
    }
  };

  // Run initial prediction once districts load
  useEffect(() => {
    if (districts.length > 0 && !prediction) {
      handlePredict();
    }
  }, [districts]);

  const handleExportCSV = () => {
    if (history.length === 0) return;
    const headers = ['id', 'timestamp', 'district', 'input_date', 'prediction_date', 'data_status', 'T2M_C', 'PRECTOTCORR_mm', 'RH2M_pct', 'WS2M_ms'];
    const rows = history.map(h => [
      h.id,
      h.timestamp,
      h.district,
      h.input_date,
      h.prediction_date,
      h.data_status,
      h.predictions?.T2M?.value ?? '',
      h.predictions?.PRECTOTCORR?.value ?? '',
      h.predictions?.RH2M?.value ?? '',
      h.predictions?.WS2M?.value ?? ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `climatesense_odisha_predictions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title & Priority Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Core Machine Learning Feature
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Next-Day Climate Prediction
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Select an input observation date to forecast atmospheric conditions for the next calendar day (<code className="font-mono text-teal-600 dark:text-teal-400">T + 1</code>).
          </p>
        </div>

        {/* Quick Date Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Presets:</span>
          <button
            type="button"
            onClick={() => { setSelectedDate('2025-12-30'); }}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
          >
            2025-12-30 (Hist Valid)
          </button>
          <button
            type="button"
            onClick={() => { setSelectedDate('2025-12-31'); }}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
          >
            2025-12-31 (Latest Source)
          </button>
          <button
            type="button"
            onClick={() => { setSelectedDate('2025-08-15'); }}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
          >
            2025-08-15 (Monsoon)
          </button>
          <button
            type="button"
            onClick={() => { setSelectedDate('2026-10-29'); }}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
          >
            2026-10-29 (Future Test)
          </button>
        </div>
      </div>

      {/* Control Panel / Form Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-md">
        <form onSubmit={handlePredict} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          {/* District selector */}
          <div className="sm:col-span-4 space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                Select District
              </span>
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
            >
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.region})
                </option>
              ))}
            </select>
          </div>

          {/* Reference Date Picker */}
          <div className="sm:col-span-4 space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                Reference Input Date
              </span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
            />
          </div>

          {/* Predict Action Button */}
          <div className="sm:col-span-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[42px] px-6 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-teal-500/20 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Computing Lag Features...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Predict Next Day</span>
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Prediction Output Section */}
      {prediction && (
        <div className="space-y-6">
          {/* Situation Alert Banner */}
          <div
            className={`p-5 rounded-2xl border text-sm flex items-start gap-3.5 shadow-sm ${
              prediction.is_climatological_estimate
                ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                : prediction.data_status === 'latest_observation_forecast'
                ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            {prediction.is_climatological_estimate ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-base">
                  {prediction.is_climatological_estimate
                    ? 'Climatological Normal Estimate (Stale-Source Protected)'
                    : prediction.data_status === 'latest_observation_forecast'
                    ? '1-Day Forward Model Forecast (Latest Available Dataset Date)'
                    : 'Verified Next-Day Machine Learning Prediction'}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold bg-white/80 dark:bg-slate-900/80 border border-current">
                  Status: {prediction.data_status}
                </span>
              </div>
              <p className="text-xs opacity-90 leading-relaxed">{prediction.disclaimer}</p>
            </div>
          </div>

          {/* Temporal Alignment Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">District:</span>
              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                {prediction.district_display_name}
              </span>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <span className="text-slate-400">Input Reference Date:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-100 font-mono">
                  {prediction.input_date}
                </p>
              </div>

              <div className="text-teal-600 dark:text-teal-400 font-bold">➔</div>

              <div>
                <span className="text-slate-400">Forecast Target Date:</span>
                <p className="font-bold text-teal-600 dark:text-teal-400 font-mono text-sm">
                  {prediction.prediction_date} (T + 1)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Generated: {new Date(prediction.generated_at).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Multi-Target Prediction Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Temperature T2M */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Mean Temperature</span>
                <Thermometer className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {prediction.predictions.T2M?.value ?? 'N/A'}
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  {prediction.predictions.T2M?.unit}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80 flex justify-between">
                <span>Min: {prediction.predictions.T2M_MIN?.value ?? '-'} °C</span>
                <span>Max: {prediction.predictions.T2M_MAX?.value ?? '-'} °C</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                Model: {prediction.predictions.T2M?.model_name}
              </p>
            </div>

            {/* Precipitation Hurdle Model */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Precipitation (Hurdle)</span>
                <CloudRain className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {prediction.predictions.PRECTOTCORR?.value ?? '0.00'}
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  {prediction.predictions.PRECTOTCORR?.unit}
                </span>
              </div>
              {/* Category Badge & Probability */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
                  {prediction.predictions.PRECTOTCORR?.rainfall_category?.category || 'No Rain'}
                </span>
                {prediction.predictions.PRECTOTCORR?.rainfall_probability !== undefined && (
                  <span className="text-[11px] font-mono font-medium text-slate-500">
                    Prob: {((prediction.predictions.PRECTOTCORR.rainfall_probability || 0) * 100).toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                Classifier + Positive-Amount Log Regressor
              </p>
            </div>

            {/* Relative Humidity RH2M */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Relative Humidity</span>
                <Droplets className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {prediction.predictions.RH2M?.value ?? 'N/A'}
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  {prediction.predictions.RH2M?.unit}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <span>At 2m above surface</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                Model: {prediction.predictions.RH2M?.model_name}
              </p>
            </div>

            {/* Wind Speed WS2M */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Surface Wind Speed</span>
                <Wind className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {prediction.predictions.WS2M?.value ?? 'N/A'}
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  {prediction.predictions.WS2M?.unit}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <span>Standard 2m anemometer level</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                Model: {prediction.predictions.WS2M?.model_name}
              </p>
            </div>
          </div>

          {/* Ground Truth Comparison Card (When Ground Truth Exists in Dataset) */}
          {prediction.ground_truth_comparison?.has_ground_truth && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-300 dark:border-emerald-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-bold text-sm text-emerald-950 dark:text-emerald-100">
                    Post-Hoc Ground Truth Verification ({prediction.prediction_date})
                  </h3>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 font-semibold">
                  Zero Data Leakage • Evaluated Post-Inference
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-800/60">
                  <span className="text-[11px] text-slate-500">T2M (Mean Temp)</span>
                  <div className="flex justify-between items-baseline mt-1 text-xs">
                    <span>Act: {prediction.ground_truth_comparison.actual_values.T2M}°C</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      Δ {prediction.ground_truth_comparison.absolute_errors.T2M}°C
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-800/60">
                  <span className="text-[11px] text-slate-500">Rainfall</span>
                  <div className="flex justify-between items-baseline mt-1 text-xs">
                    <span>Act: {prediction.ground_truth_comparison.actual_values.PRECTOTCORR}mm</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      Δ {prediction.ground_truth_comparison.absolute_errors.PRECTOTCORR}mm
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-800/60">
                  <span className="text-[11px] text-slate-500">Humidity</span>
                  <div className="flex justify-between items-baseline mt-1 text-xs">
                    <span>Act: {prediction.ground_truth_comparison.actual_values.RH2M}%</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      Δ {prediction.ground_truth_comparison.absolute_errors.RH2M}%
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-800/60">
                  <span className="text-[11px] text-slate-500">Wind Speed</span>
                  <div className="flex justify-between items-baseline mt-1 text-xs">
                    <span>Act: {prediction.ground_truth_comparison.actual_values.WS2M}m/s</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      Δ {prediction.ground_truth_comparison.absolute_errors.WS2M}m/s
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7-Day Historical Context Chart */}
          {prediction.recent_7d_context && prediction.recent_7d_context.length > 0 && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    7-Day Pre-Forecast Context in {prediction.district_display_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Observations used to generate lag features (1d, 2d, 3d, 7d, 14d, and rolling 7-day mean)
                  </p>
                </div>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={prediction.recent_7d_context} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.7} />
                    <XAxis
                      dataKey="date"
                      stroke={isDark ? '#64748b' : '#94a3b8'}
                      tick={{ fontSize: 11, fill: isDark ? '#cbd5e1' : '#475569' }}
                    />
                    <YAxis
                      stroke={isDark ? '#64748b' : '#94a3b8'}
                      tick={{ fontSize: 11, fill: isDark ? '#cbd5e1' : '#475569' }}
                    />
                    <Tooltip content={<MultiSeriesTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Line type="monotone" dataKey="T2M" stroke="#ef4444" name="T2M (°C)" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="RH2M" stroke="#06b6d4" name="RH2M (%)" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="PRECTOTCORR" stroke="#3b82f6" name="Rainfall (mm)" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="WS2M" stroke="#10b981" name="Wind (m/s)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Prediction History Table Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Recent Prediction Invocations
            </h3>
          </div>

          {history.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No predictions recorded yet in this session.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">District</th>
                  <th className="py-2.5 px-3">Input Date</th>
                  <th className="py-2.5 px-3">Forecast Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Temp (°C)</th>
                  <th className="py-2.5 px-3">Rain (mm)</th>
                  <th className="py-2.5 px-3">Humidity (%)</th>
                  <th className="py-2.5 px-3">Wind (m/s)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {rec.district_display_name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{rec.input_date}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-teal-600 dark:text-teal-400">
                      {rec.prediction_date}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {rec.data_status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold">{rec.predictions?.T2M?.value ?? '-'}</td>
                    <td className="py-2.5 px-3 font-semibold">{rec.predictions?.PRECTOTCORR?.value ?? '-'}</td>
                    <td className="py-2.5 px-3">{rec.predictions?.RH2M?.value ?? '-'}</td>
                    <td className="py-2.5 px-3">{rec.predictions?.WS2M?.value ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

