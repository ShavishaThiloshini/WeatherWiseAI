/**
 * screens/HomeScreen.tsx
 * Main Home Dashboard for WeatherWise AI.
 *
 * Day 27 Integration:
 *  - Live weather data fetched from Open-Meteo via getCurrentWeather()
 *  - Smart Advice + Alerts from the backend AI dashboard via getDashboardRecommendations()
 *  - Loading, error, and empty states per UIUXDesignBrief §8
 *
 * Layout sections:
 *  1. App header (location + date)
 *  2. Hero weather card (temperature + condition) → taps to WeatherDetails
 *  3. Location error banner (if permission denied)
 *  4. Weather metrics grid (humidity, wind, UV, rain)
 *  5. Rain information card
 *  6. Smart Advice section (from backend AI engine)
 *  7. Activity scores (from backend AI engine)
 *  8. Plant Care recommendation (from backend AI engine)
 *  9. Severe Weather Alerts banner (from backend AI engine)
 */

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { WeatherCard } from '../components/WeatherCard';
import { InfoCard } from '../components/InfoCard';
import { ErrorView, EmptyView } from '../components/StateViews';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { getCurrentWeather, getDashboardRecommendations } from '../services/weatherService';
import { getCurrentLocation } from '../services/locationService';
import type { LocationData, WeatherData, RecommendationResponse, RecommendationSeverity } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

type DashboardState = 'loading' | 'success' | 'error' | 'empty';

// ---------------------------------------------------------------------------
// Weather condition → emoji mapping
// ---------------------------------------------------------------------------

const CONDITION_EMOJI: Record<string, string> = {
  sunny: '☀️',
  'partly-cloudy': '⛅',
  cloudy: '☁️',
  rainy: '🌧️',
  stormy: '⛈️',
  snowy: '❄️',
  foggy: '🌫️',
  windy: '💨',
  unknown: '🌡️',
};

// ---------------------------------------------------------------------------
// Alert severity → style colours
// ---------------------------------------------------------------------------

