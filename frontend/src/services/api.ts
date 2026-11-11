import {
  District,
  DatasetInfo,
  PredictionResponse,
  PredictionHistoryRecord,
  HistoricalClimateResponse,
  TrendRecord,
  AnomalyResponse,
  ModelPerformanceData,
  DashboardSummary,
  GeospatialPredictionResponse,
  GeospatialDataMode,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson && errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch {
      // Keep default text
    }
    throw new Error(errorDetail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE_URL}/health`);
    return handleResponse<any>(res);
  },

  async getDistricts(): Promise<{ total: number; districts: District[] }> {
    const res = await fetch(`${API_BASE_URL}/districts`);
    return handleResponse<{ total: number; districts: District[] }>(res);
  },

  async getDatasetInfo(): Promise<DatasetInfo> {
    const res = await fetch(`${API_BASE_URL}/dataset/info`);
    return handleResponse<DatasetInfo>(res);
  },

  async getDatasetDateRange(): Promise<{
    start_date: string;
    end_date: string;
    latest_available_date: string;
    total_days_per_district: number;
    years_covered: number;
  }> {
    const res = await fetch(`${API_BASE_URL}/dataset/date-range`);
    return handleResponse<any>(res);
  },

  async predictNextDay(district: string, selected_date: string): Promise<PredictionResponse> {
    const res = await fetch(`${API_BASE_URL}/predictions/next-day`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ district, selected_date }),
    });
    return handleResponse<PredictionResponse>(res);
  },

  async getPredictionHistory(limit: number = 20): Promise<{ total: number; limit: number; history: PredictionHistoryRecord[] }> {
    const res = await fetch(`${API_BASE_URL}/predictions/history?limit=${limit}`);
    return handleResponse<any>(res);
  },

  async getHistoricalClimate(
    district: string,
    start_date?: string,
    end_date?: string,
    page: number = 1,
    page_size: number = 50
  ): Promise<HistoricalClimateResponse> {
    const params = new URLSearchParams({ district, page: String(page), page_size: String(page_size) });
    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);
    const res = await fetch(`${API_BASE_URL}/climate/historical?${params.toString()}`);
    return handleResponse<HistoricalClimateResponse>(res);
  },

  async getAggregatedClimate(
    district: string,
    aggregation_type: 'monthly' | 'annual' = 'monthly'
  ) {
    const res = await fetch(`${API_BASE_URL}/climate/aggregated?district=${district}&aggregation_type=${aggregation_type}`);
    return handleResponse<{ district: string; aggregation_type: string; total_periods: number; data: any[] }>(res);
  },

  async getClimateSummary(district: string, start_date?: string, end_date?: string) {
    const params = new URLSearchParams({ district });
    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);
    const res = await fetch(`${API_BASE_URL}/climate/summary?${params.toString()}`);
    return handleResponse<any>(res);
  },

  async getClimateTrends(district?: string, variable?: string): Promise<{ total_trends: number; baseline_period: number[]; trends: TrendRecord[] }> {
    const params = new URLSearchParams();
    if (district) params.append('district', district);
    if (variable) params.append('variable', variable);
    const res = await fetch(`${API_BASE_URL}/climate/trends?${params.toString()}`);
    return handleResponse<any>(res);
  },

  async getClimateAnomalies(district?: string): Promise<AnomalyResponse> {
    const params = new URLSearchParams();
    if (district) params.append('district', district);
    const res = await fetch(`${API_BASE_URL}/climate/anomalies?${params.toString()}`);
    return handleResponse<AnomalyResponse>(res);
  },

  async getModels() {
    const res = await fetch(`${API_BASE_URL}/models`);
    return handleResponse<any>(res);
  },

  async getModelPerformance(): Promise<ModelPerformanceData> {
    const res = await fetch(`${API_BASE_URL}/models/performance`);
    return handleResponse<ModelPerformanceData>(res);
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    const res = await fetch(`${API_BASE_URL}/dashboard/summary`);
    return handleResponse<DashboardSummary>(res);
  },

  async getGeospatialPredictions(
    predictionDate?: string,
    mode: GeospatialDataMode = 'prediction'
  ): Promise<GeospatialPredictionResponse> {
    const search = new URLSearchParams();
    if (predictionDate) {
      search.set('prediction_date', predictionDate);
    }
    search.set('mode', mode);
    const res = await fetch(
      `${API_BASE_URL}/predictions/geospatial?${search.toString()}`
    );
    return handleResponse<GeospatialPredictionResponse>(res);
  },
};

