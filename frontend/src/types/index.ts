export interface District {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  region: string;
  note?: string;
}

export interface RainfallCategory {
  category: string;
  description: string;
  badge_color: string;
}

export interface VariablePrediction {
  target: string;
  display_name: string;
  value: number | null;
  unit: string;
  status: string;
  model_name: string;
  rainfall_probability?: number | null;
  rainfall_category?: RainfallCategory | null;
}

export interface HistoricalContextPoint {
  date: string;
  T2M: number | null;
  T2M_MAX: number | null;
  T2M_MIN: number | null;
  RH2M: number | null;
  PRECTOTCORR: number | null;
  WS2M: number | null;
}

export interface GroundTruthComparison {
  has_ground_truth: boolean;
  date: string;
  note: string;
  actual_values: Record<string, number | null>;
  absolute_errors: Record<string, number | null>;
}

export interface PredictionResponse {
  success: boolean;
  district: string;
  district_display_name: string;
  input_date: string;
  prediction_date: string;
  prediction_type: string;
  data_status: string;
  is_climatological_estimate: boolean;
  data_gap_days: number;
  latest_available_date: string;
  predictions: Record<string, VariablePrediction>;
  recent_7d_context?: HistoricalContextPoint[];
  ground_truth_comparison?: GroundTruthComparison;
  disclaimer: string;
  generated_at: string;
  model_information: Record<string, string>;
}

export interface PredictionHistoryRecord {
  id: string;
  timestamp: string;
  district: string;
  district_display_name: string;
  input_date: string;
  prediction_date: string;
  data_status: string;
  is_climatological_estimate: boolean;
  predictions: Record<string, any>;
}

export interface DatasetInfo {
  project_name: string;
  data_source: string;
  time_basis: string;
  start_date: string;
  end_date: string;
  total_records: number;
  total_districts: number;
  districts: string[];
  missing_value_sentinel: number;
  data_cleaning_policy: string;
  continuity: string;
  supported_targets: string[];
  merra2_grid_note: string;
}

export interface ClimateRecord {
  date: string;
  district: string;
  T2M: number | null;
  T2M_MAX: number | null;
  T2M_MIN: number | null;
  RH2M: number | null;
  PRECTOTCORR: number | null;
  WS2M: number | null;
  ALLSKY_SFC_SW_DWN?: number | null;
  PS?: number | null;
}

export interface HistoricalClimateResponse {
  district: string;
  start_date: string;
  end_date: string;
  total_records: number;
  page: number;
  page_size: number;
  total_pages: number;
  data: ClimateRecord[];
}

export interface AggregationRecord {
  period: string;
  district: string;
  T2M_mean: number | null;
  T2M_MAX_mean: number | null;
  T2M_MIN_mean: number | null;
  RH2M_mean: number | null;
  PRECTOTCORR_total: number | null;
  PRECTOTCORR_mean: number | null;
  WS2M_mean: number | null;
  records_count: number;
}

export interface TrendRecord {
  district: string;
  variable: string;
  unit: string;
  years: number;
  first_year: number;
  last_year: number;
  sen_slope_per_year: number;
  sen_slope_ci_low: number;
  sen_slope_ci_high: number;
  kendall_tau: number;
  kendall_p_value: number;
  is_statistically_significant: boolean;
  trend_direction: string;
  interpretation: string;
}

export interface AnnualAnomalyRecord {
  district: string;
  year: number;
  T2M: number;
  T2M_MAX: number;
  T2M_MIN: number;
  PRECTOTCORR: number;
  RH2M: number;
  WS2M: number;
  T2M_baseline: number;
  T2M_MAX_baseline: number;
  T2M_MIN_baseline: number;
  PRECTOTCORR_baseline: number;
  RH2M_baseline: number;
  WS2M_baseline: number;
  T2M_anomaly: number;
  T2M_MAX_anomaly: number;
  T2M_MIN_anomaly: number;
  PRECTOTCORR_anomaly: number;
  RH2M_anomaly: number;
  WS2M_anomaly: number;
}

export interface DailyExtremeAnomalyRecord {
  date: string;
  district: string;
  variable: string;
  unit: string;
  observed_value: number;
  historical_day_mean: number;
  historical_day_std: number;
  z_score: number;
  anomaly_category: string;
  detection_method: string;
}

export interface AnomalyResponse {
  district?: string;
  baseline_period: string;
  method_disclaimer: string;
  annual_anomalies: AnnualAnomalyRecord[];
  recent_extremes: DailyExtremeAnomalyRecord[];
}

export interface ModelPerformanceMetric {
  target: string;
  display_name: string;
  stage: string;
  unit: string;
  rows: number;
  MAE: number;
  RMSE: number;
  R2?: number | null;
  rain_occurrence_accuracy?: number;
  rain_occurrence_precision?: number;
  rain_occurrence_recall?: number;
  rain_occurrence_f1?: number;
  rain_occurrence_roc_auc?: number;
}

export interface DistrictTestMetric {
  district: string;
  rows: number;
  MAE: number;
  RMSE: number;
  bias: number;
}

export interface ModelPerformanceData {
  multi_target_models: ModelPerformanceMetric[];
  baseline_model: {
    target: string;
    model_name: string;
    scientific_role: string;
    test_metrics: any;
    validation_metrics: any;
  };
  district_test_breakdown: DistrictTestMetric[];
  metrics_explanation: Record<string, string>;
  limitations: string[];
}

export interface DistrictCard {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  latest_T2M: number | null;
  latest_PRECTOTCORR: number | null;
  latest_RH2M: number | null;
  latest_WS2M: number | null;
}

export interface DashboardSummary {
  project_name: string;
  version: string;
  total_districts: number;
  dataset_start_date: string;
  dataset_end_date: string;
  total_observations: number;
  latest_available_date: string;
  supported_models_count: number;
  models_status: string;
  state_averages: Record<string, number>;
  districts: DistrictCard[];
  recent_climate_series: any[];
  key_findings: string[];
}

export type WeatherParameterKey = 'T2M' | 'RH2M' | 'PRECTOTCORR' | 'WS2M';
export type MapVisualizationMode = 'markers' | 'heatmap';
export type GeospatialDataMode = 'prediction' | 'observation';

export interface GeospatialDistrictPrediction {
  district: string;
  district_display_name: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  region: string;
  grid_note?: string | null;
  T2M: number | null;
  T2M_MAX: number | null;
  T2M_MIN: number | null;
  RH2M: number | null;
  PRECTOTCORR: number | null;
  WS2M: number | null;
  rainfall_probability: number | null;
  rainfall_category: RainfallCategory | null;
  status: 'available' | 'climatological_estimate' | 'unavailable';
  data_quality_status: string;
  model_source: string;
  last_observed_date: string;
  ground_truth?: Record<string, number> | null;
}

export interface GeospatialPredictionResponse {
  success: boolean;
  prediction_date: string;
  input_reference_date?: string | null;
  prediction_type: 'ml_prediction' | 'climatological_estimate' | 'historical_observation' | 'unavailable';
  data_status: string;
  is_climatological_estimate: boolean;
  latest_available_date: string;
  data_gap_days: number;
  available_districts: number;
  total_districts: number;
  disclaimer: string;
  generated_at: string;
  districts: GeospatialDistrictPrediction[];
}