function alertSeverityStyle(severity: string) {
  if (severity === 'high' || severity === 'emergency' || severity === 'warning') {
    return { bg: COLORS.dangerLight, border: COLORS.danger, text: COLORS.danger, icon: '🔴' };
  }
  if (severity === 'medium' || severity === 'watch') {
    return { bg: COLORS.warningLight, border: COLORS.warning, text: COLORS.warning, icon: '🟡' };
  }
  return { bg: COLORS.infoLight, border: COLORS.info, text: COLORS.info, icon: '🔵' };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [dashboardState, setDashboardState] = React.useState<DashboardState>('loading');
  const [location, setLocation] = React.useState<LocationData | null>(null);
  const [locationError, setLocationError] = React.useState<string | null>(null);
  const [weather, setWeather] = React.useState<WeatherData | null>(null);
  const [dashboard, setDashboard] = React.useState<RecommendationResponse | null>(null);
  const [dashboardError, setDashboardError] = React.useState<string | null>(null);

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // ---- Load location + weather ----
  const loadWeather = React.useCallback(async () => {
    setDashboardState('loading');
    setLocationError(null);
    setDashboardError(null);

    try {
      const loc = await getCurrentLocation();
      setLocation(loc);

      const liveWeather = await getCurrentWeather(loc.latitude, loc.longitude);
      setWeather(liveWeather);
      setDashboardState('success');

      // Fire-and-forget dashboard recommendations after weather loads.
      getDashboardRecommendations(
        {
          label: loc.displayName,
          latitude: loc.latitude,
          longitude: loc.longitude,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        {
          temperature_c: liveWeather.temperatureC,
          feels_like_c: liveWeather.feelsLikeC,
          humidity_percent: liveWeather.humidity,
          wind_speed_kmh: liveWeather.windSpeedKmh,
          uv_index: liveWeather.uvIndex,
          rain_probability_percent: liveWeather.rainProbability,
          condition: liveWeather.condition,
        },
      )
        .then(setDashboard)
        .catch((err) => setDashboardError(err instanceof Error ? err.message : null));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load weather.';
      if (message.includes('Location permission') || message.includes('location')) {
        setLocationError(message);
        // Still show the dashboard in error-with-location-info state
        setDashboardState('error');
      } else {
        setDashboardState('error');
      }
    }
  }, []);

  React.useEffect(() => {
    void loadWeather();
  }, [loadWeather]);

  // ---- Derive recommendations from dashboard response ----
  const recommendations = dashboard?.recommendations ?? [];
  const alerts = dashboard?.alerts ?? [];

  const smartAdvice = recommendations.filter((r) =>
    ['clothing', 'umbrella', 'hydration'].includes(r.category),
  );
  const activityAdvice = recommendations.filter((r) =>
    ['outdoor', 'travel'].includes(r.category),
  );
  const plantAdvice = recommendations.find((r) => r.category === 'plant-care');

  // ---- Loading state ----
  if (dashboardState === 'loading') {
    return (
      <ScreenContainer scrollable>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading weather information…</Text>
        </View>
      </ScreenContainer>
    );
  }

  // ---- Error state (no weather at all) ----
  if (dashboardState === 'error' && !weather) {
    return (
      <ScreenContainer scrollable>
        <ErrorView
          message={locationError || 'Unable to load weather. Please check your connection and try again.'}
          onRetry={() => { void loadWeather(); }}
        />
      </ScreenContainer>
    );
  }

  // ---- Success (or partial success with location error) ----
  const w = weather;
  const conditionEmoji = CONDITION_EMOJI[w?.condition ?? 'unknown'] ?? '🌡️';

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
          <Text style={styles.locationText} numberOfLines={1}>
            {location?.city ?? 'Locating…'}
          </Text>
        </View>
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Active alert banner (shown above hero if any active alert)          */}
      {/* ------------------------------------------------------------------ */}
      {alerts.length > 0 && (() => {
        const topAlert = alerts[0] as Record<string, string>;
        const sStyle = alertSeverityStyle(String(topAlert.severity ?? ''));
        return (
          <View style={[styles.alertBanner, { backgroundColor: sStyle.bg, borderColor: sStyle.border }]}>
            <Text style={styles.alertBannerIcon}>{sStyle.icon}</Text>
            <View style={styles.alertBannerBody}>
              <Text style={[styles.alertBannerTitle, { color: sStyle.text }]}>
                {String(topAlert.title ?? topAlert.alert_type ?? 'Weather Alert')}
              </Text>
              {topAlert.reason ? (
                <Text style={styles.alertBannerReason} numberOfLines={2}>
                  {String(topAlert.reason)}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })()}

      {/* ------------------------------------------------------------------ */}
      {/* Hero weather card                                                    */}
      {/* ------------------------------------------------------------------ */}
      <Pressable style={styles.heroCard} onPress={() => navigation.navigate('WeatherDetails')}>
        <Text style={styles.weatherEmoji}>{conditionEmoji}</Text>
        {w ? (
          <>
            <Text style={styles.temperature}>{w.temperatureC}°C</Text>
            <Text style={styles.conditionLabel}>{w.conditionLabel}</Text>
            <Text style={styles.feelsLike}>Feels like {w.feelsLikeC}°C</Text>
          </>
        ) : (
          <Text style={styles.conditionLabel}>Weather unavailable</Text>
        )}
        <Text style={styles.locationFull}>{location?.displayName ?? 'Finding your location…'}</Text>
      </Pressable>

      {/* Location permission error */}
      {locationError && (
        <View style={styles.locationError}>
          <Text style={styles.locationErrorText}>{locationError}</Text>
          <Pressable
            onPress={() => { void loadWeather(); }}
            style={styles.retryButton}
            accessibilityRole="button"
            accessibilityLabel="Retry location detection"
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Weather metrics grid                                                 */}
      {/* ------------------------------------------------------------------ */}
      {w && (
        <>
          <SectionHeader title="Current Conditions" />
          <View style={styles.metricsGrid}>
            <WeatherCard label="Humidity" value={`${w.humidity}%`} icon="💧" style={styles.gridItem} />
            <WeatherCard
              label="Wind"
              value={`${w.windSpeedKmh} km/h`}
              subLabel={w.windDirection}
              icon="🌬️"
              style={styles.gridItem}
            />
            <WeatherCard
              label="UV Index"
              value={String(w.uvIndex)}
              subLabel={w.uvIndex >= 8 ? 'Very High' : w.uvIndex >= 6 ? 'High' : w.uvIndex >= 3 ? 'Moderate' : 'Low'}
              icon="☀️"
              style={styles.gridItem}
            />
            <WeatherCard
              label="Rain"
              value={`${w.rainProbability}%`}
              subLabel="Probability"
              icon="🌧️"
              style={styles.gridItem}
            />
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* Rain information card                                             */}
          {/* ---------------------------------------------------------------- */}
          <SectionHeader title="Rain Information" />
          <View style={styles.rainCard}>
            <Text style={styles.rainIcon}>🌧️</Text>
            <View style={styles.rainInfo}>
              <Text style={styles.rainTitle}>Rain Probability</Text>
              <Text style={styles.rainValue}>{w.rainProbability}%</Text>
              <Text style={styles.rainTiming}>
                {w.rainProbability >= 70
                  ? 'Rain is very likely today — carry an umbrella.'
                  : w.rainProbability >= 40
                  ? 'Some chance of rain — consider carrying an umbrella.'
                  : 'Low chance of rain today.'}
              </Text>
            </View>
          </View>
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Smart Advice (from backend AI engine)                               */}
      {/* ------------------------------------------------------------------ */}
      <SectionHeader title="Smart Advice" />
      {dashboardError && (
        <View style={styles.dashboardErrorBanner}>
          <Text style={styles.dashboardErrorText}>
            ⚠️ Recommendations unavailable — using cached advice.
          </Text>
        </View>
      )}

      {smartAdvice.length > 0 ? (
        smartAdvice.map((rec) => (
          <InfoCard
            key={rec.id}
            icon={categoryIcon(rec.category)}
            title={rec.title}
            description={rec.message}
            severity={rec.severity as RecommendationSeverity}
          />
        ))
      ) : (
        // Fallback static advice when backend recommendations aren't yet available
        <>
          {w && (
            <>
              <InfoCard
                icon="👕"
                title="Clothing"
                description={clothingAdvice(w)}
                severity="info"
              />
              <InfoCard
                icon="☂️"
                title="Umbrella"
                description={
                  w.rainProbability >= 50
                    ? `Carry an umbrella — there's a ${w.rainProbability}% chance of rain today.`
                    : 'No umbrella needed — low chance of rain today.'
                }
                severity={w.rainProbability >= 50 ? 'warning' : 'success'}
              />
              <InfoCard
                icon="💧"
                title="Hydration"
                description={hydrationAdvice(w)}
                severity={w.temperatureC >= 30 || w.uvIndex >= 6 ? 'warning' : 'success'}
              />
            </>
          )}
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Activity scores                                                      */}
      {/* ------------------------------------------------------------------ */}
      {(activityAdvice.length > 0 || w) && (
        <>
          <SectionHeader title="Activity Scores" />
          {activityAdvice.length > 0 ? (
            activityAdvice.map((rec) => (
              <InfoCard
                key={rec.id}
                icon={categoryIcon(rec.category)}
                title={rec.title}
                description={rec.message}
                severity={rec.severity as RecommendationSeverity}
              />
            ))
          ) : w ? (
            <>
              <InfoCard
                icon="🚗"
                title="Travel Safety"
                description={travelAdvice(w)}
                severity={travelSeverity(w)}
                score={travelScore(w)}
              />
              <InfoCard
                icon="🏃"
                title="Outdoor Activity"
                description={outdoorAdvice(w)}
                severity={outdoorSeverity(w)}
                score={outdoorScore(w)}
              />
            </>
          ) : null}
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Plant care                                                           */}
      {/* ------------------------------------------------------------------ */}
      <SectionHeader title="Plant Care" />
      {plantAdvice ? (
        <InfoCard
          icon="🌱"
          title={plantAdvice.title}
          description={plantAdvice.message}
          severity={plantAdvice.severity as RecommendationSeverity}
        />
      ) : w ? (
        <InfoCard
          icon="🌱"
          title="Plant Care"
          description={
            w.rainProbability >= 60
              ? 'Skip watering today — rain is expected and will take care of your plants.'
              : w.temperatureC >= 32
              ? 'Water your plants in the early morning or evening to avoid evaporation in the heat.'
              : 'Check soil moisture. Water if the top 2 cm of soil feels dry.'
          }
          severity={w.rainProbability >= 60 ? 'success' : 'info'}
        />
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Severe weather alerts                                                */}
      {/* ------------------------------------------------------------------ */}
      <SectionHeader title="Severe Weather Alerts" />
      {alerts.length > 0 ? (
        alerts.map((alert, idx) => {
          const a = alert as Record<string, string>;
          const sStyle = alertSeverityStyle(String(a.severity ?? ''));
          return (
            <View
              key={String(a.id ?? idx)}
              style={[styles.alertCard, { backgroundColor: sStyle.bg, borderColor: sStyle.border }]}
            >
              <Text style={styles.alertIcon}>{sStyle.icon}</Text>
              <View style={styles.alertContent}>
                <Text style={[styles.alertTitle, { color: sStyle.text }]}>
                  {String(a.title ?? a.alert_type ?? 'Weather Alert')}
                </Text>
                {a.reason ? (
                  <Text style={styles.alertDescription}>{String(a.reason)}</Text>
                ) : null}
                <Text style={styles.alertSeverityBadge}>
                  {String(a.severity ?? '').toUpperCase()}
                </Text>
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.noAlertBanner}>
          <Text style={styles.noAlertIcon}>✅</Text>
          <Text style={styles.noAlertText}>
            No active severe weather alerts for your area.
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}

// ---------------------------------------------------------------------------
// Utility functions — derive advice from live WeatherData when AI is absent
// ---------------------------------------------------------------------------

function categoryIcon(category: string): string {
  const map: Record<string, string> = {
    clothing: '👕',
    umbrella: '☂️',
    hydration: '💧',
    travel: '🚗',
    outdoor: '🏃',
    'plant-care': '🌱',
    general: '💡',
  };
  return map[category] ?? '💡';
}

function clothingAdvice(w: WeatherData): string {
  if (w.temperatureC >= 30) return 'Wear light, breathable clothing. It will be very hot today.';
  if (w.temperatureC >= 22) return 'Light clothing is fine. Comfortable temperatures today.';
  if (w.temperatureC >= 15) return 'A light jacket or layer would be comfortable today.';
  return 'Dress warmly — temperatures are cool today.';
}

function hydrationAdvice(w: WeatherData): string {
  if (w.temperatureC >= 32 || w.uvIndex >= 8) {
    return 'Stay well hydrated. Extreme heat and high UV increase fluid loss significantly.';
  }
  if (w.temperatureC >= 27 || w.humidity <= 40) {
    return 'Drink water regularly today. High temperature or low humidity can cause dehydration.';
  }
  return 'Keep water handy, especially during outdoor activity.';
}

function travelAdvice(w: WeatherData): string {
  if (w.condition === 'stormy') return 'Avoid unnecessary travel — thunderstorm conditions are dangerous.';
  if (w.condition === 'rainy' || w.rainProbability >= 70) return 'Drive carefully — wet roads increase stopping distances.';
  if (w.windSpeedKmh >= 50) return 'Use caution — strong winds may affect high-sided vehicles.';
  return 'Good conditions for travel today.';
}

function travelSeverity(w: WeatherData): RecommendationSeverity {
  if (w.condition === 'stormy') return 'danger';
  if (w.condition === 'rainy' || w.rainProbability >= 70 || w.windSpeedKmh >= 50) return 'warning';
  return 'success';
}

function travelScore(w: WeatherData): number {
  let score = 100;
  if (w.condition === 'stormy') score -= 50;
  else if (w.condition === 'rainy') score -= 25;
  if (w.rainProbability >= 70) score -= 15;
  else if (w.rainProbability >= 40) score -= 8;
  if (w.windSpeedKmh >= 50) score -= 20;
  else if (w.windSpeedKmh >= 30) score -= 10;
  return Math.max(0, score);
}

function outdoorAdvice(w: WeatherData): string {
  if (w.condition === 'stormy') return 'Avoid outdoor activity — thunderstorm conditions are unsafe.';
  if (w.uvIndex >= 8) return 'Outdoor activity possible but avoid peak UV hours (10am–2pm). Use sunscreen.';
  if (w.condition === 'rainy' || w.rainProbability >= 70) return 'Rain expected — consider indoor alternatives or wait for a dry window.';
  if (w.temperatureC >= 32) return 'High heat — exercise early morning or evening. Stay hydrated.';
  return 'Good conditions for outdoor activity. Enjoy!';
}

function outdoorSeverity(w: WeatherData): RecommendationSeverity {
  if (w.condition === 'stormy') return 'danger';
  if (w.uvIndex >= 8 || w.condition === 'rainy' || w.rainProbability >= 70 || w.temperatureC >= 32) return 'warning';
  return 'success';
}

function outdoorScore(w: WeatherData): number {
  let score = 100;
  if (w.condition === 'stormy') score -= 60;
  else if (w.condition === 'rainy') score -= 30;
  if (w.uvIndex >= 8) score -= 20;
  else if (w.uvIndex >= 6) score -= 10;
  if (w.temperatureC >= 35) score -= 20;
  else if (w.temperatureC >= 32) score -= 10;
  if (w.rainProbability >= 70) score -= 15;
  else if (w.rainProbability >= 40) score -= 8;
  return Math.max(0, score);
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

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
    maxWidth: 160,
  },
  locationIcon: { fontSize: 14 },
  locationText: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  // Alert banner (top of screen)
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.m,
    borderWidth: 1,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    gap: SPACING.s,
  },
  alertBannerIcon: { fontSize: 20 },
  alertBannerBody: { flex: 1 },
  alertBannerTitle: {
    fontSize: TYPOGRAPHY.fontSize.s,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  alertBannerReason: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
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

  // Location error
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

  // Rain card
  rainCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.m,
    padding: SPACING.m,
    alignItems: 'center',
    gap: SPACING.m,
    marginBottom: SPACING.s,
    ...SHADOWS.subtle,
  },
  rainIcon: { fontSize: 32 },
  rainInfo: { flex: 1 },
  rainTitle: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.xs,
  },
  rainValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  rainTiming: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    marginTop: SPACING.xs,
    lineHeight: 20,
  },

  // Dashboard error banner
  dashboardErrorBanner: {
    backgroundColor: COLORS.warningLight,
    borderRadius: BORDER_RADIUS.m,
    padding: SPACING.s,
    marginBottom: SPACING.s,
  },
  dashboardErrorText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.warning,
    textAlign: 'center',
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.m,
    minHeight: 300,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.m,
    color: COLORS.textSecondary,
    marginTop: SPACING.m,
  },

  // Alert cards (in severe weather section)
  alertCard: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.m,
    padding: SPACING.m,
    alignItems: 'flex-start',
    gap: SPACING.m,
    marginBottom: SPACING.s,
    borderWidth: 1,
  },
  alertIcon: { fontSize: 20, marginTop: 2 },
  alertContent: { flex: 1 },
  alertTitle: {
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    marginBottom: SPACING.xs,
  },
  alertDescription: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.fontSize.s * 1.5,
    marginBottom: SPACING.xs,
  },
  alertSeverityBadge: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
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
  noAlertIcon: { fontSize: 20 },
  noAlertText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});
