import type { Recommendation, RecommendationResponse, WeatherData } from '../types';

export interface SmartAdviceCards {
  clothing?: Recommendation;
  umbrella?: Recommendation;
  hydration?: Recommendation;
  general?: Recommendation;
  primarySummary?: Recommendation;
}

const PRIORITY_ORDER = ['clothing', 'umbrella', 'hydration', 'general'] as const;

type FallbackRecommendation = RecommendationResponse['recommendations'][number];

function makeFallbackRecommendation(
  category: Recommendation['category'],
  title: string,
  message: string,
  severity: Recommendation['severity'] = 'info',
  reason = message,
): FallbackRecommendation {
  return {
    id: `${category}-fallback`,
    category,
    title,
    message,
    reason,
    priority: 'medium',
    risk_level: 'moderate',
    severity,
    factors: [],
  };
}

export function buildFallbackSmartAdviceCards(weather: WeatherData | null): FallbackRecommendation[] {
  const temperature = weather?.temperatureC ?? 22;
  const feelsLike = weather?.feelsLikeC ?? temperature;
  const rainProbability = weather?.rainProbability ?? 0;
  const uvIndex = weather?.uvIndex ?? 0;
  const humidity = weather?.humidity ?? 50;

  const cards: FallbackRecommendation[] = [];

  if (temperature <= 12) {
    cards.push(makeFallbackRecommendation('clothing', 'Layer up', 'Wear a warm coat and extra layers today.', 'warning', 'Cold conditions are expected.'));
  } else if (temperature >= 30 || feelsLike >= 32 || uvIndex >= 8) {
    cards.push(makeFallbackRecommendation('clothing', 'Light, breathable layers', 'Choose light fabrics and avoid heavy layers.', 'warning', 'Heat and UV are elevated.'));
  }

  if (rainProbability >= 60) {
    cards.push(makeFallbackRecommendation('umbrella', 'Carry an umbrella', 'Rain is likely later today, so keep a compact umbrella handy.', 'warning', `Rain probability is ${rainProbability}%.`));
  }

  if (temperature >= 32 || humidity >= 80 || uvIndex >= 8) {
    cards.push(makeFallbackRecommendation('hydration', 'Hydrate regularly', 'Drink water throughout the day and take shade breaks if outdoors.', 'danger', 'Heat stress risk is elevated.'));
  }

  if (cards.length === 0) {
    cards.push(makeFallbackRecommendation('general', 'Conditions look suitable', 'A mild day is ideal for a steady outdoor plan with regular hydration.', 'info', 'No major weather risks are currently elevated.'));
  }

  return cards;
}

export function findSmartAdviceCards(recommendations: Recommendation[] = []): SmartAdviceCards {
  const entries = recommendations.filter(Boolean);

  const clothing = entries.find((recommendation) => recommendation.category === 'clothing');
  const umbrella = entries.find((recommendation) => recommendation.category === 'umbrella');
  const hydration = entries.find((recommendation) => recommendation.category === 'hydration');
  const general = entries.find((recommendation) => recommendation.category === 'general')
    ?? entries.find((recommendation) => !['clothing', 'umbrella', 'hydration'].includes(recommendation.category));

  const primarySummary = general ?? entries.find((recommendation) => PRIORITY_ORDER.includes(recommendation.category as typeof PRIORITY_ORDER[number]))
    ?? entries[0];

  return { clothing, umbrella, hydration, general, primarySummary };
}
