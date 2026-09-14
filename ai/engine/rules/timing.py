from datetime import datetime, time
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from engine.rules._common import factor, make_recommendation
from engine.types.recommendation import Recommendation, WeatherSnapshot


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _parse_time(value: str | None) -> time | None:
    if not value:
        return None
    try:
        return time.fromisoformat(value.replace("Z", "+00:00").split("+", 1)[0])
    except ValueError:
        return None


def local_day_period(weather: WeatherSnapshot) -> str | None:
    observed_at = _parse_datetime(weather.observed_at)
    if observed_at is None:
        return None

    if observed_at.tzinfo is None:
        if not weather.timezone:
            return None
        try:
            observed_at = observed_at.replace(tzinfo=ZoneInfo(weather.timezone))
        except ZoneInfoNotFoundError:
            return None
    elif weather.timezone:
        try:
            observed_at = observed_at.astimezone(ZoneInfo(weather.timezone))
        except ZoneInfoNotFoundError:
            return None

    current_time = observed_at.timetz().replace(tzinfo=None)
    sunrise = _parse_time(weather.sunrise)
    sunset = _parse_time(weather.sunset)
    if sunrise and sunset:
        if current_time < sunrise or current_time > sunset:
            return "night"
    elif current_time < time(5) or current_time >= time(21):
        return "night"

    if current_time < time(12):
        return "morning"
    if current_time < time(17):
        return "afternoon"
    return "evening"


def timing_rules(weather: WeatherSnapshot) -> list[Recommendation]:
    period = local_day_period(weather)
    if period is None:
        return []

    messages = {
        "night": "It is currently night at this location. Prefer well-lit routes and indoor plans.",
        "morning": "Morning conditions are available for planning your day. Check the latest forecast before heading out.",
        "afternoon": "It is afternoon at this location. Plan outdoor activity around the current heat, UV, rain, and wind advice.",
        "evening": "It is evening at this location. Allow for fading light and changing conditions in your plans.",
    }
    factors = [factor("observed_at", weather.observed_at), factor("day_period", period)]
    if weather.timezone:
        factors.append(factor("timezone", weather.timezone))
    if weather.sunrise:
        factors.append(factor("sunrise", weather.sunrise))
    if weather.sunset:
        factors.append(factor("sunset", weather.sunset))

    return [
        make_recommendation(
            rec_id="timing-01",
            category="timing",
            title=f"Timing: {period.title()}",
            message=messages[period],
            reason="The timing guidance uses the observation timestamp, location timezone, and sunrise/sunset when supplied.",
            priority="INFO",
            risk_level="SAFE",
            factors=factors,
            action="time_aware_planning",
        )
    ]