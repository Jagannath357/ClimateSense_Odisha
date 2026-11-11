import React from 'react';
import {
  Thermometer,
  Droplets,
  CloudRain,
  Wind,
  MapPin,
  Layers,
  Cpu,
  Database,
} from 'lucide-react';
import {
  GeospatialDataMode,
  MapVisualizationMode,
  WeatherParameterKey,
} from '../../types';

interface ClimateParameterSelectorProps {
  selectedParameter: WeatherParameterKey;
  onSelectParameter: (param: WeatherParameterKey) => void;
  visualizationMode: MapVisualizationMode;
  onChangeVisualizationMode: (mode: MapVisualizationMode) => void;
  dataMode: GeospatialDataMode;
  onChangeDataMode: (mode: GeospatialDataMode) => void;
}

const PARAMETERS: Array<{
  key: WeatherParameterKey;
  label: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
}> = [
  {
    key: 'T2M',
    label: 'Temperature',
    unit: '°C',
    icon: Thermometer,
    activeClass:
      'bg-orange-600 dark:bg-orange-500 text-white shadow-sm shadow-orange-500/25',
  },
  {
    key: 'RH2M',
    label: 'Humidity',
    unit: '%',
    icon: Droplets,
    activeClass:
      'bg-cyan-600 dark:bg-cyan-500 text-white shadow-sm shadow-cyan-500/25',
  },
  {
    key: 'PRECTOTCORR',
    label: 'Precipitation',
    unit: 'mm',
    icon: CloudRain,
    activeClass:
      'bg-blue-600 dark:bg-blue-500 text-white shadow-sm shadow-blue-500/25',
  },
  {
    key: 'WS2M',
    label: 'Wind Speed',
    unit: 'm/s',
    icon: Wind,
    activeClass:
      'bg-teal-600 dark:bg-teal-500 text-white shadow-sm shadow-teal-500/25',
  },
];

export const ClimateParameterSelector: React.FC<ClimateParameterSelectorProps> = ({
  selectedParameter,
  onSelectParameter,
  visualizationMode,
  onChangeVisualizationMode,
  dataMode,
  onChangeDataMode,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      {/* Weather Parameter Segmented Buttons */}
      <div
        role="group"
        aria-label="Weather Parameter Selector"
        className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700"
      >
        {PARAMETERS.map((item) => {
          const Icon = item.icon;
          const isActive = selectedParameter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectParameter(item.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? item.activeClass
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700/70'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{item.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {item.unit}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right Controls: Visualization Mode & Data Mode */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Marker View vs District Heatmap */}
        <div
          role="group"
          aria-label="Map Visualization Mode"
          className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700"
        >
          <button
            type="button"
            onClick={() => onChangeVisualizationMode('markers')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
              visualizationMode === 'markers'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Marker View</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeVisualizationMode('heatmap')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
              visualizationMode === 'heatmap'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>District Heatmap</span>
          </button>
        </div>

        {/* ML Prediction vs Historical Observation Mode */}
        <div
          role="group"
          aria-label="Climate Data Source Mode"
          className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700"
        >
          <button
            type="button"
            onClick={() => onChangeDataMode('prediction')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
              dataMode === 'prediction'
                ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>ML Forecast</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeDataMode('observation')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
              dataMode === 'observation'
                ? 'bg-sky-600 dark:bg-sky-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Historical Obs.</span>
          </button>
        </div>
      </div>
    </div>
  );
};

