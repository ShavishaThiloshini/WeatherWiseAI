from engine.rules.clothing import clothing_rules
from engine.types.recommendation import WeatherSnapshot


def clothing(snapshot: WeatherSnapshot):
    recommendations = clothing_rules(snapshot)
    assert len(recommendations) <= 1
    return recommendations[0] if recommendations else None


def test_temperature_bands_produce_clothing_advice() -> None:
    assert "coat" in clothing(WeatherSnapshot(temperature_c=2)).message
    assert "jacket" in clothing(WeatherSnapshot(temperature_c=8)).message
    assert "cardigan" in clothing(WeatherSnapshot(temperature_c=15)).message
    assert "everyday" in clothing(WeatherSnapshot(temperature_c=22)).message
    assert "breathable" in clothing(WeatherSnapshot(temperature_c=29)).message
    assert "very lightweight" in clothing(WeatherSnapshot(temperature_c=38)).message


def test_rain_and_heat_are_combined_in_one_recommendation() -> None:
    recommendation = clothing(
        WeatherSnapshot(
            temperature_c=33,
            rain_probability_percent=75,
            rain_intensity="moderate",
        )
    )

    assert recommendation is not None
    assert "breathable" in recommendation.message
    assert "waterproof" in recommendation.message
    assert recommendation.id == "clothing-01"


def test_high_uv_adds_sun_protection_when_not_cold() -> None:
    recommendation = clothing(WeatherSnapshot(temperature_c=24, uv_index=8))

    assert recommendation is not None
    assert "sun protection" in recommendation.message


def test_high_uv_does_not_add_conflicting_advice_on_cold_day() -> None:
    recommendation = clothing(WeatherSnapshot(temperature_c=8, uv_index=11))

    assert recommendation is not None
    assert "sun protection" not in recommendation.message


def test_missing_temperature_skips_clothing() -> None:
    assert clothing(WeatherSnapshot(uv_index=11, rain_probability_percent=90)) is None


def test_low_rain_probability_does_not_add_rain_layer() -> None:
    recommendation = clothing(WeatherSnapshot(temperature_c=22, rain_probability_percent=20))

    assert recommendation is not None
    assert "waterproof" not in recommendation.message