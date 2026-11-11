# Rainfall model findings

The source precipitation variable is NASA POWER `PRECTOTCORR`, defined in the source metadata as corrected precipitation in `mm/day`. In the 136,965-row dataset, 39.36% of values are exactly zero, the median is 0.19 mm/day, the positive-value median is 2.49 mm/day, and the maximum is 193.95 mm/day.

Because precipitation is zero-inflated, the pipeline uses a two-stage model: occurrence classification followed by positive-amount regression. On the chronological held-out test period, rainfall occurrence F1 was 0.941 and ROC-AUC was 0.967; amount-plus-occurrence RMSE was 6.619 mm/day. These are measured test results, not guarantees for future weather.

Small similar predictions can be a legitimate consequence of lag-only features and a skewed target. The pipeline does not add artificial variation, replace predictions with zero, or claim probability unless the occurrence classifier is used.
