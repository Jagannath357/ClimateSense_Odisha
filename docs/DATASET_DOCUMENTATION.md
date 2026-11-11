# ClimateSense Odisha — Dataset Documentation

**Data Source:** NASA POWER (Prediction Of Worldwide Energy Resources) Daily Agroclimatology  
**Geographic Coverage:** 15 Districts of Odisha, India  
**Temporal Span:** January 1, 2001 through December 31, 2025 (25 full years)  
**Total Dataset Records:** 136,965 rows (9,131 days × 15 districts)  
**File Location:** `ml/data/processed/climate_daily_cleaned.csv`  

---

## 1. Monitored Districts & Geographic Coordinates

Coordinates and MERRA-2 grid cell elevations extracted directly from NASA POWER file headers:

| District Identifier | District Name | Region | Latitude (°N) | Longitude (°E) | MERRA-2 Grid Elevation | NASA Source File |
|---|---|---|---:|---:|---:|---|
| `angul` | Angul | Central Odisha | 20.8400 | 85.1000 | 206.61 m | `angul.csv` |
| `bargarh` | Bargarh | Western Odisha | 21.3300 | 83.6200 | 222.75 m | `bargarh.csv` |
| `bhadrak` | Bhadrak | Northern Coastal | 21.0600 | 86.5000 | 82.63 m | `bhadrak.csv` |
| `cuttack` | Cuttack | Central Coastal | 20.4625 | 85.8830 | 72.95 m | `cuttack.csv` |
| `gajapati` | Gajapati | Southern Odisha | 18.7800 | 84.0900 | 231.82 m | `gajapati.csv` |
| `ganjam` | Ganjam | Southern Coastal | 19.3500 | 84.9900 | 60.99 m | `ganjam.csv` |
| `kalahandi` | Kalahandi | Southwestern | 19.9100 | 83.1700 | 353.47 m | `kalahandi.csv` |
| `kendrapada` | Kendrapada | Eastern Coastal | 20.5000 | 86.4200 | 17.76 m | `kendrapada.csv` |
| `keojhar` | Keonjhar | Northern Odisha | 21.6300 | 85.5800 | 341.47 m | `keojhar.csv` |
| `khurda` | Khurda | East-Central | 20.1800 | 85.6200 | 37.91 m | `khurda.csv` |
| `koraput` | Koraput | Southern Highlands | 18.8100 | 82.7100 | 642.71 m | `koraput.csv` |
| `malkangiri` | Malkangiri | Southernmost | 18.3500 | 81.9000 | 387.93 m | `malkangiri.csv` |
| `puri` | Puri | Coastal Odisha | 19.8135 | 85.8315 | 37.91 m | `puri.csv` |
| `sambalpur` | Sambalpur | Western Odisha | 21.4669 | 83.9812 | 222.75 m | `sambalpur.csv` |
| `sundargarh` | Sundargarh | Northwestern | 22.1200 | 84.0300 | 295.48 m | `sundargarh.csv` |

---

## 2. In-Depth Empirical Finding: Spatial Grid Resolution

An automated comparison across all district pairs revealed:
1. **Bargarh and Sambalpur:** 100.00% identical values across all 9 climate variables for all 9,131 days.
   - *Physical explanation:* NASA POWER uses the MERRA-2 meteorological assimilation model on a 0.5° latitude × 0.625° longitude mesh. Both Bargarh (21.33° N, 83.62° E) and Sambalpur (21.4669° N, 83.9812° E) fall within the same grid cell (elevation 222.75m).
2. **Khurda and Puri:** 100.00% identical meteorological values (elevation 37.91m). Only `ALLSKY_SFC_SW_DWN` differs because solar radiation is derived from the distinct satellite-based CERES 1° × 1° solar grid.

---

## 3. Climate Variables & Physical Units

| Column | NASA POWER Code | Definition | Physical Unit |
|---|---|---|---|
| `T2M` | T2M | Mean air temperature at 2m | °C |
| `T2M_MAX` | T2M_MAX | Maximum daily air temperature at 2m | °C |
| `T2M_MIN` | T2M_MIN | Minimum daily air temperature at 2m | °C |
| `T2MDEW` | T2MDEW | Dew/frost point temperature at 2m | °C |
| `RH2M` | RH2M | Relative humidity at 2m | % |
| `PRECTOTCORR` | PRECTOTCORR | Corrected precipitation accumulation | mm/day |
| `WS2M` | WS2M | Surface wind speed at 2m | m/s |
| `ALLSKY_SFC_SW_DWN` | ALLSKY_SFC_SW_DWN | All-sky solar insolation | MJ/m²/day |
| `PS` | PS | Surface atmospheric pressure | kPa |

---

## 4. Cleaning & Missing-Value Treatment

1. NASA POWER missing value sentinel (`-999`) was mapped to `np.nan`.
2. No artificial constant or zero imputation was applied during data preprocessing.
3. In the final cleaned dataset, all 136,965 rows have complete numerical values.

