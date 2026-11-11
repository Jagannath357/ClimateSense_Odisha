import React, { useEffect, useRef, useState } from 'react';
import {
  MapPinned,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Database,
  Ban,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  GeospatialDataMode,
  MapVisualizationMode,
  WeatherParameterKey,
} from '../types';
import { useTheme } from '../context/ThemeContext';
import { useGeospatialClimate } from '../hooks/useGeospatialClimate';
import {
  GEOSPATIAL_DATE_PRESETS,
  formatParameterValue,
  getParameterColor,
} from '../data/odishaDistricts';
import { ClimateSummaryCards } from '../components/geospatial/ClimateSummaryCards';
import { ClimateParameterSelector } from '../components/geospatial/ClimateParameterSelector';
import { DistrictSearch } from '../components/geospatial/DistrictSearch';
import { MapViewControls } from '../components/geospatial/MapViewControls';
import { ClimateMapLegend } from '../components/geospatial/ClimateMapLegend';
import { DistrictList } from '../components/geospatial/DistrictList';
import { OdishaClimateMap } from '../components/geospatial/OdishaClimateMap';

interface GeospatialClimateMapProps {
  onNavigateToDistrictDetails: (
    districtId: string,
    referenceDate?: string | null
  ) => void;
}

export const GeospatialClimateMap: React.FC<GeospatialClimateMapProps> = ({
  onNavigateToDistrictDetails,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [selectedDate, setSelectedDate] = useState<string>('2026-01-01');
  const [dataMode, setDataMode] = useState<GeospatialDataMode>('prediction');
  const [selectedParameter, setSelectedParameter] =
    useState<WeatherParameterKey>('T2M');
  const [visualizationMode, setVisualizationMode] =
    useState<MapVisualizationMode>('markers');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(
    null
  );
  const [resetTrigger, setResetTrigger] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const mapWorkspaceRef = useRef<HTMLDivElement>(null);

  const {
    response,
    districtMap,
    stats,
    loading,
    error,
    stateGeoJson,
    districtsGeoJson,
    geoLoading,
    geoError,
    retry,
  } = useGeospatialClimate(selectedDate, dataMode, selectedParameter);

  // Sync fullscreen exit with browser ESC key
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleToggleFullscreen = async () => {
    const nextState = !isFullscreen;
    setIsFullscreen(nextState);
    try {
      if (nextState && mapWorkspaceRef.current?.requestFullscreen) {
        await mapWorkspaceRef.current.requestFullscreen();
      } else if (!nextState && document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Fallback CSS fullscreen overlay still applies cleanly
    }
  };

  const handleResetView = () => {
    setSelectedDistrictId(null);
    setResetTrigger((c) => c + 1);
  };

  const handleViewDetails = (districtId: string) => {
    const refDate =
      response?.input_reference_date ||
      (selectedDate > '2026-01-01' ? selectedDate : '2025-12-31');
    onNavigateToDistrictDetails(districtId, refDate);
  };

  const renderStatusBanner = () => {
    if (!response) return null;

    if (response.prediction_type === 'ml_prediction') {
      return (
        <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/90 dark:bg-emerald-950/30 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-emerald-900 dark:text-emerald-200 flex flex-wrap items-center gap-2">
              <span>Verified ML Forecast Pipeline ({response.prediction_date})</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-200/70 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 text-[10px]">
                Lag Reference: {response.input_reference_date}
              </span>
            </div>
            <p className="text-emerald-800 dark:text-emerald-300/90 leading-relaxed">
              {response.disclaimer}
            </p>
          </div>
        </div>
      );
    }

    if (response.prediction_type === 'climatological_estimate') {
      return (
        <div className="p-4 rounded-2xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/95 dark:bg-amber-950/35 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-amber-900 dark:text-amber-200 flex flex-wrap items-center gap-2">
              <span>Climatological Baseline Fallback ({response.prediction_date})</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-[10px]">
                Data Gap: {response.data_gap_days} days past {response.latest_available_date}
              </span>
            </div>
            <p className="text-amber-800 dark:text-amber-300/90 leading-relaxed">
              {response.disclaimer}
            </p>
          </div>
        </div>
      );
    }

    if (response.prediction_type === 'historical_observation') {
      return (
        <div className="p-4 rounded-2xl border border-sky-200 dark:border-sky-800/80 bg-sky-50/90 dark:bg-sky-950/30 flex items-start gap-3">
          <Database className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-sky-900 dark:text-sky-200">
              Historical NASA POWER Satellite/MERRA-2 Observation ({response.prediction_date})
            </div>
            <p className="text-sky-800 dark:text-sky-300/90 leading-relaxed">
              {response.disclaimer}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-800/80 bg-rose-50/90 dark:bg-rose-950/30 flex items-start gap-3">
        <Ban className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-bold text-rose-900 dark:text-rose-200">
            Data Unavailable for {response.prediction_date}
          </div>
          <p className="text-rose-800 dark:text-rose-300/90 leading-relaxed">
            {response.disclaimer}
          </p>
        </div>
      </div>
    );
  };

  const districts = response?.districts ?? [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/80 text-teal-700 dark:text-teal-300 text-[11px] font-bold">
              <MapPinned className="w-3.5 h-3.5" />
              <span>Spatial Climate Intelligence • Odisha State</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Odisha Geospatial Climate Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
              Explore live leakage-safe ML weather forecasts and historical NASA POWER observations
              across the 15 modeled study districts overlaid on all 30 official Odisha district boundaries.
            </p>
          </div>

          {/* Date Picker Control */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5 shrink-0">
            <div>
              <label
                htmlFor="geospatial-date-input"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1"
              >
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  Target Map Date
                </span>
              </label>
              <input
                id="geospatial-date-input"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Quick Date Presets */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1">
            Quick Scenarios:
          </span>
          {GEOSPATIAL_DATE_PRESETS.map((preset) => {
            const active =
              selectedDate === preset.date && dataMode === preset.mode;
            return (
              <button
                key={`${preset.date}-${preset.mode}`}
                type="button"
                onClick={() => {
                  setSelectedDate(preset.date);
                  setDataMode(preset.mode);
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                  active
                    ? 'bg-teal-600 dark:bg-teal-500 text-white border-teal-600 dark:border-teal-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{preset.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded ${
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {preset.date}
                </span>
              </button>
            );
          })}
        </div>

        {/* Parameter, Visualization Mode & Data Mode Selector */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800">
          <ClimateParameterSelector
            selectedParameter={selectedParameter}
            onSelectParameter={setSelectedParameter}
            visualizationMode={visualizationMode}
            onChangeVisualizationMode={setVisualizationMode}
            dataMode={dataMode}
            onChangeDataMode={setDataMode}
          />
        </div>
      </div>

      {/* API Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs font-medium text-rose-700 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={retry}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shrink-0 transition"
          >
            Retry Fetch
          </button>
        </div>
      )}

      {/* Status Integrity Alert Banner */}
      {renderStatusBanner()}

      {/* 4 Summary Stat Cards Above Map */}
      <ClimateSummaryCards
        parameter={selectedParameter}
        stats={stats}
        response={response}
        loading={loading}
      />

      {/* Interactive Map + Ranked District Sidebar Workspace */}
      <div
        ref={mapWorkspaceRef}
        className={`space-y-4 ${
          isFullscreen
            ? 'fixed inset-0 z-[1500] bg-slate-50 dark:bg-slate-950 p-4 overflow-y-auto'
            : ''
        }`}
      >
        {/* Map Action Toolbar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <DistrictSearch
              districts={districts}
              selectedDistrictId={selectedDistrictId}
              onSelectDistrict={setSelectedDistrictId}
            />
            {loading && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400">
                <span className="w-3.5 h-3.5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                Updating 15 districts...
              </span>
            )}
          </div>

          <MapViewControls
            onResetView={handleResetView}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            onRefresh={retry}
            loading={loading}
          />
        </div>

        {/* Map Canvas + Right District Ranking List */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
          <div className="xl:col-span-9 space-y-3">
            <OdishaClimateMap
              isDark={isDark}
              districts={districts}
              districtMap={districtMap}
              stateGeoJson={stateGeoJson}
              districtsGeoJson={districtsGeoJson}
              geoLoading={geoLoading}
              geoError={geoError}
              activeParameter={selectedParameter}
              visualizationMode={visualizationMode}
              selectedDistrictId={selectedDistrictId}
              onSelectDistrict={setSelectedDistrictId}
              onViewDetails={handleViewDetails}
              predictionDate={response?.prediction_date || selectedDate}
              predictionType={response?.prediction_type || 'ml_prediction'}
              dataMode={dataMode}
              resetTrigger={resetTrigger}
              isFullscreen={isFullscreen}
            />

            {/* Dynamic Legend */}
            <ClimateMapLegend parameter={selectedParameter} />
          </div>

          <div className="xl:col-span-3">
            <DistrictList
              districts={districts}
              activeParameter={selectedParameter}
              selectedDistrictId={selectedDistrictId}
              onSelectDistrict={(id) => setSelectedDistrictId(id)}
            />
          </div>
        </div>
      </div>

      {/* 15-District Multi-Parameter Comparison Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              District-Wise Geospatial Telemetry Table ({response?.prediction_date || selectedDate})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete 4-parameter snapshot across all 15 modeled Odisha districts. Click any row to focus on the map.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <Info className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Precipitation unit: mm/day • MERRA-2 0.5°×0.625° grid</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-3">Region</th>
                <th className="py-3 px-3">Temp (Min–Max)</th>
                <th className="py-3 px-3">Humidity</th>
                <th className="py-3 px-3">Precipitation</th>
                <th className="py-3 px-3">IMD Category</th>
                <th className="py-3 px-3">Wind</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {districts.map((d) => {
                const isSelected = d.district === selectedDistrictId;
                const dotColor = getParameterColor(
                  selectedParameter,
                  d[selectedParameter],
                  isDark
                );
                return (
                  <tr
                    key={d.district}
                    onClick={() => setSelectedDistrictId(d.district)}
                    className={`cursor-pointer transition ${
                      isSelected
                        ? 'bg-teal-50/90 dark:bg-teal-950/50'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: dotColor }}
                        />
                        <span>{d.district_display_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {d.region}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatParameterValue('T2M', d.T2M)}
                      {d.T2M_MIN !== null && d.T2M_MAX !== null && (
                        <span className="block text-[10px] font-normal text-slate-500 dark:text-slate-400">
                          {d.T2M_MIN.toFixed(1)}° – {d.T2M_MAX.toFixed(1)}°
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      {formatParameterValue('RH2M', d.RH2M)}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatParameterValue('PRECTOTCORR', d.PRECTOTCORR)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                        {d.rainfall_category?.category ?? 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      {formatParameterValue('WS2M', d.WS2M)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {d.status === 'available' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          {response?.prediction_type === 'historical_observation'
                            ? 'Observed'
                            : 'ML Model'}
                        </span>
                      ) : d.status === 'climatological_estimate' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                          Climatology
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                          Unavailable
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(d.district);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold transition"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

