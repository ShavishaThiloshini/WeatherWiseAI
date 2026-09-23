import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import type { ForecastData, WeatherData } from '../types';

const HEAVY_RAIN_THRESHOLD = 70;

interface HeavyRainAlertCardProps {
  weather: WeatherData | null;
  forecast: ForecastData | null;
  onPress?: () => void;
}

function getPeakRain(weather: WeatherData | null, forecast: ForecastData | null) {
  const current = weather?.rainProbability ?? 0;
  const nextForecast = forecast?.hourly.find((hour) => hour.rainProbability >= HEAVY_RAIN_THRESHOLD);
  const peak = Math.max(current, nextForecast?.rainProbability ?? 0);

  return { peak, nextForecast };
}

export function HeavyRainAlertCard({ weather, forecast, onPress }: HeavyRainAlertCardProps) {
  const { peak, nextForecast } = getPeakRain(weather, forecast);
  const isAlertActive = peak >= HEAVY_RAIN_THRESHOLD;

  if (!isAlertActive) {
    return (
      <View style={styles.clearCard} accessibilityRole="text">
        <Text style={styles.clearIcon}>✓</Text>
        <View style={styles.copy}>
          <Text style={styles.clearTitle}>No heavy rain expected</Text>
          <Text style={styles.clearDescription}>We’ll flag it here when rain probability reaches 70%.</Text>
        </View>
      </View>
    );
  }

  const timing = nextForecast ? formatTime(nextForecast.time) : 'right now';
  const label = `Heavy rain alert: ${peak}% chance ${timing}`;

  return (
    <Pressable
      style={({ pressed }) => [styles.alertCard, pressed && styles.alertPressed]}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : 'alert'}
      accessibilityLabel={label}
    >
      <View style={styles.alertIconWrap}>
        <Text style={styles.alertIcon}>☔</Text>
      </View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={styles.alertEyebrow}>WEATHER ALERT</Text>
          <Text style={styles.alertProbability}>{peak}%</Text>
        </View>
        <Text style={styles.alertTitle}>Heavy rain {nextForecast ? `around ${timing}` : 'now'}</Text>
        <Text style={styles.alertDescription}>Avoid exposed routes, carry rain protection, and allow extra travel time.</Text>
        {onPress ? <Text style={styles.actionText}>View forecast  ›</Text> : null}
      </View>
    </Pressable>
  );
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'soon';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const styles = StyleSheet.create({
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#3B1720',
    borderColor: COLORS.danger,
    borderRadius: BORDER_RADIUS.m,
    borderWidth: 1,
    padding: SPACING.m,
    marginBottom: SPACING.s,
  },
  alertPressed: { opacity: 0.82 },
  alertIconWrap: {
    alignItems: 'center',
    backgroundColor: '#5A202B',
    borderRadius: BORDER_RADIUS.s,
    height: 40,
    justifyContent: 'center',
    marginRight: SPACING.s,
    width: 40,
  },
  alertIcon: { fontSize: 21 },
  copy: { flex: 1 },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  alertEyebrow: {
    color: '#FDA4AF',
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 0.8,
  },
  alertProbability: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  alertTitle: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.l,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginTop: 3,
  },
  alertDescription: {
    color: '#FECACA',
    fontSize: TYPOGRAPHY.fontSize.s,
    lineHeight: 19,
    marginTop: SPACING.xs,
  },
  actionText: {
    color: '#FDA4AF',
    fontSize: TYPOGRAPHY.fontSize.s,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    marginTop: SPACING.s,
  },
  clearCard: {
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    borderRadius: BORDER_RADIUS.m,
    flexDirection: 'row',
    marginBottom: SPACING.s,
    padding: SPACING.m,
  },
  clearIcon: {
    color: COLORS.success,
    fontSize: 21,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginRight: SPACING.s,
  },
  clearTitle: {
    color: COLORS.textDark,
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  clearDescription: {
    color: '#166534',
    fontSize: TYPOGRAPHY.fontSize.s,
    marginTop: 2,
  },
});