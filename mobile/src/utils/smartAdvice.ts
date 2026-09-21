import type { Recommendation } from '../types';

export interface SmartAdviceCards {
  clothing?: Recommendation;
  umbrella?: Recommendation;
  hydration?: Recommendation;
  general?: Recommendation;
  primarySummary?: Recommendation;
}

const PRIORITY_ORDER = ['clothing', 'umbrella', 'hydration', 'general'] as const;

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
