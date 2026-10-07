import type { ActivityRecommendation } from '../components/ActivityRecommendationCard';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeActivityRecommendations(payload: unknown): ActivityRecommendation[] {
  if (!isRecord(payload) || !Array.isArray(payload.activities)) {
    throw new Error('Activity service returned an invalid response.');
  }

  const validIds = new Set(['walking', 'running', 'cycling']);
  const validSuitabilities = new Set(['excellent', 'good', 'moderate', 'poor', 'avoid']);
  const normalized = payload.activities.map((item) => {
    if (!isRecord(item)
      || typeof item.activityId !== 'string' || !validIds.has(item.activityId)
      || typeof item.activityName !== 'string'
      || typeof item.icon !== 'string'
      || typeof item.score !== 'number' || !Number.isFinite(item.score)
      || item.score < 0 || item.score > 100
      || typeof item.suitability !== 'string' || !validSuitabilities.has(item.suitability)
      || typeof item.recommendation !== 'string') {
      throw new Error('Activity service returned an invalid recommendation.');
    }

    let weatherContext: ActivityRecommendation['weatherContext'] = null;
    if (item.weatherContext !== undefined && item.weatherContext !== null) {
      if (!isRecord(item.weatherContext)) {
        throw new Error('Activity service returned invalid weather context.');
      }
      const context = item.weatherContext;
      const contextFields = ['temperatureC', 'feelsLikeC', 'rainProbability', 'windSpeedKmh', 'uvIndex'];
      if (contextFields.some((field) => context[field] !== undefined
        && context[field] !== null
        && (typeof context[field] !== 'number' || !Number.isFinite(context[field])))) {
        throw new Error('Activity service returned invalid weather context.');
      }
      weatherContext = {
        temperatureC: context.temperatureC as number | null | undefined,
        feelsLikeC: context.feelsLikeC as number | null | undefined,
        rainProbability: context.rainProbability as number | null | undefined,
        windSpeedKmh: context.windSpeedKmh as number | null | undefined,
        uvIndex: context.uvIndex as number | null | undefined,
      };
    }

    return {
      activityId: item.activityId as ActivityRecommendation['activityId'],
      activityName: item.activityName,
      icon: item.icon,
      score: item.score,
      suitability: item.suitability as ActivityRecommendation['suitability'],
      recommendation: item.recommendation,
      reason: typeof item.reason === 'string' ? item.reason : null,
      weatherContext,
    };
  });

  if (normalized.length !== validIds.size || new Set(normalized.map((item) => item.activityId)).size !== validIds.size) {
    throw new Error('Activity service returned an incomplete recommendation set.');
  }
  return normalized;
}
