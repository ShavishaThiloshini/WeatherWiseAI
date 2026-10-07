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
import { useFocusEffect, useNavigation, type CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { WeatherCard } from '../components/WeatherCard';
import { ClothingRecommendationCard } from '../components/ClothingRecommendationCard';
import { InfoCard } from '../components/InfoCard';
import { ActivityRecommendationCard } from '../components/ActivityRecommendationCard';
import { HydrationHeatWarningCard } from '../components/HydrationHeatWarningCard';
import { HeavyRainAlertCard } from '../components/HeavyRainAlertCard';
import { HeatWarningCard } from '../components/HeatWarningCard';
import { ColdWeatherWarningCard } from '../components/ColdWeatherWarningCard';
import { SevereWeatherAlerts } from '../components/SevereWeatherAlerts';
import type { ActivityRecommendation } from '../components/ActivityRecommendationCard';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { getActivityRecommendations, getCurrentWeather, getDashboardRecommendations, getForecast, toRecommendationForecast, getHeatWarningData, getSevereWeatherAlerts } from '../services/weatherService';
import { getCurrentLocation, listSavedLocations } from '../services/locationService';
import type { ForecastData, LocationData, RecommendationResponse, WeatherData, HeatData, SevereWeatherData } from '../types';
import type { RootStackParamList, RootTabParamList } from '../navigation/RootNavigator';
import { buildFallbackSmartAdviceCards, findSmartAdviceCards } from '../utils/smartAdvice';

const ACTIVITY_PLACEHOLDERS: ActivityRecommendation[] = [
  { activityId: 'walking', activityName: 'Walking', icon: '🚶', score: null, suitability: 'moderate', recommendation: 'Recommendation unavailable.' },
  { activityId: 'running', activityName: 'Running', icon: '🏃', score: null, suitability: 'moderate', recommendation: 'Recommendation unavailable.' },
  { activityId: 'cycling', activityName: 'Cycling', icon: '🚴', score: null, suitability: 'moderate', recommendation: 'Recommendation unavailable.' },
];

export function HomeScreen() {
  const navigation = useNavigation<CompositeNavigationProp<
    BottomTabNavigationProp<RootTabParamList, 'Home'>,
    NativeStackNavigationProp<RootStackParamList>
  >>();
  const [location, setLocation] = React.useState<LocationData | null>(null);
  const [locationError, setLocationError] = React.useState<string | null>(null);
  const [weather, setWeather] = React.useState<WeatherData | null>(null);
  const [forecast, setForecast] = React.useState<ForecastData | null>(null);
  const [weatherError, setWeatherError] = React.useState<string | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = React.useState(false);
  const [recommendations, setRecommendations] = React.useState<RecommendationResponse['recommendations']>([]);
  const [recommendationAnalysis, setRecommendationAnalysis] = React.useState<RecommendationResponse['analysis'] | null>(null);
  const [activityRecommendations, setActivityRecommendations] = React.useState<ActivityRecommendation[]>([]);
  const [activityLoading, setActivityLoading] = React.useState(false);
  const [activityError, setActivityError] = React.useState<string | null>(null);
  const [heatData, setHeatData] = React.useState<HeatData | null>(null);
  const [heatLoading, setHeatLoading] = React.useState(false);
  const [heatError, setHeatError] = React.useState<string | null>(null);
  const [severeWeatherData, setSevereWeatherData] = React.useState<SevereWeatherData | null>(null);
  const [severeWeatherLoading, setSevereWeatherLoading] = React.useState(false);
  const [severeWeatherError, setSevereWeatherError] = React.useState<string | null>(null);

  const loadLocation = React.useCallback(async () => {
    setLocationError(null);
    let savedLocationsUnavailable = false;
    try {
      const savedLocations = await listSavedLocations();
      const defaultLocation = savedLocations.find((savedLocation) => savedLocation.isDefault);
      if (defaultLocation) {
        setLocation({
          latitude: defaultLocation.latitude,
          longitude: defaultLocation.longitude,
          city: defaultLocation.label,
          region: '',
          country: '',
          displayName: defaultLocation.label,
        });
        return;
      }
    } catch {
      savedLocationsUnavailable = true;
    }
    try {
      setLocation(await getCurrentLocation());
      if (savedLocationsUnavailable) {
        setLocationError('Saved locations could not be loaded. Showing your current location instead.');
      }
    } catch (error) {
      const locationMessage = error instanceof Error ? error.message : 'Unable to determine your location.';
      setLocationError(savedLocationsUnavailable
        ? `Saved locations could not be loaded. ${locationMessage}`
        : locationMessage);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadLocation();
    }, [loadLocation]),
  );

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

  const loadActivityRecommendations = React.useCallback(async (nextLocation: LocationData) => {
    setActivityLoading(true);
    setActivityError(null);
    setActivityRecommendations([]);
    try {
      setActivityRecommendations(await getActivityRecommendations(nextLocation.latitude, nextLocation.longitude));
    } catch (error) {
      setActivityError(error instanceof Error ? error.message : 'Unable to load activity recommendations.');
    } finally {
      setActivityLoading(false);
    }
  }, []);

  const loadHeatData = React.useCallback(async (nextLocation: LocationData) => {
    setHeatLoading(true);
    setHeatError(null);
    try {
      const data = await getHeatWarningData(nextLocation.latitude, nextLocation.longitude);
      setHeatData(data);
    } catch (error) {
      setHeatError(error instanceof Error ? error.message : 'Unable to load heat data.');
    } finally {
      setHeatLoading(false);
    }
  }, []);

  const loadSevereWeather = React.useCallback(async (nextLocation: LocationData) => {
    setSevereWeatherLoading(true);
    setSevereWeatherError(null);
    try {
      const data = await getSevereWeatherAlerts(nextLocation.latitude, nextLocation.longitude);
      setSevereWeatherData(data);
    } catch (error) {
      setSevereWeatherError(error instanceof Error ? error.message : 'Unable to load severe weather alerts.');
    } finally {
      setSevereWeatherLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (location) {
      void loadWeather(location);
      void loadActivityRecommendations(location);
      void loadHeatData(location);
      void loadSevereWeather(location);
    }
  }, [location, loadWeather, loadActivityRecommendations, loadHeatData, loadSevereWeather]);

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
      .then((response) => {
        setRecommendations(response.recommendations);
        setRecommendationAnalysis(response.analysis);
      })
      .catch(() => {
        const fallback = buildFallbackSmartAdviceCards(weather);
        setRecommendations(fallback);
        setRecommendationAnalysis({
          risks: {
            general: 'fallback',
            heat: weather && (weather.temperatureC >= 32 || weather.humidity >= 80 || weather.uvIndex >= 8) ? 'high' : 'low',
          },
          summary: 'Local recommendation service unavailable, showing offline fallback guidance.',
        });
      });
  }, [forecast, location, weather]);

  const weatherIcon = weather ? conditionIcon(weather.condition) : '🌥️';
  const smartAdvice = findSmartAdviceCards(recommendations);
  const clothingRecommendation = smartAdvice.clothing ?? null;
  const umbrellaRecommendation = smartAdvice.umbrella ?? null;
  const hydrationRecommendation = smartAdvice.hydration ?? null;
  const heatRecommendation = recommendations.find((recommendation) => recommendation.id === 'heat-caution-01');
  const heatRisk = recommendationAnalysis?.risks && typeof recommendationAnalysis.risks === 'object'
    ? (recommendationAnalysis.risks as { heat?: unknown }).heat
    : undefined;
  const generalRecommendation = smartAdvice.general ?? smartAdvice.primarySummary ?? null;

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

      {generalRecommendation ? (
        <InfoCard
          icon="🤖"
          title={generalRecommendation.title || 'AI Weather Advice'}
          description={generalRecommendation.message || generalRecommendation.description || 'Weather guidance is available.'}
          severity={generalRecommendation.severity ?? 'info'}
        />
      ) : null}

      <ClothingRecommendationCard
        recommendation={clothingRecommendation}
        weather={weather}
      />

      {umbrellaRecommendation ? (
        <InfoCard
          icon="☂️"
          title={umbrellaRecommendation.title || 'Umbrella'}
          description={umbrellaRecommendation.message || umbrellaRecommendation.description || 'Carry an umbrella if you are heading out.'}
          severity={umbrellaRecommendation.severity ?? 'info'}
        />
      ) : weather && weather.rainProbability >= 40 ? (
        <InfoCard
          icon="☂️"
          title="Umbrella"
          description={`Consider carrying an umbrella — there's a ${weather.rainProbability}% chance of rain this afternoon.`}
          severity="warning"
        />
      ) : null}

      <HydrationHeatWarningCard
        recommendation={hydrationRecommendation}
        heatRecommendation={heatRecommendation}
        weather={weather}
        heatRisk={typeof heatRisk === 'string' ? heatRisk : null}
      />

      <SectionHeader title="Cold Weather" />
      <ColdWeatherWarningCard weather={weather} forecast={forecast} />

      <SectionHeader title="Outdoor Activity" />

      {(activityRecommendations.length ? activityRecommendations : ACTIVITY_PLACEHOLDERS).map((rec) => (
        <ActivityRecommendationCard
          key={rec.activityId}
          recommendation={rec}
          loading={activityLoading}
          error={activityError}
        />
      ))}

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
      <SevereWeatherAlerts
        loading={severeWeatherLoading}
        error={severeWeatherError}
        data={severeWeatherData}
        onRetry={() => {
          if (location) void loadSevereWeather(location);
        }}
      />
      <HeavyRainAlertCard
        weather={weather}
        forecast={forecast}
        onPress={() => navigation.navigate('Forecast')}
      />
      <HeatWarningCard 
        loading={heatLoading}
        error={heatError}
        heatData={heatData}
        onRetry={() => {
          if (location) void loadHeatData(location);
        }}
      />
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
