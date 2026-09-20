const { getCurrentWeather } = require('./weather.service');

const ACTIVITIES = [
  { activityId: 'walking', activityName: 'Walking', icon: '🚶' },
  { activityId: 'running', activityName: 'Running', icon: '🏃' },
  { activityId: 'cycling', activityName: 'Cycling', icon: '🚴' },
];

function scoreToSuitability(score) {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'moderate';
  if (score >= 30) return 'poor';
  return 'avoid';
}

function walkingScore({ t, rain, wind, uv }) {
  if (rain >= 80 || wind >= 60) {
    return {
      score: 20,
      recommendation: 'Avoid walking today due to severe conditions.',
      reason: 'High rain probability or strong winds make walking unsafe.',
    };
  }
  if (rain >= 60 || wind >= 40 || t >= 38) {
    return {
      score: 38,
      recommendation: 'Walking is less suitable right now.',
      reason: 'Conditions are uncomfortable — consider a short outing only.',
    };
  }
  if (rain >= 40 || t >= 34 || uv >= 8) {
    return {
      score: 55,
      recommendation: 'Walking is possible. Take precautions.',
      reason: 'Rain risk or heat — go early or late, carry water and an umbrella.',
    };
  }
  if (t >= 26 || uv >= 6) {
    return {
      score: 72,
      recommendation: 'Good conditions for a walk.',
      reason: 'Warm weather — best done before 10 am or after 4 pm to avoid peak UV.',
    };
  }
  return {
    score: 90,
    recommendation: 'Great conditions for walking!',
    reason: 'Comfortable temperature, low rain risk and manageable UV levels.',
  };
}

function runningScore({ t, rain, wind, uv }) {
  if (rain >= 80 || wind >= 60) {
    return {
      score: 15,
      recommendation: 'Avoid running in these conditions.',
      reason: 'Severe rain or strong winds present a safety risk.',
    };
  }
  if (rain >= 60 || wind >= 40 || t >= 35) {
    return {
      score: 32,
      recommendation: 'Running is not ideal today.',
      reason: 'Heavy rain or extreme heat will negatively affect performance and safety.',
    };
  }
  if (rain >= 40 || t >= 30 || uv >= 8) {
    return {
      score: 50,
      recommendation: 'Running is possible with care.',
      reason: 'Hydrate well, wear sunscreen, and avoid peak heat hours.',
    };
  }
  if (t >= 24 || uv >= 6) {
    return {
      score: 68,
      recommendation: 'Good running conditions.',
      reason: 'Warm day — go early morning for the best experience.',
    };
  }
  return {
    score: 88,
    recommendation: 'Excellent running conditions!',
    reason: 'Cool, low-risk weather makes this a great time to run.',
  };
}

function cyclingScore({ t, rain, wind, uv }) {
  if (wind >= 60 || rain >= 80) {
    return {
      score: 10,
      recommendation: 'Do not cycle in these conditions.',
      reason: 'High winds or heavy rain create serious road hazards for cyclists.',
    };
  }
  if (wind >= 40 || rain >= 60 || t >= 37) {
    return {
      score: 28,
      recommendation: 'Cycling is not recommended today.',
      reason: 'Strong crosswinds, wet roads or extreme heat make cycling risky.',
    };
  }
  if (wind >= 25 || rain >= 40 || t >= 32 || uv >= 8) {
    return {
      score: 52,
      recommendation: 'Cycle with caution.',
      reason: 'Elevated wind, rain chance or UV — wear protective gear and plan your route carefully.',
    };
  }
  if (wind >= 15 || t >= 26) {
    return {
      score: 74,
      recommendation: 'Good cycling conditions.',
      reason: 'Light breeze and warm weather — stay hydrated and wear a helmet.',
    };
  }
  return {
    score: 92,
    recommendation: 'Perfect day for cycling!',
    reason: 'Calm winds and comfortable temperatures make for an enjoyable ride.',
  };
}

const SCORERS = {
  walking: walkingScore,
  running: runningScore,
  cycling: cyclingScore,
};

function buildActivityRecommendations(current) {
  const temperatureC = current.temperature_c ?? null;
  const feelsLikeC = current.feels_like_c ?? null;
  const rainProbability = current.rain_probability_percent ?? 0;
  const windSpeedKmh = current.wind_speed_kmh ?? 0;
  const uvIndex = current.uv_index ?? 0;
  const t = feelsLikeC ?? temperatureC ?? 20;

  const context = {
    temperatureC,
    feelsLikeC,
    rainProbability,
    windSpeedKmh,
    uvIndex,
  };

  const weatherInputs = { t, rain: rainProbability, wind: windSpeedKmh, uv: uvIndex };

  return ACTIVITIES.map((activity) => {
    const scored = SCORERS[activity.activityId](weatherInputs);
    return {
      ...activity,
      score: scored.score,
      suitability: scoreToSuitability(scored.score),
      recommendation: scored.recommendation,
      reason: scored.reason,
      weatherContext: context,
    };
  });
}

function overallActivityLevel(activities) {
  const scores = activities.map((item) => item.score);
  const average = scores.reduce((sum, value) => sum + value, 0) / scores.length;
  return scoreToSuitability(Math.round(average));
}

function suggestBestTime(current, overallSuitability) {
  if (overallSuitability === 'avoid' || overallSuitability === 'poor') {
    return 'Wait for safer conditions before planning outdoor activity.';
  }
  const uv = current.uv_index ?? 0;
  const temp = current.feels_like_c ?? current.temperature_c ?? 20;
  if (uv >= 6 || temp >= 30) {
    return 'Early morning (before 10:00) or late afternoon (after 16:00) is usually best.';
  }
  return 'Mid-morning to early afternoon looks suitable based on current conditions.';
}

async function getActivityData(latitude, longitude) {
  const weather = await getCurrentWeather(latitude, longitude);
  const current = weather.current || {};
  const activities = buildActivityRecommendations(current);
  const overall = overallActivityLevel(activities);

  return {
    location: {
      latitude: Number(latitude),
      longitude: Number(longitude),
    },
    current: {
      temperature_c: current.temperature_c ?? null,
      feels_like_c: current.feels_like_c ?? null,
      rain_probability_percent: current.rain_probability_percent ?? null,
      wind_speed_kmh: current.wind_speed_kmh ?? null,
      uv_index: current.uv_index ?? null,
      condition: current.condition ?? null,
      observed_at: current.observed_at ?? null,
    },
    overallActivity: overall,
    bestTime: suggestBestTime(current, overall),
    activities,
    timezone: weather.timezone,
    cached: weather.cached,
    source: 'activity_rules_v1',
  };
}

module.exports = {
  getActivityData,
  buildActivityRecommendations,
  scoreToSuitability,
};
