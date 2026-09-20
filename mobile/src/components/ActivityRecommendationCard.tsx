/**
 * components/ActivityRecommendationCard.tsx
 * Reusable card for displaying an outdoor activity recommendation.
 *
 * Displays:
 *  - Activity name, icon, and suitability badge
 *  - Score gauge (0–100) with a dynamic color ring
 *  - Short recommendation message + explainable reason
 *  - Key weather context row (temp, rain, wind, UV)
 *
 * Supports Loading, Error, and Empty states — never crashes on missing data.
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActivitySuitability = 'excellent' | 'good' | 'moderate' | 'poor' | 'avoid';

export interface ActivityWeatherContext {
  temperatureC?: number | null;
  feelsLikeC?: number | null;
  rainProbability?: number | null;
  windSpeedKmh?: number | null;
  uvIndex?: number | null;
}

export interface ActivityRecommendation {
  /** Internal ID of the activity: walking | running | cycling */
  activityId: 'walking' | 'running' | 'cycling';
  /** Display name shown to the user */
  activityName: string;
  /** Emoji icon for the activity */
  icon: string;
  /**
   * Score 0–100 returned by the AI / backend.
   * Null means the score is unavailable — show placeholder.
   */
  score: number | null;
  /** Short machine-readable suitability level */
  suitability: ActivitySuitability;
  /** One-line recommendation shown prominently */
  recommendation: string;
  /** Longer explanation of why this recommendation was made */
  reason?: string | null;
  /** Relevant weather figures to show under the card */
  weatherContext?: ActivityWeatherContext | null;
}

interface ActivityRecommendationCardProps {
  recommendation: ActivityRecommendation;
  /** Show a loading skeleton while data is being fetched */
  loading?: boolean;
  /** Show an error state */
  error?: string | null;
}

// ---------------------------------------------------------------------------
// Design tokens derived from suitability level
// ---------------------------------------------------------------------------

const SUITABILITY_CONFIG: Record<
  ActivitySuitability,
  { accentColor: string; badgeLabel: string; badgeBg: string }
