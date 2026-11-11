import { WeatherParameterKey } from '../types';

export const ODISHA_MAP_CENTER: [number, number] = [20.25, 84.42];
export const ODISHA_DEFAULT_ZOOM = 7;
export const ODISHA_MAX_BOUNDS: [[number, number], [number, number]] = [
  [16.8, 80.2],
  [23.4, 88.6],
];

export interface LegendStop {
  label: string;
  range: string;
  color: string;
}

export interface WeatherParameterMeta {
  key: WeatherParameterKey;
  label: string;
  shortLabel: string;
  unit: string;
  precision: number;
  description: string;
  legendTitle: string;
  stops: LegendStop[];
}

export const WEATHER_PARAMETER_META: Record<WeatherParameterKey, WeatherParameterMeta> = {
  T2M: {
    key: 'T2M',
    label: 'Temperature (T2M)',
    shortLabel: 'Temperature',
    unit: '°C',
    precision: 1,
    description: 'Daily 2-meter air temperature across study districts',
    legendTitle: '2m Air Temperature (°C)',
    stops: [
      { label: 'Cool', range: '< 20 °C', color: '#0284c7' },
      { label: 'Mild', range: '20 – 25 °C', color: '#0d9488' },
      { label: 'Warm', range: '25 – 30 °C', color: '#d97706' },
      { label: 'Hot', range: '30 – 35 °C', color: '#ea580c' },
      { label: 'Extreme', range: '≥ 35 °C', color: '#dc2626' },
    ],
  },
  RH2M: {
    key: 'RH2M',
    label: 'Relative Humidity (RH2M)',
    shortLabel: 'Humidity',
    unit: '%',
    precision: 1,
    description: '2-meter atmospheric relative humidity percentage',
    legendTitle: 'Relative Humidity (%)',
    stops: [
      { label: 'Dry', range: '< 40%', color: '#d97706' },
      { label: 'Comfortable', range: '40 – 60%', color: '#10b981' },
      { label: 'Moderate', range: '60 – 75%', color: '#06b6d4' },
      { label: 'Humid', range: '75 – 88%', color: '#2563eb' },
      { label: 'Very Humid', range: '≥ 88%', color: '#4f46e5' },
    ],
  },
  PRECTOTCORR: {
    key: 'PRECTOTCORR',
    label: 'Precipitation (PRECTOTCORR)',
    shortLabel: 'Precipitation',
    unit: 'mm/day',
    precision: 2,
    description: 'Bias-corrected daily precipitation aligned with IMD categories',
    legendTitle: 'Daily Precipitation (mm/day)',
    stops: [
      { label: 'No Rainfall', range: '0 mm', color: '#10b981' },
      { label: 'Very Light', range: '> 0 – 2.5 mm', color: '#38bdf8' },
      { label: 'Light Rain', range: '> 2.5 – 10 mm', color: '#0ea5e9' },
      { label: 'Moderate Rain', range: '> 10 – 25 mm', color: '#2563eb' },
      { label: 'Heavy Rain', range: '> 25 – 50 mm', color: '#f59e0b' },
      { label: 'Very Heavy', range: '> 50 mm', color: '#e11d48' },
    ],
  },
  WS2M: {
    key: 'WS2M',
    label: 'Wind Speed (WS2M)',
    shortLabel: 'Wind Speed',
    unit: 'm/s',
    precision: 2,
    description: '2-meter surface wind speed magnitude',
    legendTitle: '2m Wind Speed (m/s)',
    stops: [
      { label: 'Calm', range: '< 1.5 m/s', color: '#38bdf8' },
      { label: 'Light Breeze', range: '1.5 – 2.5 m/s', color: '#14b8a6' },
      { label: 'Moderate', range: '2.5 – 4.0 m/s', color: '#22c55e' },
      { label: 'Fresh', range: '4.0 – 6.0 m/s', color: '#f59e0b' },
      { label: 'Strong', range: '≥ 6.0 m/s', color: '#ef4444' },
    ],
  },
};

export const STUDY_DISTRICT_IDS = [
  'angul',
  'bargarh',
  'bhadrak',
  'cuttack',
  'gajapati',
  'ganjam',
  'kalahandi',
  'kendrapada',
  'keojhar',
  'khurda',
  'koraput',
  'malkangiri',
  'puri',
  'sambalpur',
  'sundargarh',
] as const;

