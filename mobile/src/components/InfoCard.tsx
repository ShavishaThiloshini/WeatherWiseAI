/**
 * components/InfoCard.tsx
 * Reusable card for displaying Smart Advice recommendations.
 * Redesigned for glossy liquid glass theme.
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
  info: { bg: 'rgba(59, 130, 246, 0.2)', accent: '#60a5fa' },
  success: { bg: 'rgba(34, 197, 94, 0.2)', accent: '#4ade80' },
  warning: { bg: 'rgba(245, 158, 11, 0.2)', accent: '#fbbf24' },
  danger: { bg: 'rgba(239, 68, 68, 0.2)', accent: '#f87171' },
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
    <View style={[styles.card, style]}>
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
    backgroundColor: 'transparent',
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
    color: COLORS.white, // Changed for dark glossy theme
  },
  scoreBadge: {
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.s,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scoreText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: 'rgba(255, 255, 255, 0.7)', // Changed for dark glossy theme
    lineHeight: TYPOGRAPHY.fontSize.s * 1.5,
  },
});
