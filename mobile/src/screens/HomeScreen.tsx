/**
 * screens/HomeScreen.tsx
 * Redesigned Home screen for WeatherWise AI with Liquid Glass UI.
 */

import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SectionHeader } from '../components/SectionHeader';
import { InfoCard } from '../components/InfoCard';
import { LiquidHeader } from '../components/LiquidHeader';
import { GlassCard } from '../components/GlassCard';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/theme';
import { getCurrentWeather, getDashboardRecommendations, getForecast, toRecommendationForecast } from '../services/weatherService';
import { getCurrentLocation } from '../services/locationService';
import type { ForecastData, LocationData, WeatherData } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [location, setLocation] = React.useState<LocationData | null>(null);
  const [locationError, setLocationError] = React.useState<string | null>(null);
  const [weather, setWeather] = React.useState<WeatherData | null>(null);
  const [forecast, setForecast] = React.useState<ForecastData | null>(null);
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
      try {
        setForecast(await getForecast(nextLocation.latitude, nextLocation.longitude));
      } catch {
        setForecast(null);
      }
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
      forecast ? toRecommendationForecast(forecast) : undefined,
    )
      .then((response) => setRecommendationMessage(response.recommendations[0]?.message || null))
      .catch(() => setRecommendationMessage(null));
  }, [forecast, location, weather]);

  const weatherIcon = weather ? conditionIcon(weather.condition) : '🌥️';

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#1a2a6c', '#112240', '#0a192f']}
        style={StyleSheet.absoluteFill}
      />
      <LiquidHeader locationName={location?.city || 'Locating...'} dateString={today} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ------------------------------------------------------------------ */}
        {/* Hero weather card (Glassy)                                         */}
        {/* ------------------------------------------------------------------ */}
        {weather ? (
          <Pressable onPress={() => navigation.navigate('WeatherDetails')}>
            <GlassCard style={styles.heroCard} intensity={40}>
              <Text style={styles.weatherEmoji}>{weatherIcon}</Text>
              <View style={styles.tempRow}>
                <AnimatedCounter value={weather.temperatureC} style={styles.temperature} suffix="°C" />
              </View>
              <Text style={styles.conditionLabel}>{weather.conditionLabel}</Text>
              <View style={styles.feelsLikeRow}>
                <Text style={styles.feelsLike}>Feels like </Text>
                <AnimatedCounter value={weather.feelsLikeC} style={styles.feelsLikeNumber} suffix="°C" />
              </View>
              <Text style={styles.locationFull}>{location?.displayName || 'Current location'}</Text>
            </GlassCard>
          </Pressable>
        ) : (
          <GlassCard style={styles.heroCard} intensity={20}>
            {isWeatherLoading ? <ActivityIndicator color={COLORS.white} size="large" /> : <Text style={styles.weatherEmoji}>🌥️</Text>}
            <Text style={styles.loadingTitle}>{isWeatherLoading ? 'Updating weather' : 'Current weather unavailable'}</Text>
            <Text style={styles.locationFull}>{location?.displayName || 'Waiting for your location'}</Text>
          </GlassCard>
        )}

        {locationError && (
          <GlassCard style={styles.locationError}>
            <Text style={styles.locationErrorText}>{locationError}</Text>
            <Pressable onPress={() => void loadLocation()} style={styles.retryButton}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </GlassCard>
        )}

        {weatherError && (
          <GlassCard style={styles.locationError}>
            <Text style={styles.locationErrorText}>{weatherError}</Text>
            {location ? (
              <Pressable onPress={() => void loadWeather(location)} style={styles.retryButton}>
                <Text style={styles.retryText}>Refresh weather</Text>
              </Pressable>
            ) : null}
          </GlassCard>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Weather metrics grid (Glassy)                                      */}
        {/* ------------------------------------------------------------------ */}
        {weather ? (
          <>
            <SectionHeader title="Current Conditions" style={{ color: COLORS.white }} />
            <View style={styles.metricsGrid}>
              <GlassCard style={styles.gridItem}>
                <Text style={styles.metricIcon}>💧</Text>
                <Text style={styles.metricLabel}>Humidity</Text>
                <AnimatedCounter value={weather.humidity} style={styles.metricValue} suffix="%" />
              </GlassCard>
              <GlassCard style={styles.gridItem}>
                <Text style={styles.metricIcon}>🌬️</Text>
                <Text style={styles.metricLabel}>Wind</Text>
                <AnimatedCounter value={weather.windSpeedKmh} style={styles.metricValue} suffix=" km/h" />
                <Text style={styles.metricSub}>{weather.windDirection}</Text>
              </GlassCard>
              <GlassCard style={styles.gridItem}>
                <Text style={styles.metricIcon}>☀️</Text>
                <Text style={styles.metricLabel}>UV Index</Text>
                <AnimatedCounter value={weather.uvIndex} style={styles.metricValue} />
                <Text style={styles.metricSub}>{uvLabel(weather.uvIndex)}</Text>
              </GlassCard>
              <GlassCard style={styles.gridItem}>
                <Text style={styles.metricIcon}>🌧️</Text>
                <Text style={styles.metricLabel}>Rain</Text>
                <AnimatedCounter value={weather.rainProbability} style={styles.metricValue} suffix="%" />
                <Text style={styles.metricSub}>Probability</Text>
              </GlassCard>
            </View>
          </>
        ) : isWeatherLoading ? (
          <>
            <SectionHeader title="Current Conditions" style={{ color: COLORS.white }} />
            <View style={styles.metricsGrid}>
              {[1, 2, 3, 4].map((item) => (
                <GlassCard key={item} style={styles.gridItemSkeleton} />
              ))}
            </View>
          </>
        ) : null}

        {/* ------------------------------------------------------------------ */}
        {/* Smart Advice                                                         */}
        {/* ------------------------------------------------------------------ */}
        <SectionHeader title="Smart Advice" style={{ color: COLORS.white }} />

        {recommendationMessage ? (
          <GlassCard style={styles.infoCardWrapper}>
            <InfoCard icon="🤖" title="AI Weather Advice" description={recommendationMessage} severity="info" />
          </GlassCard>
        ) : null}

        <GlassCard style={styles.infoCardWrapper}>
          <InfoCard icon="👕" title="Clothing" description="Light, breathable clothing recommended. It will be warm and partly cloudy today." severity="info" />
        </GlassCard>

        <GlassCard style={styles.infoCardWrapper}>
          <InfoCard icon="☂️" title="Umbrella" description="Consider carrying an umbrella — there's a 40% chance of rain this afternoon." severity="warning" />
        </GlassCard>

        {/* ------------------------------------------------------------------ */}
        {/* Activity scores                                                      */}
        {/* ------------------------------------------------------------------ */}
        <SectionHeader title="Activity Scores" style={{ color: COLORS.white }} />

        <GlassCard style={styles.infoCardWrapper}>
          <InfoCard icon="🚗" title="Travel Safety" description="Moderate conditions. Exercise caution if travelling during afternoon showers." severity="warning" score={68} />
        </GlassCard>

        <GlassCard style={styles.infoCardWrapper}>
          <InfoCard icon="🏃" title="Outdoor Activity" description="Generally good conditions for outdoor activity. Avoid peak UV hours (10am–2pm)." severity="success" score={75} />
        </GlassCard>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a192f',
  },
  scrollContent: {
    padding: SPACING.m,
    paddingBottom: 100,
  },
  locationError: {
    marginBottom: SPACING.m,
    borderColor: COLORS.danger,
    borderWidth: 1,
  },
  locationErrorText: {
    color: '#ff6b6b',
    fontSize: TYPOGRAPHY.fontSize.s,
    lineHeight: 20,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: SPACING.s,
    paddingVertical: SPACING.xs,
  },
  retryText: {
    color: COLORS.primaryLight,
    fontSize: TYPOGRAPHY.fontSize.s,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },

  // Hero card
  heroCard: {
    alignItems: 'center',
    marginBottom: SPACING.m,
    paddingVertical: SPACING.xl,
  },
  weatherEmoji: {
    fontSize: 72,
    marginBottom: SPACING.s,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  temperature: {
    fontSize: 64,
    fontWeight: TYPOGRAPHY.fontWeight.extraBold,
    color: COLORS.white,
    height: 75,
  },
  conditionLabel: {
    fontSize: TYPOGRAPHY.fontSize.l,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: SPACING.xs,
  },
  feelsLikeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  feelsLike: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  feelsLikeNumber: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: 'bold',
  },
  locationFull: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: SPACING.s,
  },

  // Metrics grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.s,
    marginBottom: SPACING.m,
  },
  gridItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: SPACING.l,
  },
  gridItemSkeleton: {
    flex: 1,
    minWidth: '45%',
    height: 140,
  },
  metricIcon: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  metricLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: TYPOGRAPHY.fontSize.l,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  metricSub: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  
  infoCardWrapper: {
    marginBottom: SPACING.m,
    padding: 0, 
    // InfoCard already has internal padding, we wrap it purely for the glass effect
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
