import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import type { SevereWeatherAlertData, SevereWeatherData } from '../types';

interface SevereWeatherAlertsProps {
  loading: boolean;
  error?: string | null;
  data?: SevereWeatherData | null;
  onRetry?: () => void;
}

const SEVERITY_CONFIG: Record<string, { accent: string; bg: string }> = {
  'Low': { accent: COLORS.info, bg: COLORS.infoLight },
  'Moderate': { accent: COLORS.warning, bg: COLORS.warningLight },
  'High': { accent: COLORS.danger, bg: COLORS.dangerLight },
  'Critical': { accent: '#8B0000', bg: '#FFCCCB' },
};

function AlertCard({ alert }: { alert: SevereWeatherAlertData }) {
  const isThunderstorm = alert.type === 'thunderstorm';
  const isStrongWind = alert.type === 'strongWind';

  const icon = isThunderstorm ? '🌩️' : isStrongWind ? '💨' : '⚠️';
  const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG['Moderate'];

  return (
    <View style={[styles.card, { borderLeftColor: config.accent }]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>SEVERE WEATHER ALERT</Text>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{alert.title}</Text>
            <View style={[styles.severityBadge, { backgroundColor: config.bg }]}>
              <Text style={[styles.severityText, { color: config.accent }]}>{alert.severity} Risk</Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.message}>{alert.message}</Text>

      {/* Weather Measurements */}
      {(alert.windSpeed != null || alert.rainProbability != null) && (
        <View style={styles.metricsRow}>
          {alert.windSpeed != null && (
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Wind</Text>
              <Text style={styles.metricValue}>
                {alert.windSpeed} km/h {alert.windDirection ? ` ${alert.windDirection}` : ''}
              </Text>
            </View>
          )}
          {alert.rainProbability != null && (
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Rain Probability</Text>
              <Text style={styles.metricValue}>{alert.rainProbability}%</Text>
            </View>
          )}
        </View>
      )}

      {/* Recommendations */}
      {alert.recommendation && (
        <View style={styles.adviceContainer}>
          <Text style={styles.adviceTitle}>Safety Advice:</Text>
          <Text style={styles.adviceText}>{alert.recommendation}</Text>
        </View>
      )}

      {/* Timing */}
      {alert.expectedOccurrence && (
        <Text style={styles.timingText}>{alert.expectedOccurrence}</Text>
      )}
      {(alert.startTime && alert.endTime) && (
        <Text style={styles.timingText}>{alert.startTime} – {alert.endTime}</Text>
      )}
    </View>
  );
}

export function SevereWeatherAlerts({ loading, error, data, onRetry }: SevereWeatherAlertsProps) {
  if (loading) {
    return (
      <View style={[styles.safeCard, styles.center]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={styles.loadingText}>Loading severe weather alerts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.safeCard, { borderLeftColor: COLORS.danger }]}>
        <Text style={styles.errorText}>Unable to load severe weather alerts.</Text>
        <Text style={styles.errorSubText}>Please try again.</Text>
        {onRetry && (
          <Pressable onPress={onRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        )}
      </View>
    );
  }

  if (!data || !data.alerts || data.alerts.length === 0) {
    return (
      <View style={[styles.safeCard, { borderLeftColor: COLORS.success }]}>
        <View style={styles.header}>
          <Text style={styles.icon}>✅</Text>
          <Text style={styles.safeTitle}>No severe weather alerts</Text>
        </View>
        <Text style={styles.safeMessage}>
          Current conditions do not indicate a significant thunderstorm or strong-wind risk.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {data.alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.m,
  },
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderLeftWidth: 4,
    borderRadius: BORDER_RADIUS.m,
    marginBottom: SPACING.s,
    padding: SPACING.m,
    ...SHADOWS.subtle,
  },
  safeCard: {
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
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  errorSubText: {
    color: COLORS.danger,
    fontSize: TYPOGRAPHY.fontSize.s,
    marginTop: 4,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
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
  },
  severityBadge: {
    paddingHorizontal: SPACING.s,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
  },
  severityText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  message: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.s,
    lineHeight: TYPOGRAPHY.fontSize.s * 1.5,
    marginBottom: SPACING.m,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: BORDER_RADIUS.s,
    padding: SPACING.s,
    marginBottom: SPACING.m,
    gap: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginBottom: 4,
  },
  metricValue: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  adviceContainer: {
    marginBottom: SPACING.m,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: SPACING.s,
    borderRadius: BORDER_RADIUS.s,
  },
  adviceTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: 4,
  },
  adviceText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.s,
    lineHeight: TYPOGRAPHY.fontSize.s * 1.6,
  },
  timingText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  safeTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  safeMessage: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.s,
    lineHeight: TYPOGRAPHY.fontSize.s * 1.5,
  }
});
