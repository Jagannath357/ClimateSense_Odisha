import React from 'react';
import {
  Thermometer,
  Droplets,
  CloudRain,
  Wind,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Database,
  Ban,
} from 'lucide-react';
import { GeospatialPredictionResponse, WeatherParameterKey } from '../../types';
import { ParameterSummaryStats } from '../../hooks/useGeospatialClimate';
import { formatParameterValue, WEATHER_PARAMETER_META } from '../../data/odishaDistricts';

interface ClimateSummaryCardsProps {
  parameter: WeatherParameterKey;
  stats: ParameterSummaryStats;
  response: GeospatialPredictionResponse | null;
  loading: boolean;
}

export const ClimateSummaryCards: React.FC<ClimateSummaryCardsProps> = ({
  parameter,
  stats,
  response,
  loading,
}) => {
  const meta = WEATHER_PARAMETER_META[parameter];

  const avgTitleMap: Record<WeatherParameterKey, string> = {
    T2M: 'District-Avg Temperature',
    RH2M: 'District-Avg Humidity',
    PRECTOTCORR: 'District-Avg Precipitation',
    WS2M: 'District-Avg Wind Speed',
  };

  const maxTitleMap: Record<WeatherParameterKey, string> = {
    T2M: 'Warmest District',
    RH2M: 'Most Humid District',
    PRECTOTCORR: 'Wettest District',
    WS2M: 'Windiest District',
  };

  const minTitleMap: Record<WeatherParameterKey, string> = {
    T2M: 'Coolest District',
    RH2M: 'Driest Air District',
    PRECTOTCORR: 'Lowest Precipitation',
    WS2M: 'Calmest District',
  };

  const renderParamIcon = () => {
    const cls = 'w-5 h-5';
    switch (parameter) {
      case 'T2M':
        return <Thermometer className={`${cls} text-orange-600 dark:text-orange-400`} />;
      case 'RH2M':
        return <Droplets className={`${cls} text-cyan-600 dark:text-cyan-400`} />;
      case 'PRECTOTCORR':
        return <CloudRain className={`${cls} text-blue-600 dark:text-blue-400`} />;
      case 'WS2M':
        return <Wind className={`${cls} text-teal-600 dark:text-teal-400`} />;
    }
  };

  const getStatusDisplay = () => {
    if (!response) {
      return {
        label: 'Awaiting Data',
        badge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
        icon: <Database className="w-4 h-4 text-slate-500" />,
      };
    }
    switch (response.prediction_type) {
      case 'ml_prediction':
        return {
          label: 'ML Prediction',
          badge: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
        };
      case 'climatological_estimate':
        return {
          label: 'Climatological Est.',
          badge: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70',
          icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
        };
      case 'historical_observation':
        return {
          label: 'Historical Obs.',
          badge: 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/70',
          icon: <Database className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
        };
      default:
        return {
          label: 'Unavailable Data',
          badge: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/70',
          icon: <Ban className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
        };
    }
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Card 1: District Average */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {avgTitleMap[parameter]}
          </span>
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">{renderParamIcon()}</div>
        </div>
        <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {loading && !response ? (
            <span className="inline-block h-7 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ) : (
            formatParameterValue(parameter, stats.avgValue)
          )}
        </div>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {parameter === 'PRECTOTCORR'
            ? `Mean across ${stats.validCount} study districts (${stats.rainyDistrictsCount} with rain > 0)`
            : `Mean across ${stats.validCount} of ${stats.totalCount} study districts (${meta.unit})`}
        </p>
      </div>

      {/* Card 2: Highest District */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {maxTitleMap[parameter]}
          </span>
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50">
            <ArrowUpRight className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {loading && !response ? (
            <span className="inline-block h-7 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ) : stats.maxRecord ? (
            formatParameterValue(parameter, stats.maxRecord.value)
          ) : (
            'N/A'
          )}
        </div>
        <p className="mt-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
          {stats.maxRecord ? stats.maxRecord.district : 'No valid district values'}
        </p>
      </div>

      {/* Card 3: Lowest District */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {minTitleMap[parameter]}
          </span>
          <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50">
            <ArrowDownRight className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {loading && !response ? (
            <span className="inline-block h-7 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ) : stats.minRecord ? (
            formatParameterValue(parameter, stats.minRecord.value)
          ) : (
            'N/A'
          )}
        </div>
        <p className="mt-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
          {stats.minRecord ? stats.minRecord.district : 'No valid district values'}
        </p>
      </div>

      {/* Card 4: Coverage & Pipeline Status */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            District Coverage
          </span>
          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50">
            <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {stats.validCount} / {stats.totalCount}
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Study Districts
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusInfo.badge}`}
          >
            {statusInfo.icon}
            {statusInfo.label}
          </span>
        </div>
      </div>
    </div>
  );
};

