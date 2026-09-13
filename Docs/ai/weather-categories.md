# WeatherWise AI
### Weather categories and thresholds

All numeric cutoffs live in `ai/engine/constants/thresholds.py`.

## Temperature (°C)

| Category | Range |
|---|---|
| Very cold | < 5 |
| Cold | 5–11.9 |
| Cool | 12–17.9 |
| Comfortable | 18–25.9 |
| Warm | 26–31.9 |
| Hot | 32–36.9 |
| Very hot | ≥ 37 |

High heat-risk temperature is **35°C** (and feels-like **36°C**), matching the Day 1 heat rule.

## Rain

Probability (%):

| Category | Range |
|---|---|
| No rain | < 20 |
| Light | 20–39.9 |
| Moderate | 40–69.9 |
| Heavy | 70–84.9 |
| Extreme | ≥ 85 |

Intensity labels: `none`, `light`, `moderate`, `heavy`, `extreme`. Combined rain category prefers intensity/condition when present, then probability. Timing: `now`, `soon`, `later`.

## Wind (km/h; uses the higher of speed and gust)

| Category | Range |
|---|---|
| Calm | < 12 |
| Light | 12–19.9 |
| Moderate | 20–39.9 |
| Strong | 40–59.9 |
| Very strong | ≥ 60 |

Strong wind starts at **40 km/h** (Day 1).

## UV (WHO index)

| Category | Range |
|---|---|
| Low | < 3 |
| Moderate | 3–5.9 |
| High | 6–7.9 |
| Very high | 8–10.9 |
| Extreme | ≥ 11 |

Sun-protection rules start at **high**; Day 1 UV caution at **8** is very high.

## Humidity (%)

| Category | Range |
|---|---|
| Low | < 30 |
| Comfortable | 30–59.9 |
| High | 60–79.9 |
| Very high | ≥ 80 |

High humidity with hot temperature raises heat risk even when temperature is below 35°C.

## Risk levels

`SAFE`, `LOW`, `MODERATE`, `HIGH`, `CRITICAL` — reused for heat, cold, rain, wind, UV, travel, and outdoor risk.

## Which fields feed which advice

| Field | Used for |
|---|---|
| Temperature / feels-like | Heat, cold, clothing, hydration, outdoor |
| Humidity | Heat discomfort, hydration |
| UV index | Sun protection, clothing, outdoor, hydration context |
| Rain probability / intensity / timing | Umbrella, travel, outdoor |
| Wind speed / gust | Wind warning, cold exposure, outdoor, travel |
| Condition | Thunderstorm, rain |
| Cloud cover, sunrise, sunset | Reserved for later UV/daylight tuning |
| Location / time | Context and freshness only (coordinates are not shown in advice) |

## Live payload interpretation rules

The recommendation endpoint consumes the normalized `location` + `current`
envelope produced by the backend. Rules never fetch weather data themselves;
they interpret only the values supplied in that payload.

| Live field | Interpretation |
|---|---|
| `temperature_c`, `feels_like_c` | Temperature bands and heat/cold risk. Feels-like is used when it is more relevant to comfort or exposure. |
| `humidity_percent` | Heat discomfort and hydration context; very high humidity can raise heat risk below the high-temperature cutoff. |
| `wind_speed_kmh`, `wind_gust_kmh` | The higher available value determines the wind category and safety risk. |
| `uv_index` | UV protection and outdoor exposure guidance. |
| `rain_probability_percent` | Rain category when intensity and condition do not provide a stronger signal. |
| `rain_intensity`, `condition` | Override probability when they indicate stronger rain; thunderstorm condition always triggers a severe outdoor rule. |
| `forecast.hours` | The highest upcoming rain probability is merged into the current interpretation, with timing reported as `soon` or `later`. |

Missing optional values remain unknown and do not produce invented advice.
Safety-critical rules take precedence when conditions conflict, so storm,
heavy-rain, extreme-heat, and very-strong-wind guidance cannot be replaced by
a normal outdoor recommendation.