const GEOJSON_NAME_TO_DISTRICT_ID: Record<string, string> = {
  angul: 'angul',
  anugul: 'angul',
  bargarh: 'bargarh',
  bhadrak: 'bhadrak',
  cuttack: 'cuttack',
  gajapati: 'gajapati',
  ganjam: 'ganjam',
  kalahandi: 'kalahandi',
  kendrapara: 'kendrapada',
  kendrapada: 'kendrapada',
  kendujhar: 'keojhar',
  keonjhar: 'keojhar',
  keojhar: 'keojhar',
  khordha: 'khurda',
  khurda: 'khurda',
  koraput: 'koraput',
  malkangiri: 'malkangiri',
  puri: 'puri',
  sambalpur: 'sambalpur',
  sundargarh: 'sundargarh',
  sundergarh: 'sundargarh',
};

/**
 * Normalizes a district name from GeoJSON (`district` / `dtname` / `DISTRICT`)
 * into the canonical backend district ID when it is one of the 15 study districts.
 * Returns null for the 15 non-study districts of Odisha.
 */
export function normalizeGeoJsonDistrictId(rawName?: string | null): string | null {
  if (!rawName) return null;
  const key = rawName.trim().toLowerCase().replace(/\s+/g, '');
  return GEOJSON_NAME_TO_DISTRICT_ID[key] ?? null;
}

export function extractGeoJsonDistrictName(properties: Record<string, any> | undefined): string {
  if (!properties) return 'Unknown District';
  return (
    properties.district ||
    properties.DISTRICT ||
    properties.dtname ||
    properties.NAME_2 ||
    properties.name ||
    'Unknown District'
  );
}

export function getParameterColor(
  param: WeatherParameterKey,
  value: number | null | undefined,
  isDark = false
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return isDark ? '#475569' : '#94a3b8';
  }

  switch (param) {
    case 'T2M':
      if (value < 20) return '#0284c7';
      if (value < 25) return '#0d9488';
      if (value < 30) return '#d97706';
      if (value < 35) return '#ea580c';
      return '#dc2626';

    case 'RH2M':
      if (value < 40) return '#d97706';
      if (value < 60) return '#10b981';
      if (value < 75) return '#06b6d4';
      if (value < 88) return '#2563eb';
      return '#4f46e5';

    case 'PRECTOTCORR':
      if (value <= 0) return '#10b981';
      if (value <= 2.5) return '#38bdf8';
      if (value <= 10.0) return '#0ea5e9';
      if (value <= 25.0) return '#2563eb';
      if (value <= 50.0) return '#f59e0b';
      return '#e11d48';

    case 'WS2M':
      if (value < 1.5) return '#38bdf8';
      if (value < 2.5) return '#14b8a6';
      if (value < 4.0) return '#22c55e';
      if (value < 6.0) return '#f59e0b';
      return '#ef4444';
  }
}

export function formatParameterValue(
  param: WeatherParameterKey,
  value: number | null | undefined,
  includeUnit = true
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'N/A';
  }
  const meta = WEATHER_PARAMETER_META[param];
  const formatted = value.toFixed(meta.precision);
  return includeUnit ? `${formatted} ${meta.unit}` : formatted;
}

export interface PresetDateOption {
  label: string;
  date: string;
  mode: 'prediction' | 'observation';
  tag: string;
}

export const GEOSPATIAL_DATE_PRESETS: PresetDateOption[] = [
  {
    label: 'Latest ML Forecast',
    date: '2026-01-01',
    mode: 'prediction',
    tag: 'ML Pipeline',
  },
  {
    label: 'Verified Historical ML',
    date: '2025-12-31',
    mode: 'prediction',
    tag: 'With Ground Truth',
  },
  {
    label: 'Monsoon ML Benchmark',
    date: '2025-08-15',
    mode: 'prediction',
    tag: 'Monsoon + Truth',
  },
  {
    label: 'Future Stale-Source Date',
    date: '2026-11-12',
    mode: 'prediction',
    tag: 'Climatology Only',
  },
  {
    label: 'Latest Observed NASA Record',
    date: '2025-12-31',
    mode: 'observation',
    tag: 'Observed',
  },
];

