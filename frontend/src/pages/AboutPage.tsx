import React from 'react';
import {
  Info,
  Database,
  Cpu,
  Layers,
  ShieldCheck,
  Code2,
  ExternalLink,
  BookOpen,
  MapPin,
  CheckCircle2
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Info className="w-7 h-7 text-teal-600 dark:text-teal-400" />
          <span>About ClimateSense Odisha</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Academic machine learning project documentation, dataset provenance, and architectural methodology.
        </p>
      </div>

      {/* Project Overview */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <span>Problem Statement & Objectives</span>
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          The State of Odisha in eastern India is geographically vulnerable to extreme meteorological fluctuations, coastal depressions, tropical cyclones, and monsoon volatility. The objective of <strong>ClimateSense Odisha</strong> is to develop a scientifically rigorous, leakage-safe machine learning system capable of continuous climate monitoring, long-term empirical trend detection, and user-selected next-day weather forecasting for 15 representative districts.
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Unlike black-box demonstrations with synthetic inputs, ClimateSense Odisha directly interfaces with a genuine 25-year historical NASA POWER dataset and trained gradient boosted decision trees.
        </p>
      </div>

      {/* Data Source & Grid Resolution Finding */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <span>NASA POWER Data & Spatial Grid Provenance</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 block text-sm">Dataset Metadata</span>
            <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
              <li>• <strong>Source:</strong> NASA POWER Agroclimatology Daily Local Exports</li>
              <li>• <strong>Temporal Span:</strong> January 1, 2001 – December 31, 2025 (9,131 days/district)</li>
              <li>• <strong>Total Observations:</strong> 136,965 complete daily records across 15 districts</li>
              <li>• <strong>Time Basis:</strong> LST (Local Solar Time)</li>
              <li>• <strong>Sentinel Policy:</strong> -999 converted to NaN; missing observations preserved</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 block text-sm">Monitored Districts</span>
            <p className="text-slate-600 dark:text-slate-300">
              Angul, Bargarh, Bhadrak, Cuttack, Gajapati, Ganjam, Kalahandi, Kendrapada, Keonjhar, Khurda, Koraput, Malkangiri, Puri, Sambalpur, and Sundargarh.
            </p>
          </div>
        </div>

        {/* Bargarh/Sambalpur MERRA-2 Finding Callout */}
        <div className="p-5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 text-xs text-teal-950 dark:text-teal-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-teal-900 dark:text-teal-100">
            <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Important Data Quality Discovery: MERRA-2 Grid Sharing</span>
          </div>
          <p className="leading-relaxed">
            During deep codebase inspection, <strong>Bargarh</strong> (lat 21.33°, lon 83.62°) and <strong>Sambalpur</strong> (lat 21.4669°, lon 83.9812°) were found to have <strong>100.00% identical meteorological records</strong> across all 9 climate variables. Physical header analysis reveals that both query coordinates fall within the exact same <strong>0.5° × 0.625° NASA MERRA-2 assimilation grid cell</strong> (elevation 222.75m). Similarly, <strong>Khurda</strong> and <strong>Puri</strong> share the identical MERRA-2 grid cell (elevation 37.91m), differing only in the CERES solar irradiance grid. These empirical nuances are transparently documented and preserved without artificial alterations.
          </p>
        </div>
      </div>

      {/* ML Architecture & Hurdle Methodology */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>Machine Learning Methodology & Leakage Prevention</span>
        </h2>
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            • <strong>Chronological Partitioning:</strong> Strictly respects temporal order (70% Train: 2001–2018; 15% Validation: 2018–2022; 15% Test: 2022–2025). Shuffling was prohibited to prevent temporal data leakage.
          </p>
          <p>
            • <strong>Feature Construction:</strong> Models utilize 1-day, 2-day, 3-day, 7-day, and 14-day lags of target variables alongside a 7-day rolling mean shifted by 1 day (so target-day observations never leak into features). Trigonometric sine/cosine transforms encode month and day-of-year seasonality.
          </p>
          <p>
            • <strong>Two-Stage Hurdle Precipitation Model:</strong> Due to 39.4% zero-inflation in daily rainfall, a dual-stage architecture was developed: a <code>HistGradientBoostingClassifier</code> predicts rain occurrence (F1 0.941, ROC-AUC 0.967), and a <code>HistGradientBoostingRegressor</code> predicts the log-transformed positive accumulation.
          </p>
        </div>
      </div>

      {/* Full Technology Stack */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Code2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <span>Technology Stack</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">Backend</span>
            <span className="text-slate-500">FastAPI, Python 3.14, Uvicorn, Pydantic v2</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">ML & Statistics</span>
            <span className="text-slate-500">Scikit-Learn, Pandas, NumPy, SciPy, Joblib</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">Frontend</span>
            <span className="text-slate-500">React 18, Vite, TypeScript</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">Visualization</span>
            <span className="text-slate-500">Tailwind CSS, Lucide Icons, Recharts</span>
          </div>
        </div>
      </div>
    </div>
  );
};

