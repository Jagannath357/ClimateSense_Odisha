from climatesense.formatting import format_forecast_date, format_rainfall, format_temperature, rainfall_description

def test_temperature_formatting_and_fahrenheit():
    assert format_temperature(16.67925167) == "16.7 °C"
    assert format_temperature(20, "F") == "68.0 °F"
    assert format_temperature(None) == "Unavailable"

def test_rainfall_formatting_preserves_zero_and_rejects_invalid():
    assert format_rainfall(0) == "0.00 mm/day"
    assert format_rainfall(0.081866413) == "0.08 mm/day"
    assert format_rainfall(-1) == "Unavailable"
    assert rainfall_description(0) == "No measurable rainfall predicted"
    assert rainfall_description(0.08) == "Very light amount"

def test_date_formatting_is_explicit():
    assert format_forecast_date("2026-10-30") == "30 Oct 2026"
    assert format_forecast_date("not-a-date") == "Unavailable"
