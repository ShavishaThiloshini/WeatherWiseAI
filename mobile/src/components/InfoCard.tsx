/**
 * components/InfoCard.tsx
 * Reusable card for displaying Smart Advice recommendations.
 * Supports different severity levels with distinct visual styling.
 */

import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import type { RecommendationSeverity } from '../types';

interface InfoCardProps {
  title: string;
  description: string;
  severity?: RecommendationSeverity;
  /** Emoji or short text icon */
  icon?: string;
  /** Optional numeric score 0-100 */
  score?: number;
  style?: StyleProp<ViewStyle>;
}

const SEVERITY_COLORS: Record<RecommendationSeverity, { bg: string; accent: string }> = {
  info: { bg: COLORS.infoLight, accent: COLORS.info },
  success: { bg: COLORS.successLight, accent: COLORS.success },
  warning: { bg: COLORS.warningLight, accent: COLORS.warning },
  danger: { bg: COLORS.dangerLight, accent: COLORS.danger },
};

export function InfoCard({
  title,
  description,
  severity = 'info',
  icon,
  score,
  style,
}: InfoCardProps) {
  const { bg, accent } = SEVERITY_COLORS[severity];

  return (
    <View style={[styles.card, { backgroundColor: COLORS.backgroundCard }, style]}>
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accent }]} />

      <View style={styles.body}>
        <View style={styles.headerRow}>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {score !== undefined ? (
            <View style={[styles.scoreBadge, { backgroundColor: bg }]}>
              <Text style={[styles.scoreText, { color: accent }]}>{score}/100</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.m,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: SPACING.s,
    ...SHADOWS.subtle,
  },
  accentBar: {
    width: 4,
  },
  body: {
    flex: 1,
    padding: SPACING.m,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  icon: {
    fontSize: 18,
  },
  title: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  scoreBadge: {
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.s,
    paddingVertical: 2,
  },
  scoreText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.fontSize.s * 1.5,
  },
});
