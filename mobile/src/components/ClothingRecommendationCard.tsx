/**
 * components/ClothingRecommendationCard.tsx
 * A focused, explainable Smart Advice card for what to wear.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import type { RecommendationSeverity, WeatherData } from '../types';

interface ClothingRecommendation {
  title: string;
  message: string;
  reason?: string;
  severity?: RecommendationSeverity;
}

interface ClothingRecommendationCardProps {
  /** The clothing item returned by the advice service, when available. */
  recommendation?: ClothingRecommendation | null;
  /** Used only to give a truthful fallback while advice is unavailable. */
  weather?: Pick<WeatherData, 'temperatureC' | 'feelsLikeC' | 'conditionLabel' | 'rainProbability' | 'uvIndex'> | null;
}

const SEVERITY = {
  info: { accent: COLORS.info, label: 'Comfort advice' },
  success: { accent: COLORS.success, label: 'Good conditions' },
  warning: { accent: COLORS.warning, label: 'Take care' },
  danger: { accent: COLORS.danger, label: 'High caution' },
} as const;

function fallbackAdvice(weather?: ClothingRecommendationCardProps['weather']): ClothingRecommendation {
  if (!weather) {
    return {
      title: 'Plan your layers',
      message: 'Weather details will help us suggest what to wear.',
      reason: 'Waiting for the latest conditions.',
      severity: 'info',
    };
  }

  const isCold = weather.feelsLikeC < 18;
  const isHot = weather.feelsLikeC >= 32;
  const hasRainRisk = weather.rainProbability >= 40;
  const hasHighUv = weather.uvIndex >= 6;
  const message = isCold
    ? 'Choose a warm layer and closed shoes for a more comfortable day.'
    : isHot
      ? 'Choose light, breathable clothing to stay comfortable in the heat.'
      : 'Light layers are a comfortable choice for today.';
  const extras = [
    hasRainRisk ? 'consider a light rain layer' : null,
    hasHighUv ? 'add sun protection' : null,
  ].filter(Boolean);

  return {
    title: isCold ? 'Bring a warm layer' : isHot ? 'Keep it light' : 'Wear light layers',
    message: extras.length ? `${message} Also, ${extras.join(' and ')}.` : message,
    reason: `${weather.conditionLabel} · ${weather.temperatureC}°C, feels like ${weather.feelsLikeC}°C.`,
    severity: isCold || isHot || hasRainRisk || hasHighUv ? 'warning' : 'info',
  };
}

export function ClothingRecommendationCard({ recommendation, weather }: ClothingRecommendationCardProps) {
  const advice = recommendation ?? fallbackAdvice(weather);
  const severity = SEVERITY[advice.severity ?? 'info'];

  return (
    <View
      style={[styles.card, { borderLeftColor: severity.accent }]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`What to wear. ${severity.label}. ${advice.title}. ${advice.message}${advice.reason ? ` Why: ${advice.reason}` : ''}`}
    >
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: `${severity.accent}20` }]}>
          <Text style={styles.icon} accessibilityElementsHidden>👕</Text>
        </View>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>WHAT TO WEAR</Text>
          <Text style={styles.title}>{advice.title}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: `${severity.accent}20` }]}>
          <Text style={[styles.severityText, { color: severity.accent }]}>{severity.label}</Text>
        </View>
      </View>

      <Text style={styles.message}>{advice.message}</Text>

      {advice.reason ? (
        <View style={styles.reasonRow}>
          <Text style={[styles.reasonIcon, { color: severity.accent }]}>◦</Text>
          <Text style={styles.reason}>{advice.reason}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderLeftWidth: 4,
    borderRadius: BORDER_RADIUS.m,
    marginBottom: SPACING.s,
    padding: SPACING.m,
    ...SHADOWS.subtle,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.s,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.round,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  icon: {
    fontSize: 22,
  },
  heading: {
    flex: 1,
  },
  eyebrow: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 0.8,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    marginTop: 2,
  },
  severityBadge: {
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.s,
    paddingVertical: SPACING.xs,
  },
  severityText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  message: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.s,
    lineHeight: TYPOGRAPHY.fontSize.s * 1.55,
    marginTop: SPACING.m,
  },
  reasonRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginTop: SPACING.s,
  },
  reasonIcon: {
    fontSize: TYPOGRAPHY.fontSize.l,
    lineHeight: TYPOGRAPHY.fontSize.s * 1.5,
    marginRight: SPACING.xs,
  },
  reason: {
    color: COLORS.textSecondary,
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.xs,
    lineHeight: TYPOGRAPHY.fontSize.xs * 1.5,
  },
});
