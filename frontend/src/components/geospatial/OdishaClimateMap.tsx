import React, { useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  GeospatialDistrictPrediction,
  MapVisualizationMode,
  WeatherParameterKey,
} from '../../types';
import { GeoJsonFeatureCollection } from '../../hooks/useGeospatialClimate';
import {
  ODISHA_DEFAULT_ZOOM,
  ODISHA_MAP_CENTER,
  ODISHA_MAX_BOUNDS,
  extractGeoJsonDistrictName,
  formatParameterValue,
  getParameterColor,
  normalizeGeoJsonDistrictId,
} from '../../data/odishaDistricts';
import { DistrictPopup } from './DistrictPopup';

interface MapViewportControllerProps {
  selectedDistrict: GeospatialDistrictPrediction | null;
  resetTrigger: number;
  isFullscreen: boolean;
}

const MapViewportController: React.FC<MapViewportControllerProps> = ({
  selectedDistrict,
  resetTrigger,
  isFullscreen,
}) => {
  const map = useMap();

  useEffect(() => {
    if (selectedDistrict) {
      map.flyTo([selectedDistrict.latitude, selectedDistrict.longitude], 9, {
        duration: 0.75,
      });
    }
  }, [selectedDistrict, map]);

  useEffect(() => {
    if (resetTrigger > 0) {
      map.flyTo(ODISHA_MAP_CENTER, ODISHA_DEFAULT_ZOOM, { duration: 0.7 });
    }
  }, [resetTrigger, map]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => window.clearTimeout(timer);
  }, [isFullscreen, map]);

  return null;
};

interface OdishaClimateMapProps {
  isDark: boolean;
  districts: GeospatialDistrictPrediction[];
  districtMap: Map<string, GeospatialDistrictPrediction>;
  stateGeoJson: GeoJsonFeatureCollection | null;
  districtsGeoJson: GeoJsonFeatureCollection | null;
  geoLoading: boolean;
  geoError: string | null;
  activeParameter: WeatherParameterKey;
  visualizationMode: MapVisualizationMode;
  selectedDistrictId: string | null;
  onSelectDistrict: (districtId: string | null) => void;
  onViewDetails: (districtId: string) => void;
  predictionDate: string;
  predictionType: string;
  dataMode: string;
  resetTrigger: number;
  isFullscreen: boolean;
}

