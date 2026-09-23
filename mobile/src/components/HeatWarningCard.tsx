import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import type { HeatData } from '../types';

interface HeatWarningCardProps {
  loading: boolean;
  error?: string | null;
  heatData?: HeatData | null;
  onRetry?: () => void;
}

const CATEGORY_CONFIG: Record<string, { accent: string; icon: string; bg: string }> = {
  'Normal': { accent: COLORS.success, icon: '✅', bg: COLORS.successLight },
  'Warm': { accent: COLORS.warning, icon: '🌤️', bg: COLORS.warningLight },
  'Hot': { accent: COLORS.warning, icon: '☀️', bg: COLORS.warningLight },
  'Very Hot': { accent: COLORS.danger, icon: '🔥', bg: COLORS.dangerLight },
  'Extreme Heat': { accent: '#8B0000', icon: '🚨', bg: '#FFCCCB' },
};

export function HeatWarningCard({ loading, error, heatData, onRetry }: HeatWarningCardProps) {
  if (loading) {
    return (
      <View style={[styles.card, styles.center]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={styles.loadingText}>Loading heat information...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.card, { borderLeftColor: COLORS.danger }]}>
        <Text style={styles.errorText}>Unable to load heat warning information.</Text>
        {onRetry && (
          <Pressable onPress={onRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        )}
      </View>
    );
  }

  if (!heatData) {
    return null;
  }

  const { current, analysis } = heatData;
  const isSafe = analysis.heat_risk === 'SAFE' || !analysis.heat_category || analysis.heat_category === 'Normal';

  if (isSafe) {
    return (
      <View style={[styles.card, { borderLeftColor: COLORS.success }]}>
        <View style={styles.header}>
          <Text style={styles.icon}>✅</Text>
          <Text style={styles.title}>No significant heat warning</Text>
        </View>
        <Text style={styles.message}>
          Current conditions are suitable for normal outdoor activity.
        </Text>
      </View>
    );
  }

  const config = CATEGORY_CONFIG[analysis.heat_category!] || CATEGORY_CONFIG['Hot'];

  return (
    <View style={[styles.card, { borderLeftColor: config.accent }]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
          <Text style={styles.icon}>{config.icon}</Text>
        </View>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>HEAT WARNING</Text>
          <Text style={styles.title}>{analysis.heat_category}</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Temperature</Text>
          <Text style={styles.metricValue}>{current.temperature_c ?? '--'}°C</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Feels like</Text>
          <Text style={styles.metricValue}>{current.feels_like_c ?? '--'}°C</Text>
        </View>
      </View>

      <View style={styles.adviceContainer}>
        <Text style={styles.adviceText}>
          {analysis.heat_alert 
            ? 'Avoid unnecessary strenuous outdoor activity and stay in shaded or air-conditioned areas.' 
            : 'Stay hydrated and avoid prolonged exposure to direct sunlight.'}
        </Text>
        
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>💧 {analysis.hydration_indicator || 'Drink plenty of water'}</Text>
          <Text style={styles.bulletItem}>☀️ Use sun protection ({analysis.uv_category} UV)</Text>
          <Text style={styles.bulletItem}>
            🏃 {analysis.heat_warning ? 'Reduce intense outdoor activity' : 'Pace outdoor activities'}
          </Text>
        </View>
      </View>
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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.s,
    marginTop: SPACING.m,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: TYPOGRAPHY.fontSize.s,
    marginBottom: SPACING.s,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingVertical: SPACING.xs,
  },
  retryText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.s,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  header: { alignItems: 'center', flexDirection: 'row', gap: SPACING.s, marginBottom: SPACING.m },
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
  message: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.s,
    lineHeight: TYPOGRAPHY.fontSize.s * 1.5,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.s,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginBottom: 4,
  },
  metricValue: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.l,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  adviceContainer: {
    marginTop: SPACING.xs,
  },
  adviceText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.s,
    lineHeight: TYPOGRAPHY.fontSize.s * 1.5,
    marginBottom: SPACING.m,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  bulletList: {
    gap: SPACING.xs,
  },
  bulletItem: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.s,
  },
});