> = {
  excellent: {
    accentColor: COLORS.success,
    badgeLabel: 'Excellent',
    badgeBg: `${COLORS.success}25`,
  },
  good: {
    accentColor: '#4ADE80', // lighter green
    badgeLabel: 'Good',
    badgeBg: '#4ADE8025',
  },
  moderate: {
    accentColor: COLORS.warning,
    badgeLabel: 'Moderate',
    badgeBg: `${COLORS.warning}25`,
  },
  poor: {
    accentColor: '#FB923C', // orange
    badgeLabel: 'Less Suitable',
    badgeBg: '#FB923C25',
  },
  avoid: {
    accentColor: COLORS.danger,
    badgeLabel: 'Not Recommended',
    badgeBg: `${COLORS.danger}20`,
  },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Circular score gauge with dynamic color ring */
function ScoreGauge({ score, color }: { score: number | null; color: string }) {
  const displayScore = score != null ? Math.min(100, Math.max(0, Math.round(score))) : null;

  return (
    <View
      style={[styles.scoreGauge, { borderColor: color }]}
      accessible
      accessibilityLabel={displayScore != null ? `Activity score: ${displayScore} out of 100` : 'Score unavailable'}
    >
      {displayScore != null ? (
        <>
          <Text style={[styles.scoreValue, { color }]}>{displayScore}</Text>
          <Text style={styles.scoreMax}>/100</Text>
        </>
      ) : (
        <Text style={[styles.scoreValue, { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s }]}>
          N/A
        </Text>
      )}
    </View>
  );
}

/** A single weather context pill */
function ContextPill({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View
      style={styles.contextPill}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text style={styles.contextPillIcon} accessibilityElementsHidden>{icon}</Text>
      <Text style={styles.contextPillText}>{value}</Text>
    </View>
  );
}

/** Loading skeleton */
function LoadingSkeleton({ icon, activityName }: { icon: string; activityName: string }) {
  return (
    <View style={[styles.card, styles.cardLoading]} accessible accessibilityLabel={`Loading ${activityName} recommendation`}>
      <View style={styles.cardHeader}>
        <View style={styles.iconWrap}>
          <Text style={styles.activityIcon}>{icon}</Text>
        </View>
        <View style={styles.headingWrap}>
          <Text style={styles.eyebrow}>OUTDOOR ACTIVITY</Text>
          <Text style={styles.activityName}>{activityName}</Text>
        </View>
        <ActivityIndicator color={COLORS.primary} size="small" />
      </View>
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, { width: '60%' }]} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ActivityRecommendationCard({
  recommendation,
  loading = false,
  error = null,
}: ActivityRecommendationCardProps) {
  const { activityId, activityName, icon, score, suitability, recommendation: rec, reason, weatherContext } = recommendation;
  const config = SUITABILITY_CONFIG[suitability] ?? SUITABILITY_CONFIG.moderate;

  if (loading) {
    return <LoadingSkeleton icon={icon} activityName={activityName} />;
  }

  const accessibilityDescription = [
    `${activityName} activity recommendation.`,
    `Suitability: ${config.badgeLabel}.`,
    score != null ? `Score: ${score} out of 100.` : '',
    rec,
    reason ? `Why: ${reason}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <View
      style={[styles.card, { borderLeftColor: config.accentColor }]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={accessibilityDescription}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Header row: icon + name + score gauge                               */}
      {/* ------------------------------------------------------------------ */}
      <View style={styles.cardHeader}>
        <View style={[styles.iconWrap, { backgroundColor: `${config.accentColor}20` }]}>
          <Text style={styles.activityIcon} accessibilityElementsHidden>{icon}</Text>
        </View>

        <View style={styles.headingWrap}>
          <Text style={styles.eyebrow}>OUTDOOR ACTIVITY</Text>
          <Text style={styles.activityName}>{activityName}</Text>
          {/* Suitability badge */}
          <View style={[styles.suitabilityBadge, { backgroundColor: config.badgeBg }]}>
            <Text style={[styles.suitabilityText, { color: config.accentColor }]}>
              {config.badgeLabel}
            </Text>
          </View>
        </View>

        <ScoreGauge score={score} color={config.accentColor} />
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Error state                                                         */}
      {/* ------------------------------------------------------------------ */}
      {error ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorText} accessibilityRole="alert">{error}</Text>
        </View>
      ) : (
        <>
          {/* -------------------------------------------------------------- */}
          {/* Recommendation message                                          */}
          {/* -------------------------------------------------------------- */}
          <Text style={styles.recommendationText}>{rec}</Text>

          {/* -------------------------------------------------------------- */}
          {/* Reason / explanation                                            */}
          {/* -------------------------------------------------------------- */}
          {reason ? (
            <View style={styles.reasonRow}>
              <Text style={[styles.reasonBullet, { color: config.accentColor }]} accessibilityElementsHidden>◦</Text>
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ) : null}

          {/* -------------------------------------------------------------- */}
          {/* Weather context pills                                           */}
          {/* -------------------------------------------------------------- */}
          {weatherContext ? (
            <View style={styles.contextRow} accessibilityElementsHidden={false}>
              {weatherContext.temperatureC != null && (
                <ContextPill icon="🌡️" label="Temperature" value={`${weatherContext.temperatureC}°C`} />
              )}
              {weatherContext.rainProbability != null && (
                <ContextPill icon="🌧️" label="Rain probability" value={`${weatherContext.rainProbability}%`} />
              )}
              {weatherContext.windSpeedKmh != null && (
                <ContextPill icon="🌬️" label="Wind speed" value={`${weatherContext.windSpeedKmh} km/h`} />
              )}
              {weatherContext.uvIndex != null && (
                <ContextPill icon="☀️" label="UV index" value={String(weatherContext.uvIndex)} />
              )}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderLeftWidth: 4,
    borderRadius: BORDER_RADIUS.m,
    marginBottom: SPACING.s,
    padding: SPACING.m,
    ...SHADOWS.subtle,
  },
  cardLoading: {
    borderLeftColor: COLORS.border,
    opacity: 0.8,
  },

  // Header
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.s,
    marginBottom: SPACING.m,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.round,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  activityIcon: {
    fontSize: 24,
  },
  headingWrap: {
    flex: 1,
    gap: SPACING.xs,
  },
  eyebrow: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 0.8,
  },
  activityName: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  suitabilityBadge: {
    alignSelf: 'flex-start',
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.s,
    paddingVertical: 2,
  },
  suitabilityText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },

  // Score gauge
  scoreGauge: {
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 3,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  scoreValue: {
    fontSize: TYPOGRAPHY.fontSize.l,
    fontWeight: TYPOGRAPHY.fontWeight.extraBold,
    lineHeight: 22,
  },
  scoreMax: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },

  // Recommendation message
  recommendationText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.s,
    lineHeight: TYPOGRAPHY.fontSize.s * 1.6,
    marginBottom: SPACING.s,
  },

  // Reason
  reasonRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: SPACING.s,
  },
  reasonBullet: {
    fontSize: TYPOGRAPHY.fontSize.l,
    lineHeight: TYPOGRAPHY.fontSize.s * 1.5,
    marginRight: SPACING.xs,
  },
  reasonText: {
    color: COLORS.textSecondary,
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.xs,
    lineHeight: TYPOGRAPHY.fontSize.xs * 1.55,
  },

  // Weather context pills
  contextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  contextPill: {
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}18`,
    borderRadius: BORDER_RADIUS.round,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: SPACING.s,
    paddingVertical: 4,
  },
  contextPillIcon: {
    fontSize: 12,
  },
  contextPillText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  // Error state
  errorRow: {
    backgroundColor: `${COLORS.danger}15`,
    borderRadius: BORDER_RADIUS.s,
    padding: SPACING.s,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: TYPOGRAPHY.fontSize.s,
  },

  // Loading skeleton lines
  skeletonLine: {
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.s,
    height: 12,
    marginBottom: SPACING.s,
    opacity: 0.5,
    width: '90%',
  },
});
