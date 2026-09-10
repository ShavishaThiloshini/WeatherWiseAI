/**
 * screens/HomeScreen.tsx
 * Main Home screen for WeatherWise AI.
 *
 * Day 05 state: Enhanced Home Dashboard with comprehensive mock data structure.
 * All values marked [MOCK] should be replaced with live data in future days.
 *
 * Layout sections:
 *  1. App header (location + date)
 *  2. Main weather hero card (temperature + condition)
 *  3. Weather metrics grid (humidity, wind, UV, rain)
 *  4. Rain timing section
 *  5. Smart Advice section (clothing, umbrella, hydration)
 *  6. Activity scores (Travel Safety, Outdoor Activity)
 *  7. Plant Care recommendation
 *  8. Severe Weather Alerts
 *  9. Loading, empty, and error states
 */

import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { WeatherCard } from '../components/WeatherCard';
import { InfoCard } from '../components/InfoCard';
import { ErrorView, EmptyView } from '../components/StateViews';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import {
  MOCK_WEATHER,
  MOCK_RECOMMENDATIONS,
  MOCK_TRAVEL_SAFETY,
  MOCK_OUTDOOR_ACTIVITY,
  MOCK_PLANT_CARE,
  MOCK_WEATHER_ALERT,
  MOCK_RAIN_TIMING,
} from '../services/weatherService';
import { getCurrentLocation } from '../services/locationService';
import type { LocationData } from '../types';

type DashboardState = 'loading' | 'success' | 'error' | 'empty';

