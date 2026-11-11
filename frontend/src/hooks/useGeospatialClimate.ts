import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { api } from '../services/api';
import {
  GeospatialDataMode,
  GeospatialDistrictPrediction,
  GeospatialPredictionResponse,
  WeatherParameterKey,
} from '../types';

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: Record<string, any>;
    geometry: any;
  }>;
}

export interface ParameterSummaryStats {
  validCount: number;
  totalCount: number;
  avgValue: number | null;
  minRecord: { district: string; value: number } | null;
  maxRecord: { district: string; value: number } | null;
  rainyDistrictsCount: number;
}

const predictionCache = new Map<string, GeospatialPredictionResponse>();
let cachedStateGeoJson: GeoJsonFeatureCollection | null = null;
let cachedDistrictsGeoJson: GeoJsonFeatureCollection | null = null;

export function useGeospatialClimate(
  selectedDate: string,
  dataMode: GeospatialDataMode,
  selectedParameter: WeatherParameterKey
) {
  const [response, setResponse] = useState<GeospatialPredictionResponse | null>(() => {
    const key = `${dataMode}:${selectedDate}`;
    return predictionCache.get(key) ?? null;
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [stateGeoJson, setStateGeoJson] = useState<GeoJsonFeatureCollection | null>(
    cachedStateGeoJson
  );
  const [districtsGeoJson, setDistrictsGeoJson] =
    useState<GeoJsonFeatureCollection | null>(cachedDistrictsGeoJson);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState<boolean>(
    !cachedStateGeoJson || !cachedDistrictsGeoJson
  );

  const activeRequestRef = useRef<number>(0);

  // Load Odisha state & 30-district boundary GeoJSON once
  useEffect(() => {
    if (cachedStateGeoJson && cachedDistrictsGeoJson) {
      setGeoLoading(false);
      return;
    }

    let cancelled = false;
    const loadGeoLayers = async () => {
      try {
        setGeoLoading(true);
        setGeoError(null);
        const [stateRes, distRes] = await Promise.all([
          fetch('/geo/odisha_state.geojson'),
          fetch('/geo/odisha_districts.geojson'),
        ]);
        if (!stateRes.ok || !distRes.ok) {
          throw new Error('Failed to load Odisha GeoJSON boundary layers.');
        }
        const [stateData, distData] = await Promise.all([
          stateRes.json(),
          distRes.json(),
        ]);
        cachedStateGeoJson = stateData;
        cachedDistrictsGeoJson = distData;
        if (!cancelled) {
          setStateGeoJson(stateData);
          setDistrictsGeoJson(distData);
        }
      } catch (err: any) {
        if (!cancelled) {
          setGeoError(err?.message || 'Unable to load Odisha boundary data.');
        }
      } finally {
        if (!cancelled) {
          setGeoLoading(false);
        }
      }
    };

    loadGeoLayers();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchGeospatialData = useCallback(
    async (forceRefresh = false) => {
      const cacheKey = `${dataMode}:${selectedDate}`;
      if (!forceRefresh && predictionCache.has(cacheKey)) {
        setResponse(predictionCache.get(cacheKey)!);
        setError(null);
        setLoading(false);
        return;
      }

      const reqId = ++activeRequestRef.current;
      try {
        setLoading(true);
        setError(null);
        const data = await api.getGeospatialPredictions(selectedDate, dataMode);
        predictionCache.set(cacheKey, data);
        if (activeRequestRef.current === reqId) {
          setResponse(data);
        }
      } catch (err: any) {
        if (activeRequestRef.current === reqId) {
          setError(err?.message || 'Failed to fetch geospatial district predictions.');
        }
      } finally {
        if (activeRequestRef.current === reqId) {
          setLoading(false);
        }
      }
    },
    [selectedDate, dataMode]
  );

  useEffect(() => {
    fetchGeospatialData(false);
  }, [fetchGeospatialData]);

  const districtMap = useMemo(() => {
    const map = new Map<string, GeospatialDistrictPrediction>();
    if (response?.districts) {
      for (const item of response.districts) {
        map.set(item.district, item);
      }
    }
    return map;
  }, [response]);

  const stats: ParameterSummaryStats = useMemo(() => {
    const districts = response?.districts ?? [];
    const totalCount = districts.length || 15;
    let sum = 0;
    let validCount = 0;
    let minRecord: { district: string; value: number } | null = null;
    let maxRecord: { district: string; value: number } | null = null;
    let rainyDistrictsCount = 0;

    for (const d of districts) {
      if (d.PRECTOTCORR !== null && d.PRECTOTCORR !== undefined && d.PRECTOTCORR > 0) {
        rainyDistrictsCount += 1;
      }
      const val = d[selectedParameter];
      if (val === null || val === undefined || Number.isNaN(val)) {
        continue;
      }
      sum += val;
      validCount += 1;

      if (!minRecord || val < minRecord.value) {
        minRecord = { district: d.district_display_name, value: val };
      }
      if (!maxRecord || val > maxRecord.value) {
        maxRecord = { district: d.district_display_name, value: val };
      }
    }

    return {
      validCount,
      totalCount,
      avgValue: validCount > 0 ? sum / validCount : null,
      minRecord,
      maxRecord,
      rainyDistrictsCount,
    };
  }, [response, selectedParameter]);

  return {
    response,
    districtMap,
    stats,
    loading,
    error,
    stateGeoJson,
    districtsGeoJson,
    geoLoading,
    geoError,
    retry: () => fetchGeospatialData(true),
  };
}

