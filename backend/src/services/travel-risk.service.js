function numericValue(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function riskLevelForScore(score) {
  if (score >= 70) return 'high';
  if (score >= 40) return 'moderate';
  return 'low';
}

function assessDestinationWeather(destinationWeather, { originWeather, destinationLabel = 'Destination' } = {}) {
  const factors = [];
  const temperature = numericValue(destinationWeather.temperature_c);
  const feelsLike = numericValue(destinationWeather.feels_like_c);
  const rainProbability = numericValue(destinationWeather.rain_probability_percent);
  const windSpeed = numericValue(destinationWeather.wind_speed_kmh);
  const uvIndex = numericValue(destinationWeather.uv_index);
  const visibility = numericValue(destinationWeather.visibility_km);

  if (destinationWeather.condition === 'stormy') {
    factors.push({
      type: 'storm',
      title: 'Thunderstorm risk',
      message: 'Thunderstorms can create hazardous conditions and sudden travel disruption.',
      score: 40,
      value: destinationWeather.conditionLabel || 'Thunderstorm',
    });
  }

  if (temperature >= 32 || feelsLike >= 35) {
    factors.push({
      type: 'heat',
      title: 'High heat exposure',
      message: 'The destination is hot enough to increase fatigue and reduce travel comfort.',
      score: 22,
      value: `${temperature}°C`,
    });
  }

  if (rainProbability >= 60) {
    factors.push({
      type: 'rain',
      title: 'Rain risk',
      message: 'Heavy rain is likely and can reduce visibility or slow travel.',
      score: 24,
      value: `${rainProbability}%`,
    });
  }

  if (windSpeed >= 40) {
    factors.push({
      type: 'wind',
      title: 'Strong wind',
      message: 'Strong winds may make open-road travel less stable.',
      score: 19,
      value: `${windSpeed} km/h`,
    });
  }

  if (uvIndex >= 8) {
    factors.push({
      type: 'uv',
      title: 'High UV',
      message: 'High UV can increase heat exposure and discomfort during a long trip.',
      score: 9,
      value: String(uvIndex),
    });
  }

  if (visibility !== null && visibility < 5) {
    factors.push({
      type: 'visibility',
      title: 'Low visibility',
      message: 'Reduced visibility can make travel more difficult and increase delays.',
      score: 15,
      value: `${visibility} km`,
    });
  }

  const originTemperature = numericValue(originWeather?.temperature_c);
  if (temperature !== null && originTemperature !== null) {
    const temperatureDelta = Math.abs(temperature - originTemperature);
    if (temperatureDelta >= 12) {
      factors.push({
        type: 'temperature-change',
        title: 'Temperature swing',
        message: `The destination is ${temperatureDelta.toFixed(1)}°C different from your current weather.`,
        score: 10,
        value: `${temperatureDelta.toFixed(1)}°C`,
      });
    }
  }

  if (factors.length === 0) {
    factors.push({
      type: 'stable',
      title: 'Stable conditions',
      message: 'Conditions look comfortable for normal travel.',
      score: 6,
      value: 'Low risk',
    });
  }

  const score = Math.min(100, factors.reduce((total, factor) => total + factor.score, 0));
  const riskLevel = riskLevelForScore(score);
  const summary = riskLevel === 'high'
    ? `High travel risk for ${destinationLabel}: severe or disruptive weather is likely to affect the trip.`
    : riskLevel === 'moderate'
      ? `Moderate travel risk for ${destinationLabel}: take precautions for the weather conditions listed.`
      : `Low travel risk for ${destinationLabel}: conditions look stable for a routine trip.`;

  return { score, riskLevel, summary, factors };
}

module.exports = { assessDestinationWeather };