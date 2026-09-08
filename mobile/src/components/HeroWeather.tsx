import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import type { WeatherData } from '../types';

export function HeroWeather({ weather, locationLabel }: { weather: WeatherData; locationLabel?: string }) {
  return (
    <View style={styles.heroCard}>
      <Text style={styles.weatherEmoji}>⛅</Text>
      <Text style={styles.temperature}>{weather.temperatureC}°C</Text>
      <Text style={styles.conditionLabel}>{weather.conditionLabel}</Text>
      <Text style={styles.feelsLike}>Feels like {weather.feelsLikeC}°C</Text>
      {locationLabel ? <Text style={styles.locationFull}>{locationLabel}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.m, ...SHADOWS.card },
  weatherEmoji: { fontSize: 64, marginBottom: SPACING.s },
  temperature: { fontSize: TYPOGRAPHY.fontSize.display, fontWeight: TYPOGRAPHY.fontWeight.extraBold, color: COLORS.white },
  conditionLabel: { fontSize: TYPOGRAPHY.fontSize.l, fontWeight: TYPOGRAPHY.fontWeight.medium, color: COLORS.primaryLight, marginTop: SPACING.xs },
  feelsLike: { fontSize: TYPOGRAPHY.fontSize.s, color: COLORS.primaryLight, marginTop: SPACING.xs, opacity: 0.85 },
  locationFull: { fontSize: TYPOGRAPHY.fontSize.s, color: COLORS.primaryLight, marginTop: SPACING.xs, opacity: 0.7 },
});
