import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import type { RecommendationSeverity, WeatherData } from '../types';

interface HydrationRecommendation {
  title: string;
  message: string;
  reason?: string;
  severity: RecommendationSeverity;
  riskLevel?: string;
}

interface HydrationHeatWarningCardProps {
  recommendation?: HydrationRecommendation | null;
  heatRecommendation?: HydrationRecommendation | null;
  weather?: WeatherData | null;
  heatRisk?: string | null;
}

type HeatLevel = 'SAFE' | 'MODERATE' | 'HIGH' | 'CRITICAL';

const LEVEL_CONFIG: Record<HeatLevel, { accent: string; label: string }> = {
  SAFE: { accent: COLORS.success, label: 'Stay aware' },
  MODERATE: { accent: COLORS.warning, label: 'Take care' },
  HIGH: { accent: COLORS.warning, label: 'Heat caution' },
  CRITICAL: { accent: COLORS.danger, label: 'Extreme heat' },
};

function fallbackHeatLevel(weather?: WeatherData | null): HeatLevel {
  if (!weather) return 'SAFE';
  const effective = Math.max(weather.temperatureC, weather.feelsLikeC);
  if (effective >= 37) return 'CRITICAL';
  if (effective >= 35) return 'HIGH';
  if (effective >= 32 || (effective >= 26 && weather.humidity >= 80)) return 'MODERATE';
  return 'SAFE';
}

function normalizeHeatLevel(value: string | undefined, weather?: WeatherData | null): HeatLevel {
  if (value === 'CRITICAL' || value === 'HIGH' || value === 'MODERATE' || value === 'SAFE') return value;
  return fallbackHeatLevel(weather);
}

export function HydrationHeatWarningCard({ recommendation, heatRecommendation, weather, heatRisk }: HydrationHeatWarningCardProps) {
  const level = normalizeHeatLevel(heatRecommendation?.riskLevel ?? recommendation?.riskLevel ?? heatRisk ?? undefined, weather);
  const config = LEVEL_CONFIG[level];
  const isHeatWarning = level !== 'SAFE';
  const primaryRecommendation = isHeatWarning ? heatRecommendation ?? recommendation : recommendation;
  const title = primaryRecommendation?.title ?? (isHeatWarning ? 'Hydrate through the heat' : 'Stay hydrated');
  const message = primaryRecommendation?.message ?? (
    isHeatWarning
      ? 'Drink water regularly, take shade breaks, and carry water for time outdoors.'
      : 'Keep water nearby and drink regularly, especially during outdoor activity.'
  );
  const reason = primaryRecommendation?.reason ?? (
    weather
      ? `${weather.feelsLikeC}°C feels like, with ${weather.humidity}% humidity.`
      : undefined
  );

  return (
    <View
      style={[styles.card, { borderLeftColor: config.accent }]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${config.label}. ${message}${reason ? ` Why: ${reason}` : ''}`}
    >
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: `${config.accent}20` }]}>
          <Text style={styles.icon} accessibilityElementsHidden>🥤</Text>
        </View>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>HYDRATION & HEAT</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: `${config.accent}20` }]}>
          <Text style={[styles.badgeText, { color: config.accent }]}>{config.label}</Text>
        </View>
      </View>

      <Text style={styles.message}>{message}</Text>
      {isHeatWarning && heatRecommendation && recommendation && heatRecommendation !== recommendation ? (
        <Text style={styles.hydrationNote}>{recommendation.message}</Text>
      ) : null}
      {reason ? <Text style={styles.reason}>{reason}</Text> : null}
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
  header: { alignItems: 'center', flexDirection: 'row', gap: SPACING.s },
  iconWrap: {
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.round,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  icon: { fontSize: 22 },
  heading: { flex: 1 },
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
  badge: { borderRadius: BORDER_RADIUS.round, paddingHorizontal: SPACING.s, paddingVertical: SPACING.xs },
  badgeText: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  message: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.s,
    lineHeight: TYPOGRAPHY.fontSize.s * 1.55,
    marginTop: SPACING.m,
  },
  reason: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    lineHeight: TYPOGRAPHY.fontSize.xs * 1.5,
    marginTop: SPACING.s,
  },
  hydrationNote: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.s,
    lineHeight: TYPOGRAPHY.fontSize.s * 1.55,
    marginTop: SPACING.s,
  },
});