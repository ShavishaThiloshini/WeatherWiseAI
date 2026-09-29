from datetime import datetime, timezone

from engine.rules._common import factor, make_recommendation
from engine.types.recommendation import Recommendation, WeatherSnapshot

_DROUGHT_TOLERANT = ("cactus", "succulent")
_FREQUENT_WATERING = ("basil", "lettuce", "tomato", "herb", "fern")


def _parse_timestamp(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _watering_interval(species_type: str | None) -> float:
    species = (species_type or "").lower()
    if any(plant_type in species for plant_type in _DROUGHT_TOLERANT):
        return 5.0
    if any(plant_type in species for plant_type in _FREQUENT_WATERING):
        return 1.0
    return 2.0


def plant_watering_rules(weather: WeatherSnapshot) -> list[Recommendation]:
    if not weather.plants:
        return []

    rain_probability = weather.rain_probability_percent
    for day in weather.forecast_days[:1]:
        day_rain = day.get("rain_probability_percent")
        if day_rain is not None:
            rain_probability = max(rain_probability or 0, day_rain)

    likely_rain = (
        (rain_probability is not None and rain_probability >= 70)
        or weather.rain_intensity in {"moderate", "heavy", "extreme"}
    )
    possible_rain = (
        (rain_probability is not None and rain_probability >= 40)
        or weather.rain_timing in {"soon", "later"}
    )
    hot_and_dry = (
        weather.temperature_c is not None
        and weather.temperature_c >= 30
        and (weather.humidity_percent is None or weather.humidity_percent <= 50)
    )

    now = _parse_timestamp(weather.observed_at) or datetime.now(timezone.utc)
    recommendations = []
    for index, plant in enumerate(weather.plants):
        name = plant["name"]
        species_type = plant.get("species_type")
        last_watered = _parse_timestamp(plant.get("last_watered_at"))
        elapsed_days = (
            max(0, (now - last_watered).total_seconds() / 86400)
            if last_watered is not None
            else None
        )
        interval = _watering_interval(species_type)
        due = elapsed_days is not None and elapsed_days >= interval
        hot_due = (
            elapsed_days is not None
            and hot_and_dry
            and elapsed_days >= interval * 0.75
            and not any(kind in (species_type or "").lower() for kind in _DROUGHT_TOLERANT)
        )

        factors = [factor("plant_name", name)]
        if plant.get("id"):
            factors.append(factor("plant_id", plant["id"]))
        if species_type:
            factors.append(factor("species_type", species_type))
        if elapsed_days is not None:
            factors.append(factor("days_since_watered", round(elapsed_days, 1), "days"))
        if rain_probability is not None:
            factors.append(factor("rain_probability_percent", rain_probability, "percent"))
        if weather.temperature_c is not None:
            factors.append(factor("temperature_c", weather.temperature_c, "celsius"))
        if weather.humidity_percent is not None:
            factors.append(factor("humidity_percent", weather.humidity_percent, "percent"))

        if likely_rain:
            action = "skip"
            title = f"Skip watering {name} today"
            message = f"Rain is likely today, so skip watering {name} and check the soil tomorrow."
            reason = "The forecast indicates substantial rain, which may provide enough water."
            priority, risk_level = "INFO", "SAFE"
        elif last_watered is None:
            action = "check_soil"
            title = f"Check {name} before watering"
            message = f"Check the soil for {name} before watering; no recent watering date is available."
            reason = "Watering history is missing, so soil moisture cannot be inferred from weather alone."
            priority, risk_level = "INFO", "SAFE"
        elif elapsed_days < 1:
            action = "skip"
            title = f"No need to water {name} yet"
            message = f"{name} was watered recently, so hold off and check it again tomorrow."
            reason = "The plant was watered within the last 24 hours."
            priority, risk_level = "INFO", "SAFE"
        elif hot_due or due:
            if possible_rain:
                action = "water_later"
                title = f"Water {name} later"
                message = f"Rain may arrive, so wait until later before watering {name}; recheck the forecast."
                reason = "The plant is due for water, but some rain is forecast."
                priority, risk_level = "MEDIUM", "LOW"
            else:
                action = "water_now"
                title = f"Water {name} today"
                message = (
                    f"Water {name} today, preferably in the cooler morning or evening."
                    if hot_and_dry
                    else f"Water {name} today; its watering interval has elapsed."
                )
                reason = (
                    "Hot, dry conditions increase water loss and the plant is due for watering."
                    if hot_and_dry
                    else "The plant's estimated watering interval has elapsed."
                )
                priority, risk_level = ("HIGH", "MODERATE") if hot_and_dry else ("MEDIUM", "LOW")
        else:
            action = "skip"
            title = f"No need to water {name} today"
            message = f"{name} is not due for water yet; check it again tomorrow."
            reason = "The estimated watering interval has not elapsed."
            priority, risk_level = "INFO", "SAFE"

        plant_key = plant.get("id") or str(index + 1)
        recommendations.append(
            make_recommendation(
                rec_id=f"plant-watering-{plant_key}",
                category="plant-care",
                title=title,
                message=message,
                reason=reason,
                priority=priority,
                risk_level=risk_level,
                factors=factors,
                action=action,
            )
        )

    return recommendations