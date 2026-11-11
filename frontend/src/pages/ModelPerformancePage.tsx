import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ModelPerformanceData } from '../types';
import {
  Cpu,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  Award,
  Layers,
  BarChart3,
  Target
} from 'lucide-react';

export const ModelPerformancePage: React.FC = () => {
  const [data, setData] = useState<ModelPerformanceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    api.getModelPerformance().then(res => {
      if (isMounted) setData(res);
    }).catch(err => console.error(err))
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading model evaluation reports...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Cpu className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          <span>Model Architecture & Empirical Evaluation</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Rigorous out-of-sample metrics evaluated on the held-out chronological test partition (2022-04-02 to 2025-12-31, 20,550 rows).
        </p>
      </div>

      {/* Model vs Baseline Highlight Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <Award className="w-4 h-4" />
          <span>Scientific Model Comparison</span>
        </div>
        <h2 className="text-xl font-bold">
          Contemporaneous Diagnostic Baseline vs 1-Day Forward Forecasting Model
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <span className="text-xs font-bold text-indigo-300 uppercase">
              Contemporaneous Baseline Regressor
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-black text-white">0.1899 °C</span>
              <span className="text-xs text-indigo-200">MAE (Test)</span>
              <span className="text-2xl font-black text-white ml-2">0.9972</span>
              <span className="text-xs text-indigo-200">R²</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Trained on same-day meteorological fields (T2M_MAX, T2M_MIN, RH2M, PS, Solar). Demonstrates high physical covariation, but cannot forecast forward in time without future sensor readings.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 space-y-2">
            <span className="text-xs font-bold text-teal-300 uppercase">
              1-Day Lag Forecasting Regressor (Operational)
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-black text-white">0.5571 °C</span>
              <span className="text-xs text-teal-200">MAE (Test)</span>
              <span className="text-2xl font-black text-white ml-2">0.9732</span>
              <span className="text-xs text-teal-200">R²</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Trained strictly on historical lags (t-1, t-2, t-3, t-7, t-14), rolling 7-day averages, and cyclic calendar encodings. Operates without future data leakage for real next-day forecasting.
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Target Performance Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Target-by-Target Validation & Held-Out Test Metrics</span>
          </h3>
          <span className="text-xs text-slate-400">All 6 Targets Recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Target</th>
                <th className="py-2.5 px-3">Stage</th>
                <th className="py-2.5 px-3">Unit</th>
                <th className="py-2.5 px-3">Rows</th>
                <th className="py-2.5 px-3">MAE</th>
                <th className="py-2.5 px-3">RMSE</th>
                <th className="py-2.5 px-3">R²</th>
                <th className="py-2.5 px-3">Hurdle Rain Metrics (Accuracy / F1 / ROC-AUC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.multi_target_models.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                    {m.display_name} <span className="text-[10px] text-slate-400 font-mono">({m.target})</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      m.stage === 'test'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                    }`}>
                      {m.stage.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{m.unit}</td>
                  <td className="py-2.5 px-3">{m.rows.toLocaleString()}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-100">
                    {m.MAE}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">
                    {m.RMSE}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-teal-600 dark:text-teal-400">
                    {m.R2 !== null ? m.R2 : 'N/A (Hurdle)'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-xs">
                    {m.rain_occurrence_f1 !== undefined ? (
                      <span className="text-blue-600 dark:text-blue-400">
                        Acc: {((m.rain_occurrence_accuracy || 0) * 100).toFixed(1)}% | F1: {m.rain_occurrence_f1} | AUC: {m.rain_occurrence_roc_auc}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* District-by-District Breakdown */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>District-Level Test Breakdown for Baseline T2M Model (1,370 Test Days per District)</span>
          </h3>
          <span className="text-xs text-slate-400">Chronological Held-Out Partition</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">District</th>
                <th className="py-2.5 px-3">Test Rows</th>
                <th className="py-2.5 px-3">MAE (°C)</th>
                <th className="py-2.5 px-3">RMSE (°C)</th>
                <th className="py-2.5 px-3">Mean Bias Error (°C)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.district_test_breakdown.map((d, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-semibold uppercase text-slate-800 dark:text-slate-200">{d.district}</td>
                  <td className="py-2.5 px-3">{d.rows}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{d.MAE.toFixed(4)}</td>
                  <td className="py-2.5 px-3 font-mono">{d.RMSE.toFixed(4)}</td>
                  <td className={`py-2.5 px-3 font-mono ${d.bias >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                    {d.bias >= 0 ? `+${d.bias.toFixed(4)}` : d.bias.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plain Language Metric Guide & Caveats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Metric Explanations in Plain Language</span>
          </h3>
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            {Object.entries(data.metrics_explanation).map(([k, v]) => (
              <p key={k}>
                <strong className="text-slate-800 dark:text-slate-200">{k}:</strong> {v}
              </p>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Documented Limitations</span>
          </h3>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            {data.limitations.map((lim, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>{lim}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

