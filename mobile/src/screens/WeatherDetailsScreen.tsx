import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InfoCard } from '../components/InfoCard';
import { ScreenContainer } from '../components/ScreenContainer';
import { WeatherCard } from '../components/WeatherCard';
import { ErrorView } from '../components/StateViews';
import { LoadingPlaceholder } from '../components/LoadingPlaceholder';
import { getCurrentLocation } from '../services/locationService';
import { getCurrentWeather } from '../services/weatherService';
import type { WeatherData } from '../types';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

export function WeatherDetailsScreen() {
  const [weather, setWeather] = React.useState<WeatherData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadWeather = React.useCallback(async () => {
    setError(null);
    try {
      const location = await getCurrentLocation();
      setWeather(await getCurrentWeather(location.latitude, location.longitude));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load live weather.');
    }
  }, []);

  React.useEffect(() => {
    void loadWeather();
  }, [loadWeather]);

  if (error) return <ErrorView message={error} onRetry={() => void loadWeather()} />;
  if (!weather) return <LoadingPlaceholder />;

  return (
    <ScreenContainer scrollable>
      <View style={styles.hero}>
        <Text style={styles.icon}>⛅</Text>
        <Text style={styles.temperature}>{weather.temperatureC}°C</Text>
        <Text style={styles.condition}>{weather.conditionLabel}</Text>
        <Text style={styles.updated}>Updated {new Date(weather.timestamp).toLocaleTimeString()}</Text>
      </View>

      <Text style={styles.sectionTitle}>Current conditions</Text>
      <View style={styles.grid}>
        <WeatherCard label="Feels like" value={`${weather.feelsLikeC}°C`} icon="🌡️" style={styles.gridItem} />
        <WeatherCard label="Humidity" value={`${weather.humidity}%`} icon="💧" style={styles.gridItem} />
        <WeatherCard label="Wind" value={`${weather.windSpeedKmh} km/h`} subLabel={weather.windDirection} icon="🌬️" style={styles.gridItem} />
        <WeatherCard label="Visibility" value={`${weather.visibilityKm} km`} icon="👁️" style={styles.gridItem} />
        <WeatherCard label="UV index" value={String(weather.uvIndex)} subLabel={weather.uvIndex >= 6 ? 'High' : 'Moderate'} icon="☀️" style={styles.gridItem} />
        <WeatherCard label="Rain chance" value={`${weather.rainProbability}%`} icon="🌧️" style={styles.gridItem} />
      </View>

      <Text style={styles.sectionTitle}>Today’s guidance</Text>
      <InfoCard
        icon="🧴"
        title="Sun protection"
        description="Use sunscreen and seek shade during the strongest UV hours."
        severity={weather.uvIndex >= 6 ? 'warning' : 'info'}
      />
      <InfoCard
        icon="💧"
        title="Stay hydrated"
        description="Keep water nearby, especially during outdoor activity."
        severity="success"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 16,
    marginBottom: SPACING.m,
    padding: SPACING.xl,
  },
  icon: { fontSize: 56, marginBottom: SPACING.s },
  temperature: { color: COLORS.textPrimary, fontSize: 40, fontWeight: TYPOGRAPHY.fontWeight.bold },
  condition: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.l, marginTop: SPACING.xs },
  updated: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.xs, marginTop: SPACING.s },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.l,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    marginBottom: SPACING.s,
    marginTop: SPACING.l,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.s },
  gridItem: { flexBasis: '31%', flexGrow: 1, minWidth: 100 },
});
