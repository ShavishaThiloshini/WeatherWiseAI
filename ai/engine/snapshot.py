from engine.types.recommendation import WeatherSnapshot


def _finite_number(value: object) -> float | None:
    if value is None or value == "":
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if number != number:  # NaN
        return None
    return number


def _non_negative(value: object) -> float | None:
    number = _finite_number(value)
    if number is None or number < 0:
        return None
    return number


def _percent(value: object) -> float | None:
    number = _finite_number(value)
    if number is None or number < 0 or number > 100:
        return None
    return number


def _text(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _intensity(value: object) -> str | None:
    text = _text(value)
    if text is None:
        return None
    normalized = text.lower().replace("-", "_").replace(" ", "_")
    aliases = {
        "none": "none",
        "no_rain": "none",
        "light": "light",
        "light_rain": "light",
        "moderate": "moderate",
        "moderate_rain": "moderate",
        "heavy": "heavy",
        "heavy_rain": "heavy",
        "extreme": "extreme",
        "violent": "extreme",
    }
    return aliases.get(normalized)


def _forecast_rain(forecast: dict | None) -> tuple[str | None, float | None, str | None, list[str]]:
    if not forecast:
        return None, None, None, []
    hours = forecast.get("hours") or []
    if not hours:
        return None, None, None, ["forecast_hours_unavailable"]
    soon_rain = False
    later_rain = False
    max_probability = None
    intensity_from_rain = None
    for index, hour in enumerate(hours):
        probability = _percent(hour.get("rain_probability_percent"))
        intensity = _intensity(hour.get("rain_intensity"))
        condition = (_text(hour.get("condition")) or "").lower()
        rainy = (
            (probability is not None and probability >= 40)
            or (intensity in {"moderate", "heavy", "extreme"})
            or ("rain" in condition)
        )
        if probability is not None:
            max_probability = probability if max_probability is None else max(max_probability, probability)
        if rainy:
            if intensity_from_rain is None:
                intensity_from_rain = intensity
            if index < 3:
                soon_rain = True
            else:
                later_rain = True
    if soon_rain:
        return "soon", max_probability, intensity_from_rain, []
    if later_rain:
        return "later", max_probability, intensity_from_rain, []
    return None, max_probability, intensity_from_rain, []


def from_compact(
    payload: dict,
    *,
    request_id: str | None = None,
    extra_limitations: list[str] | None = None,
) -> WeatherSnapshot:
    limitations = list(extra_limitations or [])
    temperature = _finite_number(payload.get("temperature"))
    if temperature is None and payload.get("temperature") is not None:
        limitations.append("temperature_invalid")

    humidity = _percent(payload.get("humidity"))
    if payload.get("humidity") is not None and humidity is None:
        limitations.append("humidity_invalid_or_missing")

    uv = _non_negative(payload.get("uv_index"))
    if payload.get("uv_index") is not None and uv is None:
        limitations.append("uv_invalid_or_missing")

    wind = _non_negative(payload.get("wind_speed"))
    if payload.get("wind_speed") is not None and wind is None:
        limitations.append("wind_invalid_or_missing")

    rain = _percent(payload.get("rain_probability"))
    if payload.get("rain_probability") is not None and rain is None:
        limitations.append("rain_probability_invalid_or_missing")

    return WeatherSnapshot(
        temperature_c=temperature,
        feels_like_c=_finite_number(payload.get("feels_like")),
        humidity_percent=humidity,
        wind_speed_kmh=wind,
        wind_gust_kmh=_non_negative(payload.get("wind_gust")),
        wind_direction=_text(payload.get("wind_direction")),
        pressure_hpa=_non_negative(payload.get("pressure")),
        visibility_km=_non_negative(payload.get("visibility")),
        uv_index=uv,
        rain_probability_percent=rain,
        rain_intensity=_intensity(payload.get("rain_intensity")),
        condition=_text(payload.get("condition")),
        cloud_coverage_percent=_percent(payload.get("cloud_coverage")),
        sunrise=_text(payload.get("sunrise")),
        sunset=_text(payload.get("sunset")),
        observed_at=_text(payload.get("observed_at") or payload.get("timestamp")),
        location_label=_text(payload.get("location")),
        request_id=request_id,
        rain_timing=_text(payload.get("rain_timing")),
        limitations=limitations,
    )


def from_envelope(payload: dict) -> WeatherSnapshot:
    current = payload.get("current") or {}
    location = payload.get("location") or {}
    forecast = payload.get("forecast")
    timing, forecast_rain, forecast_intensity, forecast_limits = _forecast_rain(forecast)
    limitations = list(forecast_limits)

    temperature = _finite_number(current.get("temperature_c"))
    if temperature is None:
        limitations.append("temperature_missing")

    humidity = _percent(current.get("humidity_percent"))
    if "humidity_percent" in current and humidity is None:
        limitations.append("humidity_invalid_or_missing")

    uv = _non_negative(current.get("uv_index"))
    if "uv_index" in current and uv is None:
        limitations.append("uv_invalid_or_missing")

    wind = _non_negative(current.get("wind_speed_kmh"))
    if "wind_speed_kmh" in current and wind is None:
        limitations.append("wind_invalid_or_missing")

    rain = _percent(current.get("rain_probability_percent"))
    if "rain_probability_percent" in current and rain is None:
        limitations.append("rain_probability_invalid_or_missing")

    if forecast_rain is not None and (rain is None or forecast_rain > rain):
        rain = forecast_rain
        if forecast_intensity and not _intensity(current.get("rain_intensity")):
            current_intensity = forecast_intensity
        else:
            current_intensity = _intensity(current.get("rain_intensity"))
    else:
        current_intensity = _intensity(current.get("rain_intensity"))

    if not timing and rain is not None and rain >= 40:
        timing = "now"

    return WeatherSnapshot(
        temperature_c=temperature,
        feels_like_c=_finite_number(current.get("feels_like_c")),
        humidity_percent=humidity,
        wind_speed_kmh=wind,
        wind_gust_kmh=_non_negative(current.get("wind_gust_kmh")),
        wind_direction=_text(current.get("wind_direction")),
        pressure_hpa=_non_negative(current.get("pressure_hpa")),
        visibility_km=_non_negative(current.get("visibility_km")),
        uv_index=uv,
        rain_probability_percent=rain,
        rain_intensity=current_intensity,
        condition=_text(current.get("condition")),
        cloud_coverage_percent=_percent(current.get("cloud_coverage_percent")),
        sunrise=_text(current.get("sunrise")),
        sunset=_text(current.get("sunset")),
        observed_at=_text(current.get("observed_at")),
        location_label=_text(location.get("label")),
        timezone=_text(location.get("timezone")),
        request_id=_text(payload.get("request_id")),
        rain_timing=timing,
        limitations=limitations,
    )


def snapshot_from_request(payload: dict) -> WeatherSnapshot:
    if isinstance(payload.get("current"), dict):
        return from_envelope(payload)
    return from_compact(payload, request_id=_text(payload.get("request_id")))