function createValueBadgeIcon(
  district: GeospatialDistrictPrediction,
  param: WeatherParameterKey,
  color: string,
  isSelected: boolean,
  visualizationMode: MapVisualizationMode,
  isDark: boolean
): L.DivIcon {
  const valueText = formatParameterValue(param, district[param], false);
  const unit =
    param === 'T2M'
      ? '°C'
      : param === 'RH2M'
      ? '%'
      : param === 'PRECTOTCORR'
      ? 'mm'
      : 'm/s';

  const isClimatology = district.status === 'climatological_estimate';
  const isUnavailable = district.status === 'unavailable';

  if (visualizationMode === 'heatmap') {
    // Compact crisp pin in heatmap mode so choropleth polygons remain the hero visual
    const ring = isSelected ? '2px solid #14b8a6' : '2px solid #ffffff';
    return L.divIcon({
      className: 'odisha-heatmap-pin-wrapper',
      html: `<div style="
        display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);
        pointer-events:auto;cursor:pointer;
      ">
        <div style="
          width:${isSelected ? 16 : 12}px;height:${isSelected ? 16 : 12}px;border-radius:9999px;
          background:${color};border:${ring};
          box-shadow:0 2px 6px rgba(0,0,0,0.45);
          ${isClimatology ? 'outline:2px dashed #f59e0b;outline-offset:2px;' : ''}
        "></div>
        <span style="
          margin-top:2px;padding:1px 5px;border-radius:6px;font-size:10px;font-weight:700;
          line-height:1.15;white-space:nowrap;
          background:${isDark ? 'rgba(15,23,42,0.88)' : 'rgba(255,255,255,0.92)'};
          color:${isDark ? '#f8fafc' : '#0f172a'};
          border:1px solid ${isDark ? 'rgba(51,65,85,0.9)' : 'rgba(203,213,225,0.9)'};
          box-shadow:0 1px 3px rgba(0,0,0,0.2);
        ">${district.district_display_name.split(' ')[0]}</span>
      </div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  }

  const borderStyle = isSelected
    ? '2.5px solid #ffffff'
    : isClimatology
    ? '1.5px dashed #fef3c7'
    : '1.5px solid rgba(255,255,255,0.9)';

  const badgeBg = isUnavailable ? (isDark ? '#334155' : '#64748b') : color;

  return L.divIcon({
    className: 'odisha-marker-badge-wrapper',
    html: `<div style="
      display:flex;flex-direction:column;align-items:center;
      transform:translate(-50%,-50%) scale(${isSelected ? 1.12 : 1});
      transition:transform 150ms ease;cursor:pointer;
    ">
      <div style="
        padding:3px 7px;border-radius:9999px;background:${badgeBg};color:#ffffff;
        font-size:11px;font-weight:800;line-height:1.1;white-space:nowrap;
        border:${borderStyle};
        box-shadow:${
          isSelected
            ? '0 0 0 3px rgba(20,184,166,0.55), 0 4px 12px rgba(0,0,0,0.4)'
            : '0 3px 8px rgba(0,0,0,0.3)'
        };
      ">
        ${isUnavailable ? 'N/A' : `${valueText}${unit}`}
      </div>
      <div style="
        margin-top:2px;padding:1px 5px;border-radius:5px;font-size:10px;font-weight:700;
        line-height:1.15;white-space:nowrap;
        background:${isDark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.94)'};
        color:${isDark ? '#e2e8f0' : '#0f172a'};
        border:1px solid ${isDark ? 'rgba(71,85,105,0.9)' : 'rgba(203,213,225,0.95)'};
        box-shadow:0 1px 3px rgba(0,0,0,0.18);
      ">
        ${district.district_display_name.split(' ')[0]}
      </div>
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export const OdishaClimateMap: React.FC<OdishaClimateMapProps> = ({
  isDark,
  districts,
  districtMap,
  stateGeoJson,
  districtsGeoJson,
  geoLoading,
  geoError,
  activeParameter,
  visualizationMode,
  selectedDistrictId,
  onSelectDistrict,
  onViewDetails,
  predictionDate,
  predictionType,
  dataMode,
  resetTrigger,
  isFullscreen,
}) => {
  const markerRefs = useRef<Record<string, L.Marker | null>>({});

  const selectedDistrict = useMemo(
    () => (selectedDistrictId ? districtMap.get(selectedDistrictId) ?? null : null),
    [selectedDistrictId, districtMap]
  );

  // Automatically open Leaflet Popup when a district is selected via search, list, or polygon click
  useEffect(() => {
    if (!selectedDistrictId) return;
    const marker = markerRefs.current[selectedDistrictId];
    if (marker) {
      const timer = window.setTimeout(() => {
        marker.openPopup();
      }, 180);
      return () => window.clearTimeout(timer);
    }
  }, [selectedDistrictId, visualizationMode]);

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const geoJsonCompositeKey = `${dataMode}-${predictionDate}-${activeParameter}-${visualizationMode}-${selectedDistrictId || 'none'}-${isDark ? 'dark' : 'light'}-${districts.length}`;

  if (geoError) {
    return (
      <div className="h-[520px] lg:h-[600px] rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-sm font-bold text-rose-700 dark:text-rose-300">
            Unable to Load Odisha Geographical Boundaries
          </p>
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{geoError}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-950 ${
        isFullscreen
          ? 'h-[calc(100vh-140px)] min-h-[540px]'
          : 'h-[500px] sm:h-[540px] lg:h-[600px]'
      }`}
    >
      {geoLoading && (
        <div className="absolute inset-0 z-[550] flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-200">
            <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading Odisha Boundary Geometry...</span>
          </div>
        </div>
      )}

      <MapContainer
        center={ODISHA_MAP_CENTER}
        zoom={ODISHA_DEFAULT_ZOOM}
        minZoom={6}
        maxZoom={11}
        maxBounds={ODISHA_MAX_BOUNDS}
        maxBoundsViscosity={0.8}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
        style={{
          backgroundColor: isDark ? '#020617' : '#f1f5f9',
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tileUrl}
        />

        <MapViewportController
          selectedDistrict={selectedDistrict}
          resetTrigger={resetTrigger}
          isFullscreen={isFullscreen}
        />

        {/* Odisha State Outer Boundary Perimeter */}
        {stateGeoJson && (
          <GeoJSON
            key={`state-${isDark ? 'dark' : 'light'}`}
            data={stateGeoJson as any}
            style={() => ({
              color: isDark ? '#2dd4bf' : '#0f766e',
              weight: 2.5,
              opacity: 0.9,
              fillOpacity: 0,
            })}
            interactive={false}
          />
        )}

        {/* All 30 Odisha Districts (15 Study Highlighted + 15 Non-Study Neutral) */}
        {districtsGeoJson && (
          <GeoJSON
            key={geoJsonCompositeKey}
            data={districtsGeoJson as any}
            style={(feature) => {
              const rawName = extractGeoJsonDistrictName(feature?.properties);
              const studyId = normalizeGeoJsonDistrictId(rawName);
              const data = studyId ? districtMap.get(studyId) : undefined;
              const isSelected = Boolean(studyId && studyId === selectedDistrictId);

              if (!studyId || !data) {
                return {
                  color: isDark ? '#334155' : '#cbd5e1',
                  weight: 1,
                  opacity: 0.65,
                  fillColor: isDark ? '#1e293b' : '#e2e8f0',
                  fillOpacity: isDark ? 0.28 : 0.35,
                };
              }

              const value = data[activeParameter];
              const fillColor = getParameterColor(activeParameter, value, isDark);

              return {
                color: isSelected
                  ? '#14b8a6'
                  : isDark
                  ? '#94a3b8'
                  : '#475569',
                weight: isSelected ? 3 : 1.5,
                opacity: 1,
                dashArray:
                  data.status === 'climatological_estimate' ? '5 4' : undefined,
                fillColor,
                fillOpacity:
                  visualizationMode === 'heatmap'
                    ? data.status === 'unavailable'
                      ? 0.22
                      : isSelected
                      ? 0.78
                      : 0.62
                    : isSelected
                    ? 0.32
                    : 0.14,
              };
            }}
            onEachFeature={(feature, layer) => {
              const rawName = extractGeoJsonDistrictName(feature?.properties);
              const studyId = normalizeGeoJsonDistrictId(rawName);
              const data = studyId ? districtMap.get(studyId) : undefined;

              if (!studyId || !data) {
                layer.bindTooltip(
                  `<div style="font-size:11px;font-weight:700;">${rawName}</div><div style="font-size:10px;opacity:0.8;">Odisha District (Outside 15-district ML study scope)</div>`,
                  { sticky: true }
                );
                return;
              }

              const formattedVal = formatParameterValue(
                activeParameter,
                data[activeParameter]
              );
              layer.bindTooltip(
                `<div style="font-size:11px;font-weight:800;">${data.district_display_name}</div><div style="font-size:11px;">${formattedVal} • ${data.region}</div>`,
                { sticky: true }
              );

              layer.on({
                mouseover: (e) => {
                  const target = e.target;
                  target.setStyle({
                    weight: 3,
                    fillOpacity:
                      visualizationMode === 'heatmap' ? 0.8 : 0.3,
                  });
                },
                mouseout: (e) => {
                  const target = e.target;
                  const isSel = studyId === selectedDistrictId;
                  target.setStyle({
                    weight: isSel ? 3 : 1.5,
                    fillOpacity:
                      visualizationMode === 'heatmap'
                        ? data.status === 'unavailable'
                          ? 0.22
                          : isSel
                          ? 0.78
                          : 0.62
                        : isSel
                        ? 0.32
                        : 0.14,
                  });
                },
                click: () => {
                  onSelectDistrict(studyId);
                },
              });
            }}
          />
        )}

        {/* Interactive District Markers + Rich Popups */}
        {districts.map((d) => {
          const val = d[activeParameter];
          const color = getParameterColor(activeParameter, val, isDark);
          const isSelected = d.district === selectedDistrictId;
          const icon = createValueBadgeIcon(
            d,
            activeParameter,
            color,
            isSelected,
            visualizationMode,
            isDark
          );

          return (
            <Marker
              key={`${d.district}-${activeParameter}-${visualizationMode}-${isSelected}-${isDark}-${val}`}
              position={[d.latitude, d.longitude]}
              icon={icon}
              ref={(ref) => {
                markerRefs.current[d.district] = ref;
              }}
              eventHandlers={{
                click: () => onSelectDistrict(d.district),
              }}
            >
              <Tooltip direction="top" offset={[0, -10]}>
                <span className="font-bold">{d.district_display_name}:</span>{' '}
                {formatParameterValue(activeParameter, val)}
              </Tooltip>
              <Popup maxWidth={320} className="climatesense-leaflet-popup">
                <DistrictPopup
                  district={d}
                  predictionDate={predictionDate}
                  predictionType={predictionType}
                  activeParameter={activeParameter}
                  onViewDetails={onViewDetails}
                />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
