import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WeatherCard } from './WeatherCard';
import { SPACING } from '../constants/theme';
import type { WeatherData } from '../types';

export function MetricsGrid({ weather }: { weather: WeatherData }) {
  return (
    <View style={styles.metricsGrid}>
      <WeatherCard label="Humidity" value={`${weather.humidity}%`} icon="💧" style={styles.gridItem} />
      <WeatherCard label="Wind" value={`${weather.windSpeedKmh} km/h`} subLabel={weather.windDirection} icon="🌬️" style={styles.gridItem} />
      <WeatherCard label="UV Index" value={String(weather.uvIndex)} subLabel={weather.uvIndex >= 8 ? 'Very High' : weather.uvIndex >= 6 ? 'High' : 'Moderate'} icon="☀️" style={styles.gridItem} />
      <WeatherCard label="Rain" value={`${weather.rainProbability}%`} subLabel="Probability" icon="🌧️" style={styles.gridItem} />
    </View>
  );
}

const styles = StyleSheet.create({
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.s, marginBottom: SPACING.xs },
  gridItem: { flex: 1, minWidth: '45%' },
});
