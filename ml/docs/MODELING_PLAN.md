# Modeling plan

The baseline and multi-target models use only target-specific historical lags, calendar features, and district identifiers. Temperature, humidity, wind, and rainfall have separate workflows. Rainfall is modeled as occurrence plus positive amount because the target is zero-inflated. Models are evaluated chronologically and the final test period remains held out.

The final test command evaluates the saved target-specific models on the untouched test split and saves row-level actual/predicted values and residual diagnostics. The required forecast targets are T2M, PRECTOTCORR, RH2M, and WS2M. A current model forecast is unavailable when source freshness exceeds seven days; a stale historical estimate is never presented as a live forecast.
