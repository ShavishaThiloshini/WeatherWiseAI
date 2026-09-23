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
import { ClothingRecommendationCard } from '../components/ClothingRecommendationCard';
import { InfoCard } from '../components/InfoCard';
import { ActivityRecommendationCard } from '../components/ActivityRecommendationCard';
import { HydrationHeatWarningCard } from '../components/HydrationHeatWarningCard';
import type { ActivityRecommendation } from '../components/ActivityRecommendationCard';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { getCurrentWeather, getDashboardRecommendations, getForecast, toRecommendationForecast } from '../services/weatherService';
import { getCurrentLocation } from '../services/locationService';
import type { ForecastData, LocationData, RecommendationResponse, WeatherData } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { buildFallbackSmartAdviceCards, findSmartAdviceCards } from '../utils/smartAdvice';


// ---------------------------------------------------------------------------
// [MOCK] Activity recommendations helper
// Seeded from live weather to give realistic output while the AI endpoint
// for activity scoring is pending. Replace this function body with an API
// call to /api/v1/activity (or similar) when available.
// ---------------------------------------------------------------------------
function buildActivityRecommendations(weather: WeatherData | null): ActivityRecommendation[] {
  const ctx = weather
    ? {
        temperatureC: weather.temperatureC,
        feelsLikeC: weather.feelsLikeC,
        rainProbability: weather.rainProbability,
        windSpeedKmh: weather.windSpeedKmh,
        uvIndex: weather.uvIndex,
      }
    : null;

  const t = weather?.feelsLikeC ?? weather?.temperatureC ?? 20;
  const rain = weather?.rainProbability ?? 0;
  const wind = weather?.windSpeedKmh ?? 0;
  const uv = weather?.uvIndex ?? 0;

  // Derive simple suitability and score values from current conditions.
  // These are intentional mock heuristics — the AI layer will replace them.
  function walkingSuitability(): { suitability: ActivityRecommendation['suitability']; score: number; rec: string; reason: string } {
    if (rain >= 80 || wind >= 60) return { suitability: 'avoid', score: 20, rec: 'Avoid walking today due to severe conditions.', reason: 'High rain probability or strong winds make walking unsafe.' };
    if (rain >= 60 || wind >= 40 || t >= 38) return { suitability: 'poor', score: 38, rec: 'Walking is less suitable right now.', reason: 'Conditions are uncomfortable — consider a short outing only.' };
    if (rain >= 40 || t >= 34 || uv >= 8) return { suitability: 'moderate', score: 55, rec: 'Walking is possible. Take precautions.', reason: 'Rain risk or heat — go early or late, carry water and an umbrella.' };
    if (t >= 26 || uv >= 6) return { suitability: 'good', score: 72, rec: 'Good conditions for a walk.', reason: 'Warm weather — best done before 10 am or after 4 pm to avoid peak UV.' };
    return { suitability: 'excellent', score: 90, rec: 'Great conditions for walking!', reason: 'Comfortable temperature, low rain risk and manageable UV levels.' };
  }

  function runningSuitability(): { suitability: ActivityRecommendation['suitability']; score: number; rec: string; reason: string } {
    if (rain >= 80 || wind >= 60) return { suitability: 'avoid', score: 15, rec: 'Avoid running in these conditions.', reason: 'Severe rain or strong winds present a safety risk.' };
    if (rain >= 60 || wind >= 40 || t >= 35) return { suitability: 'poor', score: 32, rec: 'Running is not ideal today.', reason: 'Heavy rain or extreme heat will negatively affect performance and safety.' };
    if (rain >= 40 || t >= 30 || uv >= 8) return { suitability: 'moderate', score: 50, rec: 'Running is possible with care.', reason: 'Hydrate well, wear sunscreen, and avoid peak heat hours.' };
    if (t >= 24 || uv >= 6) return { suitability: 'good', score: 68, rec: 'Good running conditions.', reason: 'Warm day — go early morning for the best experience.' };
    return { suitability: 'excellent', score: 88, rec: 'Excellent running conditions!', reason: 'Cool, low-risk weather makes this a great time to run.' };
  }

  function cyclingSuitability(): { suitability: ActivityRecommendation['suitability']; score: number; rec: string; reason: string } {
    if (wind >= 60 || rain >= 80) return { suitability: 'avoid', score: 10, rec: 'Do not cycle in these conditions.', reason: 'High winds or heavy rain create serious road hazards for cyclists.' };
    if (wind >= 40 || rain >= 60 || t >= 37) return { suitability: 'poor', score: 28, rec: 'Cycling is not recommended today.', reason: 'Strong crosswinds, wet roads or extreme heat make cycling risky.' };
    if (wind >= 25 || rain >= 40 || t >= 32 || uv >= 8) return { suitability: 'moderate', score: 52, rec: 'Cycle with caution.', reason: 'Elevated wind, rain chance or UV — wear protective gear and plan your route carefully.' };
    if (wind >= 15 || t >= 26) return { suitability: 'good', score: 74, rec: 'Good cycling conditions.', reason: 'Light breeze and warm weather — stay hydrated and wear a helmet.' };
    return { suitability: 'excellent', score: 92, rec: 'Perfect day for cycling!', reason: 'Calm winds and comfortable temperatures make for an enjoyable ride.' };
  }

  const walking = walkingSuitability();
  const running = runningSuitability();
  const cycling = cyclingSuitability();

  return [
    {
      activityId: 'walking',
      activityName: 'Walking',
      icon: '🚶',
      score: weather ? walking.score : null,
      suitability: walking.suitability,
      recommendation: walking.rec,
      reason: walking.reason,
      weatherContext: ctx,
    },
    {
      activityId: 'running',
      activityName: 'Running',
      icon: '🏃',
      score: weather ? running.score : null,
      suitability: running.suitability,
      recommendation: running.rec,
      reason: running.reason,
      weatherContext: ctx,
    },
    {
      activityId: 'cycling',
      activityName: 'Cycling',
      icon: '🚴',
      score: weather ? cycling.score : null,
      suitability: cycling.suitability,
      recommendation: cycling.rec,
      reason: cycling.reason,
      weatherContext: ctx,
    },
  ];
}

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [location, setLocation] = React.useState<LocationData | null>(null);
  const [locationError, setLocationError] = React.useState<string | null>(null);
  const [weather, setWeather] = React.useState<WeatherData | null>(null);
  const [forecast, setForecast] = React.useState<ForecastData | null>(null);
  const [weatherError, setWeatherError] = React.useState<string | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = React.useState(false);
  const [recommendations, setRecommendations] = React.useState<RecommendationResponse['recommendations']>([]);
  const [recommendationAnalysis, setRecommendationAnalysis] = React.useState<RecommendationResponse['analysis'] | null>(null);

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

      {/* ------------------------------------------------------------------ */}
      {/* Outdoor Activity Recommendations — Day 14                           */}
      {/* Mock data seeded from live weather; replace with AI endpoint later. */}
      {/* ------------------------------------------------------------------ */}
      <SectionHeader title="Outdoor Activity" />

      {buildActivityRecommendations(weather).map((rec) => (
        <ActivityRecommendationCard
          key={rec.activityId}
          recommendation={rec}
          loading={isWeatherLoading}
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