export function HomeScreen() {
  // [MOCK] Day 6+: Replace with real data from useWeather / useLocation hooks
  const [dashboardState, setDashboardState] = React.useState<DashboardState>('loading');
  const [location, setLocation] = React.useState<LocationData | null>(null);
  const [locationError, setLocationError] = React.useState<string | null>(null);

  const loadLocation = React.useCallback(async () => {
    setLocationError(null);
    try {
      setLocation(await getCurrentLocation());
      setDashboardState('success');
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : 'Unable to determine your location.');
      setDashboardState('error');
    }
  }, []);

  React.useEffect(() => {
    // Simulate loading state for demonstration
    const timer = setTimeout(() => {
      void loadLocation();
    }, 1000);
    return () => clearTimeout(timer);
  }, [loadLocation]);

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // Loading state
  if (dashboardState === 'loading') {
    return (
      <ScreenContainer scrollable>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading weather information...</Text>
        </View>
      </ScreenContainer>
    );
  }

  // Error state
  if (dashboardState === 'error') {
    return (
      <ScreenContainer scrollable>
        <ErrorView
          message="Unable to load weather information. Please check your connection and try again."
          onRetry={() => {
            setDashboardState('loading');
            void loadLocation();
          }}
        />
      </ScreenContainer>
    );
  }

  // Empty state
  if (dashboardState === 'empty') {
    return (
      <ScreenContainer scrollable>
        <EmptyView
          message="Weather information unavailable. Please try again later."
          icon="🌥️"
        />
      </ScreenContainer>
    );
  }

  // Success state - main dashboard
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
          <Text style={styles.locationText}>{location?.city || 'Colombo'}</Text>
        </View>
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Hero weather card                                                    */}
      {/* ------------------------------------------------------------------ */}
      <View style={styles.heroCard}>
        <Text style={styles.weatherEmoji}>⛅</Text>
        <Text style={styles.temperature}>{MOCK_WEATHER.temperatureC}°C</Text>
        <Text style={styles.conditionLabel}>{MOCK_WEATHER.conditionLabel}</Text>
        <Text style={styles.feelsLike}>Feels like {MOCK_WEATHER.feelsLikeC}°C</Text>
        <Text style={styles.locationFull}>{location?.displayName || 'Colombo, Sri Lanka'}</Text>
      </View>

      {locationError && (
        <View style={styles.locationError}>
          <Text style={styles.locationErrorText}>{locationError}</Text>
          <Pressable 
            onPress={() => void loadLocation()} 
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
      <SectionHeader title="Current Conditions" />
      <View style={styles.metricsGrid}>
        <WeatherCard
          label="Humidity"
          value={`${MOCK_WEATHER.humidity}%`}
          icon="💧"
          style={styles.gridItem}
        />
        <WeatherCard
          label="Wind"
          value={`${MOCK_WEATHER.windSpeedKmh} km/h`}
          subLabel={MOCK_WEATHER.windDirection}
          icon="🌬️"
          style={styles.gridItem}
        />
        <WeatherCard
          label="UV Index"
          value={String(MOCK_WEATHER.uvIndex)}
          subLabel={MOCK_WEATHER.uvIndex >= 8 ? 'Very High' : MOCK_WEATHER.uvIndex >= 6 ? 'High' : 'Moderate'}
          icon="☀️"
          style={styles.gridItem}
        />
        <WeatherCard
          label="Rain"
          value={`${MOCK_WEATHER.rainProbability}%`}
          subLabel="Probability"
          icon="🌧️"
          style={styles.gridItem}
        />
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Rain timing section                                                  */}
      {/* ------------------------------------------------------------------ */}
      <SectionHeader title="Rain Information" />
      <View style={styles.rainCard}>
        <Text style={styles.rainIcon}>🌧️</Text>
        <View style={styles.rainInfo}>
          <Text style={styles.rainTitle}>Rain Probability</Text>
          <Text style={styles.rainValue}>{MOCK_WEATHER.rainProbability}%</Text>
          <Text style={styles.rainTiming}>Next Rain: {MOCK_RAIN_TIMING.nextRainTime}</Text>
          <Text style={styles.rainDetails}>
            Expected intensity: {MOCK_RAIN_TIMING.rainIntensity} ({MOCK_RAIN_TIMING.expectedDuration})
          </Text>
        </View>
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Smart Advice                                                         */}
      {/* ------------------------------------------------------------------ */}
      <SectionHeader title="Smart Advice" />
      {MOCK_RECOMMENDATIONS.map((recommendation) => (
        <InfoCard
          key={recommendation.id}
          icon={recommendation.icon}
          title={recommendation.title}
          description={recommendation.description}
          severity={recommendation.severity}
        />
      ))}

      {/* ------------------------------------------------------------------ */}
      {/* Activity scores                                                      */}
      {/* ------------------------------------------------------------------ */}
      <SectionHeader title="Activity Scores" />
      <InfoCard
        icon={MOCK_TRAVEL_SAFETY.icon}
        title={MOCK_TRAVEL_SAFETY.title}
        description={MOCK_TRAVEL_SAFETY.description}
        severity={MOCK_TRAVEL_SAFETY.severity}
        score={MOCK_TRAVEL_SAFETY.score}
      />
      <InfoCard
        icon={MOCK_OUTDOOR_ACTIVITY.icon}
        title={MOCK_OUTDOOR_ACTIVITY.title}
        description={MOCK_OUTDOOR_ACTIVITY.description}
        severity={MOCK_OUTDOOR_ACTIVITY.severity}
        score={MOCK_OUTDOOR_ACTIVITY.score}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Plant care                                                           */}
      {/* ------------------------------------------------------------------ */}
      <SectionHeader title="Plant Care" />
      <InfoCard
        icon={MOCK_PLANT_CARE.icon}
        title={MOCK_PLANT_CARE.title}
        description={MOCK_PLANT_CARE.description}
        severity={MOCK_PLANT_CARE.severity}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Severe weather alerts                                                */}
      {/* ------------------------------------------------------------------ */}
      <SectionHeader title="Severe Weather Alerts" />
      {MOCK_WEATHER_ALERT ? (
        <View style={styles.alertCard}>
          <Text style={styles.alertIcon}>⚠️</Text>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>{MOCK_WEATHER_ALERT.title}</Text>
            <Text style={styles.alertDescription}>{MOCK_WEATHER_ALERT.description}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.noAlertBanner}>
          <Text style={styles.noAlertIcon}>✅</Text>
          <Text style={styles.noAlertText}>No active severe weather alerts for your area.</Text>
        </View>
      )}
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

  // Loading state
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.m,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.m,
    color: COLORS.textSecondary,
    marginTop: SPACING.m,
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
  rainIcon: {
    fontSize: 32,
  },
  rainInfo: {
    flex: 1,
  },
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
    fontSize: TYPOGRAPHY.fontSize.m,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    marginTop: SPACING.xs,
  },
  rainDetails: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  // Alert card
  alertCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.warningLight,
    borderRadius: BORDER_RADIUS.m,
    padding: SPACING.m,
    alignItems: 'flex-start',
    gap: SPACING.m,
    marginBottom: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  alertIcon: {
    fontSize: 24,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  alertDescription: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.textDark,
    lineHeight: TYPOGRAPHY.fontSize.s * 1.5,
  },
});
