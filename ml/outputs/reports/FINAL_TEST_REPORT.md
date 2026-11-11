# Final test prediction report

The saved baseline model was evaluated once on the untouched chronological test set.

- Target: `T2M`
- Test rows: 20,550
- Test period: 2022-04-02 to 2025-12-31
- MAE: 0.1899 °C
- RMSE: 0.2487 °C
- R²: 0.997163
- Mean bias error (predicted − actual): -0.0097 °C

The row-level predictions are in `outputs/metrics/final_test_predictions.csv`. These results are baseline performance, not a claim of future operational accuracy.
