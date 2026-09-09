/**
 * controllers/weather.controller.js
 * Weather data endpoints backed by Open-Meteo (free, no API key).
 * Also proxies recommendation requests to the Python AI engine.
 */

const WEATHER_CODES = {
  0: ["sunny", "Clear Sky"],
  1: ["partly-cloudy", "Mainly Clear"],
  2: ["partly-cloudy", "Partly Cloudy"],
  3: ["cloudy", "Overcast"],
  45: ["foggy", "Fog"],
  48: ["foggy", "Depositing Rime Fog"],
  51: ["rainy", "Light Drizzle"],
  53: ["rainy", "Moderate Drizzle"],
  55: ["rainy", "Dense Drizzle"],
  56: ["rainy", "Light Freezing Drizzle"],
  57: ["rainy", "Dense Freezing Drizzle"],
  61: ["rainy", "Slight Rain"],
  63: ["rainy", "Moderate Rain"],
  65: ["rainy", "Heavy Rain"],
  66: ["rainy", "Light Freezing Rain"],
  67: ["rainy", "Heavy Freezing Rain"],
  71: ["snowy", "Slight Snow Fall"],
  73: ["snowy", "Moderate Snow Fall"],
  75: ["snowy", "Heavy Snow Fall"],
  77: ["snowy", "Snow Grains"],
  80: ["rainy", "Slight Rain Showers"],
  81: ["rainy", "Moderate Rain Showers"],
  82: ["rainy", "Violent Rain Showers"],
  85: ["snowy", "Slight Snow Showers"],
  86: ["snowy", "Heavy Snow Showers"],
  95: ["stormy", "Thunderstorm"],
  96: ["stormy", "Thunderstorm with Slight Hail"],
  99: ["stormy", "Thunderstorm with Heavy Hail"],
};

const COMPASS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
];

function compass(deg) {
  return COMPASS[Math.round((deg % 360 || 0) / 22.5) % 16];
}

function mapCode(code) {
  return WEATHER_CODES[code] || ["unknown", "Unknown"];
}

function parseCoords(query) {
  const lat = Number(query.lat);
  const lon = Number(query.lon);
  if (
    !Number.isFinite(lat) ||
    lat < -90 ||
    lat > 90 ||
    !Number.isFinite(lon) ||
    lon < -180 ||
    lon > 180
  ) {
    return { error: "Valid lat and lon query parameters are required" };
  }
  return { value: { lat, lon } };
}

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";

const CURRENT_PARAMS = [
  "temperature_2m",
  "apparent_temperature",
  "relative_humidity_2m",
  "wind_speed_10m",
  "wind_direction_10m",
  "weather_code",
  "uv_index",
  "precipitation_probability",
  "visibility",
].join(",");

const HOURLY_PARAMS = [
  "temperature_2m",
  "weather_code",
  "precipitation_probability",
].join(",");

const DAILY_PARAMS = [
  "temperature_2m_max",
  "temperature_2m_min",
  "weather_code",
  "precipitation_probability_max",
  "uv_index_max",
].join(",");

async function fetchOpenMeteo(lat, lon) {
  const url =
    `${OPEN_METEO_BASE}?latitude=${lat}&longitude=${lon}` +
    `&current=${CURRENT_PARAMS}&hourly=${HOURLY_PARAMS}&daily=${DAILY_PARAMS}` +
    "&forecast_days=7&timezone=auto";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Open-Meteo responded with ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function mapCurrent(data) {
  const c = data.current;
  const [condition, conditionLabel] = mapCode(c.weather_code);
  return {
    temperatureC: Math.round(c.temperature_2m),
    feelsLikeC: Math.round(c.apparent_temperature),
    condition,
    conditionLabel,
    humidity: Math.round(c.relative_humidity_2m),
    windSpeedKmh: Math.round(c.wind_speed_10m),
    windDirection: compass(c.wind_direction_10m),
    uvIndex: Math.round((c.uv_index ?? 0) * 10) / 10,
    rainProbability: c.precipitation_probability ?? 0,
    visibilityKm: Math.round(((c.visibility ?? 0) / 1000) * 10) / 10,
    timestamp: c.time,
  };
}

function mapHourly(data) {
  const h = data.hourly;
  const now = Date.now();
  const out = [];
  for (let i = 0; i < h.time.length; i++) {
    const t = new Date(h.time[i]).getTime();
    if (t < now - 3600_000) continue;
    out.push({
      time: h.time[i],
      temperatureC: Math.round(h.temperature_2m[i]),
      condition: mapCode(h.weather_code[i])[0],
      rainProbability: h.precipitation_probability?.[i] ?? 0,
    });
    if (out.length >= 24) break;
  }
  return out;
}

function mapDaily(data) {
  const d = data.daily;
  return d.time.map((date, i) => ({
    date,
    maxTempC: Math.round(d.temperature_2m_max[i]),
    minTempC: Math.round(d.temperature_2m_min[i]),
    condition: mapCode(d.weather_code[i])[0],
    conditionLabel: mapCode(d.weather_code[i])[1],
    rainProbability: d.precipitation_probability_max?.[i] ?? 0,
    uvIndex: Math.round((d.uv_index_max?.[i] ?? 0) * 10) / 10,
  }));
}

async function current(req, res, next) {
  try {
    const parsed = parseCoords(req.query);
    if (parsed.error) {
      return res
        .status(400)
        .json({ error: { code: "VALIDATION_ERROR", message: parsed.error } });
    }
    const data = await fetchOpenMeteo(parsed.value.lat, parsed.value.lon);
    return res.json({ weather: mapCurrent(data) });
  } catch (error) {
    return next(error);
  }
}

async function forecast(req, res, next) {
  try {
    const parsed = parseCoords(req.query);
    if (parsed.error) {
      return res
        .status(400)
        .json({ error: { code: "VALIDATION_ERROR", message: parsed.error } });
    }
    const data = await fetchOpenMeteo(parsed.value.lat, parsed.value.lon);
    return res.json({
      forecast: { hourly: mapHourly(data), daily: mapDaily(data) },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/v1/recommendations
 * Proxies the weather payload to the Python AI recommendation engine.
 */
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

async function recommendations(req, res, next) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(`${AI_SERVICE_URL}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body || {}),
        signal: controller.signal,
      });
      const payload = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({
          error: {
            code: "AI_SERVICE_ERROR",
            message: payload?.detail || "AI service request failed",
          },
        });
      }
      return res.json(payload);
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    if (error.name === "AbortError" || error.cause?.code === "ECONNREFUSED") {
      return res.status(503).json({
        error: {
          code: "AI_SERVICE_UNAVAILABLE",
          message: "AI recommendation service is not reachable",
        },
      });
    }
    return next(error);
  }
}

module.exports = { current, forecast, recommendations };
