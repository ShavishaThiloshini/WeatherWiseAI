/**
 * screens/HomeScreen.tsx
 * Main Home screen for WeatherWise AI.
 *
 * Day 01 state: Uses mock/placeholder data to demonstrate the UI structure.
 * All values marked [MOCK] should be replaced with live data in Day 2+.
 *
 * Layout sections:
 *  1. App header (location + date)
 *  2. Main weather hero card (temperature + condition)
 *  3. Weather metrics grid (humidity, wind, UV, rain)
 *  4. Smart Advice section (clothing, umbrella, hydration)
 *  5. Activity scores (Travel Safety, Outdoor Activity)
 *  6. Plant Care recommendation
 *  7. Severe Weather Alerts placeholder
 */

import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { WeatherCard } from '../components/WeatherCard';
import { InfoCard } from '../components/InfoCard';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { getCurrentWeather, getDashboardRecommendations } from '../services/weatherService';
import { getCurrentLocation } from '../services/locationService';
import type { LocationData, WeatherData } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [location, setLocation] = React.useState<LocationData | null>(null);
  const [locationError, setLocationError] = React.useState<string | null>(null);
  const [weather, setWeather] = React.useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = React.useState<string | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = React.useState(false);
  const [recommendationMessage, setRecommendationMessage] = React.useState<string | null>(null);

  const loadLocation = React.useCallback(async () => {
    setLocationError(null);
    try {
      setLocation(await getCurrentLocation());
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : 'Unable to determine your location.');
    }
  }, []);

  React.useEffect(() => {
    void loadLocation();
  }, [loadLocation]);

  const loadWeather = React.useCallback(async (nextLocation: LocationData) => {
    setIsWeatherLoading(true);
    setWeatherError(null);
    try {
      setWeather(await getCurrentWeather(nextLocation.latitude, nextLocation.longitude));
    } catch (error) {
      setWeatherError(error instanceof Error ? error.message : 'Unable to load current weather.');
    } finally {
      setIsWeatherLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (location) void loadWeather(location);
  }, [location, loadWeather]);

  React.useEffect(() => {
    if (!location || !weather) return;

    getDashboardRecommendations(
      {
        label: location.displayName,
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      {
        temperature_c: weather.temperatureC,
        feels_like_c: weather.feelsLikeC,
        humidity_percent: weather.humidity,
        wind_speed_kmh: weather.windSpeedKmh,
        uv_index: weather.uvIndex,
        rain_probability_percent: weather.rainProbability,
        condition: weather.condition,
      },
    )
      .then((response) => setRecommendationMessage(response.recommendations[0]?.message || null))
      .catch(() => setRecommendationMessage(null));
  }, [location, weather]);

      const weatherIcon = weather ? conditionIcon(weather.condition) : '🌥️';

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <ScreenContainer scrollable>
      {/* ------------------------------------------------------------------ */}
      {/* App header                                                           */}
      {/* ------------------------------------------------------------------ */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>WeatherWise AI</Text>
          <Text style={styles.dateText}>{today}</Text>
        </View>
        <View style={styles.locationBadge}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText}>{location?.city || 'Locating...'}</Text>
        </View>
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Hero weather card                                                    */}
      {/* ------------------------------------------------------------------ */}
      {weather ? (
        <Pressable
          style={styles.heroCard}
          onPress={() => navigation.navigate('WeatherDetails')}
          accessibilityRole="button"
          accessibilityLabel="Open weather details"
        >
          <Text style={styles.weatherEmoji}>{weatherIcon}</Text>
          <Text style={styles.temperature}>{weather.temperatureC}°C</Text>
          <Text style={styles.conditionLabel}>{weather.conditionLabel}</Text>
          <Text style={styles.feelsLike}>Feels like {weather.feelsLikeC}°C</Text>
          <Text style={styles.locationFull}>{location?.displayName || 'Current location'}</Text>
        </Pressable>
      ) : (
        <View style={styles.heroCard}>
          {isWeatherLoading ? <ActivityIndicator color={COLORS.white} size="large" /> : <Text style={styles.weatherEmoji}>🌥️</Text>}
          <Text style={styles.loadingTitle}>{isWeatherLoading ? 'Updating weather' : 'Current weather unavailable'}</Text>
          <Text style={styles.locationFull}>{location?.displayName || 'Waiting for your location'}</Text>
        </View>
      )}

      {locationError && (
        <View style={styles.locationError}>
          <Text style={styles.locationErrorText}>{locationError}</Text>
          <Pressable onPress={() => void loadLocation()} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      )}

      {weatherError && (
        <View style={styles.locationError}>
          <Text style={styles.locationErrorText}>{weatherError}</Text>
          {location ? (
            <Pressable onPress={() => void loadWeather(location)} style={styles.retryButton}>
              <Text style={styles.retryText}>Refresh weather</Text>
            </Pressable>
          ) : null}
        </View>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Weather metrics grid                                                 */}
      {/* ------------------------------------------------------------------ */}
      {weather ? (
        <>
          <SectionHeader title="Current Conditions" />
          <View style={styles.metricsGrid}>
            <WeatherCard label="Humidity" value={`${weather.humidity}%`} icon="💧" accentColor={COLORS.info} style={styles.gridItem} />
            <WeatherCard label="Wind" value={`${weather.windSpeedKmh} km/h`} subLabel={weather.windDirection} icon="🌬️" accentColor={COLORS.secondary} style={styles.gridItem} />
            <WeatherCard label="UV Index" value={String(weather.uvIndex)} subLabel={uvLabel(weather.uvIndex)} icon="☀️" accentColor={COLORS.warning} style={styles.gridItem} />
            <WeatherCard label="Rain" value={`${weather.rainProbability}%`} subLabel="Probability" icon="🌧️" accentColor={COLORS.primary} style={styles.gridItem} />
            <WeatherCard label="Visibility" value={`${weather.visibilityKm} km`} icon="👁️" accentColor={COLORS.success} style={styles.gridItem} />
          </View>
        </>
      ) : isWeatherLoading ? (
        <>
          <SectionHeader title="Current Conditions" />
          <View style={styles.metricsGrid}>
            {[1, 2, 3, 4].map((item) => (
              <View key={item} style={[styles.weatherSkeleton, styles.gridItem]} />
            ))}
          </View>
        </>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Smart Advice                                                         */}
      {/* ------------------------------------------------------------------ */}
      <SectionHeader title="Smart Advice" />

      {recommendationMessage ? (
        <InfoCard
          icon="🤖"
          title="AI Weather Advice"
          description={recommendationMessage}
          severity="info"
        />
      ) : null}

      {/* [MOCK] Clothing recommendation */}
      <InfoCard
        icon="👕"
        title="Clothing"
        description="Light, breathable clothing recommended. It will be warm and partly cloudy today."
        severity="info"
      />

      {/* [MOCK] Umbrella recommendation */}
      <InfoCard
        icon="☂️"
        title="Umbrella"
        description="Consider carrying an umbrella — there's a 40% chance of rain this afternoon."
        severity="warning"
      />

      {/* [MOCK] Hydration recommendation */}
      <InfoCard
        icon="🥤"
        title="Hydration"
        description="Stay well hydrated. High humidity and temperature may increase fluid loss."
        severity="success"
      />

      {/* ------------------------------------------------------------------ */}
      {/* Activity scores                                                      */}
      {/* ------------------------------------------------------------------ */}
      <SectionHeader title="Activity Scores" />

      {/* [MOCK] Travel safety score */}
      <InfoCard
        icon="🚗"
        title="Travel Safety"
        description="Moderate conditions. Exercise caution if travelling during afternoon showers."
        severity="warning"
        score={68}
      />

      {/* [MOCK] Outdoor activity score */}
      <InfoCard
        icon="🏃"
        title="Outdoor Activity"
        description="Generally good conditions for outdoor activity. Avoid peak UV hours (10am–2pm)."
        severity="success"
        score={75}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Plant care                                                           */}
      {/* ------------------------------------------------------------------ */}
      <SectionHeader title="Plant Care" />
      <InfoCard
        icon="🌿"
        title="Plant Care"
        description="Natural rainfall expected. You may not need to water outdoor plants today."
        severity="success"
      />

      {/* ------------------------------------------------------------------ */}
      {/* Severe weather alerts                                                */}
      {/* ------------------------------------------------------------------ */}
      <SectionHeader title="Severe Weather Alerts" />
      <View style={styles.noAlertBanner}>
        <Text style={styles.noAlertIcon}>✅</Text>
        <Text style={styles.noAlertText}>No active severe weather alerts for your area.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.m,
  },
  appName: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.extraBold,
    color: COLORS.textPrimary,
  },
  dateText: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.s,
    paddingVertical: SPACING.xs,
    gap: 4,
  },
  locationIcon: {
    fontSize: 14,
  },
  locationText: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  locationError: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: BORDER_RADIUS.m,
    marginBottom: SPACING.m,
    padding: SPACING.m,
  },
  locationErrorText: {
    color: COLORS.danger,
    fontSize: TYPOGRAPHY.fontSize.s,
    lineHeight: 20,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: SPACING.s,
    paddingVertical: SPACING.xs,
  },
  retryText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.s,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },

  // Hero card
  heroCard: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.m,
    ...SHADOWS.card,
  },
  weatherEmoji: {
    fontSize: 64,
    marginBottom: SPACING.s,
  },
  temperature: {
    fontSize: TYPOGRAPHY.fontSize.display,
    fontWeight: TYPOGRAPHY.fontWeight.extraBold,
    color: COLORS.white,
  },
  conditionLabel: {
    fontSize: TYPOGRAPHY.fontSize.l,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primaryLight,
    marginTop: SPACING.xs,
  },
  feelsLike: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.primaryLight,
    marginTop: SPACING.xs,
    opacity: 0.85,
  },
  locationFull: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.primaryLight,
    marginTop: SPACING.xs,
    opacity: 0.7,
  },

  // Metrics grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.s,
    marginBottom: SPACING.xs,
  },
  gridItem: {
    flex: 1,
    minWidth: '45%',
  },
  weatherSkeleton: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.m,
    minHeight: 126,
    opacity: 0.7,
  },

  // No-alert banner
  noAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    borderRadius: BORDER_RADIUS.m,
    padding: SPACING.m,
    gap: SPACING.s,
    marginBottom: SPACING.s,
  },
  noAlertIcon: {
    fontSize: 20,
  },
  noAlertText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  loadingTitle: {
    fontSize: TYPOGRAPHY.fontSize.l,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.white,
    marginTop: SPACING.m,
  },
});

function conditionIcon(condition: WeatherData['condition']): string {
  return {
    sunny: '☀️',
    'partly-cloudy': '⛅',
    cloudy: '☁️',
    rainy: '🌧️',
    stormy: '⛈️',
    snowy: '🌨️',
    foggy: '🌫️',
    windy: '🌬️',
    unknown: '🌥️',
  }[condition];
}

function uvLabel(uvIndex: number): string {
  if (uvIndex >= 11) return 'Extreme';
  if (uvIndex >= 8) return 'Very High';
  if (uvIndex >= 6) return 'High';
  if (uvIndex >= 3) return 'Moderate';
  return 'Low';
}
