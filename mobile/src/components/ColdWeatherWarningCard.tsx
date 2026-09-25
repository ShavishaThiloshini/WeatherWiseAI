import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { getColdWeatherSummary } from '../utils/coldWeather';
import type { ForecastData, WeatherData } from '../types';

interface ColdWeatherWarningCardProps {
  weather: WeatherData | null;
  forecast: ForecastData | null;
}

export function ColdWeatherWarningCard({ weather, forecast }: ColdWeatherWarningCardProps) {
  const summary = getColdWeatherSummary(weather, forecast);

  if (!summary) {
    return (
      <View style={styles.clearCard} accessibilityRole="text">
        <Text style={styles.clearIcon}>✓</Text>
        <View style={styles.copy}>
          <Text style={styles.clearTitle}>No cold-weather warning</Text>
          <Text style={styles.clearDescription}>The next few days should stay above 5°C.</Text>
        </View>
      </View>
    );
  }

  const title = summary.isFreezing ? 'Freezing conditions ahead' : 'Cold-weather warning';
  const description = summary.isFreezing
    ? 'Temperatures may reach freezing levels. Protect yourself, pets, and vulnerable plants from the cold.'
    : 'Lower temperatures are expected. Dress warmly and limit prolonged exposure outdoors.';
  const source = summary.source === 'forecast' ? 'Lowest temperature in the next 3 days' : 'Feels-like temperature right now';

  return (
    <View
      style={[styles.warningCard, summary.isFreezing && styles.freezingCard]}
      accessible
      accessibilityRole="alert"
      accessibilityLabel={`${title}. ${Math.round(summary.lowestTemperature)} degrees Celsius. ${description}`}
    >
      <View style={styles.header}>
        <View style={[styles.iconWrap, summary.isFreezing && styles.freezingIconWrap]}>
          <Text style={styles.icon} accessibilityElementsHidden>{summary.isFreezing ? '🥶' : '❄️'}</Text>
        </View>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>COLD WEATHER</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={[styles.temperatureBadge, summary.isFreezing && styles.freezingBadge]}>
          <Text style={styles.temperature}>{Math.round(summary.lowestTemperature)}°C</Text>
        </View>
      </View>

      <Text style={styles.description}>{description}</Text>
      <Text style={styles.source}>{source}</Text>

      <View style={styles.adviceList}>
        <Text style={styles.adviceItem}>🧥 Wear warm layers and cover exposed skin.</Text>
        <Text style={styles.adviceItem}>☕ Keep warm, especially during early mornings and evenings.</Text>
        {summary.isFreezing ? <Text style={styles.adviceItem}>🌿 Move sensitive plants indoors where possible.</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  warningCard: {
    backgroundColor: '#102A43',
    borderColor: '#2F80C0',
    borderRadius: BORDER_RADIUS.m,
    borderWidth: 1,
    marginBottom: SPACING.s,
    padding: SPACING.m,
    ...SHADOWS.subtle,
  },
  freezingCard: {
    backgroundColor: '#172554',
    borderColor: '#60A5FA',
  },
  clearCard: {
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    borderRadius: BORDER_RADIUS.m,
    flexDirection: 'row',
    marginBottom: SPACING.s,
    padding: SPACING.m,
  },
  clearIcon: { color: COLORS.success, fontSize: 21, fontWeight: TYPOGRAPHY.fontWeight.bold, marginRight: SPACING.s },
  clearTitle: { color: COLORS.textDark, fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  clearDescription: { color: '#166534', fontSize: TYPOGRAPHY.fontSize.s, marginTop: 2 },
  header: { alignItems: 'center', flexDirection: 'row', gap: SPACING.s },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#1D4E78',
    borderRadius: BORDER_RADIUS.round,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  freezingIconWrap: { backgroundColor: '#1E3A8A' },
  icon: { fontSize: 22 },
  heading: { flex: 1 },
  eyebrow: { color: '#93C5FD', fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.bold, letterSpacing: 0.8 },
  title: { color: COLORS.white, fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.semiBold, marginTop: 2 },
  temperatureBadge: { backgroundColor: '#1D4E78', borderRadius: BORDER_RADIUS.round, paddingHorizontal: SPACING.s, paddingVertical: SPACING.xs },
  freezingBadge: { backgroundColor: '#1E3A8A' },
  temperature: { color: COLORS.white, fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.bold },
  description: { color: '#DBEAFE', fontSize: TYPOGRAPHY.fontSize.s, lineHeight: 20, marginTop: SPACING.m },
  source: { color: '#93C5FD', fontSize: TYPOGRAPHY.fontSize.xs, marginTop: SPACING.s },
  adviceList: { gap: SPACING.xs, marginTop: SPACING.m },
  adviceItem: { color: '#BFDBFE', fontSize: TYPOGRAPHY.fontSize.s, lineHeight: 19 },
  copy: { flex: 1 },
});