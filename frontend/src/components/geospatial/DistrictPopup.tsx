import React from 'react';
import {
  Thermometer,
  Droplets,
  CloudRain,
  Wind,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Database,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import {
  GeospatialDistrictPrediction,
  WeatherParameterKey,
} from '../../types';
import { formatParameterValue } from '../../data/odishaDistricts';

interface DistrictPopupProps {
  district: GeospatialDistrictPrediction;
  predictionDate: string;
  predictionType: string;
  activeParameter: WeatherParameterKey;
  onViewDetails: (districtId: string) => void;
}

export const DistrictPopup: React.FC<DistrictPopupProps> = ({
  district,
  predictionDate,
  predictionType,
  activeParameter,
  onViewDetails,
}) => {
  const getStatusBadge = () => {
    if (district.status === 'unavailable') {
      return {
        label: 'Unavailable Data',
        cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300',
        icon: <Ban className="w-3 h-3" />,
      };
    }
    if (
      district.status === 'climatological_estimate' ||
      predictionType === 'climatological_estimate'
    ) {
      return {
        label: 'Climatological Estimate',
        cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300',
        icon: <AlertTriangle className="w-3 h-3" />,
      };
    }
    if (predictionType === 'historical_observation') {
      return {
        label: 'Historical Observation',
        cls: 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300',
        icon: <Database className="w-3 h-3" />,
      };
    }
    return {
      label: 'ML Prediction',
      cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300',
      icon: <ShieldCheck className="w-3 h-3" />,
    };
  };

  const badge = getStatusBadge();

  return (
    <div className="w-[272px] sm:w-[292px] text-slate-800 dark:text-slate-100 font-sans">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
        <div>
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
            {district.district_display_name}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {district.region} Odisha • {district.elevation_m.toFixed(0)}m elev.
          </p>
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
            {district.latitude.toFixed(3)}°N, {district.longitude.toFixed(3)}°E
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${badge.cls}`}
        >
          {badge.icon}
          {badge.label}
        </span>
      </div>

      {/* Weather Values Grid */}
      {district.status === 'unavailable' ? (
        <div className="my-2.5 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 text-[11px] text-rose-700 dark:text-rose-300">
          Insufficient prior 14-day lag window to generate forecast for{' '}
          <span className="font-bold">{predictionDate}</span>. Values preserved as
          unavailable (never substituted with 0).
        </div>
      ) : (
        <div className="my-2.5 grid grid-cols-2 gap-1.5">
          {/* Temperature */}
          <div
            className={`p-2 rounded-lg border ${
              activeParameter === 'T2M'
                ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-700'
                : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <Thermometer className="w-3 h-3 text-orange-500" />
              <span>Temp (T2M)</span>
            </div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
              {formatParameterValue('T2M', district.T2M)}
            </div>
            {district.T2M_MIN !== null && district.T2M_MAX !== null && (
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                {district.T2M_MIN.toFixed(1)}° – {district.T2M_MAX.toFixed(1)}°
              </div>
            )}
          </div>

          {/* Humidity */}
          <div
            className={`p-2 rounded-lg border ${
              activeParameter === 'RH2M'
                ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-700'
                : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <Droplets className="w-3 h-3 text-cyan-500" />
              <span>Humidity</span>
            </div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
              {formatParameterValue('RH2M', district.RH2M)}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">2m Relative</div>
          </div>

          {/* Precipitation */}
          <div
            className={`p-2 rounded-lg border ${
              activeParameter === 'PRECTOTCORR'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700'
                : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <CloudRain className="w-3 h-3 text-blue-500" />
              <span>Precipitation</span>
            </div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
              {formatParameterValue('PRECTOTCORR', district.PRECTOTCORR)}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {district.rainfall_category?.category ?? 'N/A'}
              {district.rainfall_probability !== null &&
              district.rainfall_probability !== undefined
                ? ` • ${(district.rainfall_probability * 100).toFixed(0)}%`
                : ''}
            </div>
          </div>

          {/* Wind Speed */}
          <div
            className={`p-2 rounded-lg border ${
              activeParameter === 'WS2M'
                ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-700'
                : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <Wind className="w-3 h-3 text-teal-500" />
              <span>Wind Speed</span>
            </div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
              {formatParameterValue('WS2M', district.WS2M)}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Surface (2m)</div>
          </div>
        </div>
      )}

      {/* Post-Hoc Ground Truth Strip when available */}
      {district.ground_truth && (
        <div className="mb-2 px-2 py-1.5 rounded-lg bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 text-[10px]">
          <div className="flex items-center gap-1 font-bold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            <span>Actual NASA POWER Observation ({predictionDate})</span>
          </div>
          <div className="mt-0.5 text-emerald-700 dark:text-emerald-200/90 flex flex-wrap gap-x-2">
            <span>T2M: {district.ground_truth.T2M?.toFixed(1)}°C</span>
            <span>RH: {district.ground_truth.RH2M?.toFixed(1)}%</span>
            <span>Rain: {district.ground_truth.PRECTOTCORR?.toFixed(2)}mm</span>
          </div>
        </div>
      )}

      {/* Provenance Footer */}
      <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5 mb-2.5">
        <div>
          <span className="font-semibold">Source:</span> {district.model_source}
        </div>
        <div>
          <span className="font-semibold">Date:</span> {predictionDate} •{' '}
          <span className="font-semibold">Last Obs:</span> {district.last_observed_date}
        </div>
        {district.grid_note && (
          <div className="text-[10px] italic text-amber-700 dark:text-amber-300">
            Note: {district.grid_note}
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={() => onViewDetails(district.district)}
        className="w-full py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
      >
        <span>View District Details</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

