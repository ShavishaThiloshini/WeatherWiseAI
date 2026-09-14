from engine.rules._common import factor, make_recommendation
from engine.types.recommendation import Recommendation, WeatherSnapshot


def forecast_trend_rules(weather: WeatherSnapshot) -> list[Recommendation]:
    days = weather.forecast_days
    if len(days) < 2:
        return []

    first = days[0]
    last = days[-1]
    changes = []
    factors = []

    first_temp = first.get("max_temp_c")
    last_temp = last.get("max_temp_c")
    if first_temp is not None and last_temp is not None:
        temp_change = last_temp - first_temp
        factors.extend([
            factor("forecast_start_max_temp_c", first_temp, "celsius"),
            factor("forecast_end_max_temp_c", last_temp, "celsius"),
        ])
        if abs(temp_change) >= 3:
            direction = "warmer" if temp_change > 0 else "cooler"
            changes.append(f"temperatures trend {direction} by {abs(temp_change):g}°C")

    first_rain = first.get("rain_probability_percent")
    last_rain = last.get("rain_probability_percent")
    if first_rain is not None and last_rain is not None:
        rain_change = last_rain - first_rain
        factors.extend([
            factor("forecast_start_rain_probability_percent", first_rain, "percent"),
            factor("forecast_end_rain_probability_percent", last_rain, "percent"),
        ])
        if abs(rain_change) >= 20:
            direction = "increasing" if rain_change > 0 else "decreasing"
            changes.append(f"rain probability is {direction}")

    if not changes:
        return []

    return [
        make_recommendation(
            rec_id="forecast-trend-01",
            category="forecast",
            title="Multi-day forecast trend",
            message=f"Over the forecast period, {' and '.join(changes)}. Plan outdoor activities around the changing conditions.",
            reason="The trend compares the first and last valid daily forecast values supplied for this location.",
            priority="LOW",
            risk_level="LOW",
            factors=factors,
            action="review_forecast_trend",
        )
    ]