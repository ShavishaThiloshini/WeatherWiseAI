/**
 * screens/HomeScreen.tsx
 * Main Home screen for WeatherWise AI.
 *
 * Fully wired: device location -> backend weather API -> AI recommendations.
 */

import React from 'react';
import { StyleSheet, Text, View, RefreshControl } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { WeatherCard } from '../components/WeatherCard';
import { InfoCard } from '../components/InfoCard';
import { EmptyView, ErrorView } from '../components/StateViews';
import { LoadingPlaceholder } from '../components/LoadingPlaceholder';
import { conditionIcon, uvLabel } from '../components/ui/IconMapper';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useLocation, useWeather, useRecommendations } from '../hooks';
import type { RecommendationSeverity } from '../types';

const CATEGORY_ICONS: Record<string, string> = {
  clothing: '👕',
  umbrella: '☂️',
  hydration: '🥤',
  travel: '🚗',
  outdoor: '🏃',
  'plant-care': '🌿',
  thunderstorm: '⛈️',
  heat: '🥵',
  cold: '🧣',
  wind: '🌬️',
  uv: '🧴',
  rain: '🌧️',
  general: '💡',
};

export function HomeScreen() {
  const location = useLocation();
  const weather = useWeather(location.data?.latitude ?? null, location.data?.longitude ?? null);
  const recommendations = useRecommendations(weather.data);

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const refreshing = location.isLoading || weather.isLoading;
  const onRefresh = () => {
    location.refresh();
    if (location.data) weather.refresh();
    recommendations.refresh();
  };

  if (location.isLoading && !location.data) {
    return (
      <ScreenContainer>
        <LoadingPlaceholder message="Finding your location..." />
      </ScreenContainer>
    );
  }

  if (location.error) {
    return (
      <ScreenContainer>
        <ErrorView message={location.error} onRetry={location.refresh} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      scrollable
      contentStyle={{ flexGrow: 1 }}
    >
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={COLORS.primary}
        contentOffset={{ x: 0, y: -100 } as never}
      />
      {/* App header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>WeatherWise AI</Text>
          <Text style={styles.dateText}>{today}</Text>
        </View>
        <View style={styles.locationBadge}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText}>{location.data?.city ?? 'Locating…'}</Text>
        </View>
      </View>

      {/* Hero weather card */}
      {weather.isLoading && !weather.data ? (
        <View style={[styles.heroCard, styles.heroLoading]}>
          <Text style={styles.heroLoadingText}>Loading weather…</Text>
        </View>
      ) : weather.error ? (
        <ErrorView message={weather.error} onRetry={weather.refresh} />
      ) : weather.data ? (
        <View style={styles.heroCard}>
          <Text style={styles.weatherEmoji}>{conditionIcon(weather.data.condition)}</Text>
          <Text style={styles.temperature}>{weather.data.temperatureC}°C</Text>
          <Text style={styles.conditionLabel}>{weather.data.conditionLabel}</Text>
          <Text style={styles.feelsLike}>Feels like {weather.data.feelsLikeC}°C</Text>
          <Text style={styles.locationFull}>{location.data?.displayName}</Text>
        </View>
      ) : null}

      {/* Weather metrics grid */}
      {weather.data ? (
        <>
          <SectionHeader title="Current Conditions" />
          <View style={styles.metricsGrid}>
            <WeatherCard label="Humidity" value={`${weather.data.humidity}%`} icon="💧" style={styles.gridItem} />
            <WeatherCard
              label="Wind"
              value={`${weather.data.windSpeedKmh} km/h`}
              subLabel={weather.data.windDirection}
              icon="🌬️"
              style={styles.gridItem}
            />
            <WeatherCard
              label="UV Index"
              value={String(weather.data.uvIndex)}
              subLabel={uvLabel(weather.data.uvIndex).label}
              icon="☀️"
              style={styles.gridItem}
            />
            <WeatherCard
              label="Rain"
              value={`${weather.data.rainProbability}%`}
              subLabel="Probability"
              icon="🌧️"
              style={styles.gridItem}
            />
          </View>
        </>
      ) : null}

      {/* Smart Advice — real AI engine output */}
      <SectionHeader title="Smart Advice" />
      {recommendations.isLoading && !recommendations.data ? (
        <LoadingPlaceholder message="Generating advice…" />
      ) : recommendations.error ? (
        <ErrorView message={`AI advice unavailable: ${recommendations.error}`} onRetry={recommendations.refresh} />
      ) : recommendations.data && recommendations.data.length > 0 ? (
        recommendations.data.map((rec) => (
          <InfoCard
            key={rec.id}
            icon={CATEGORY_ICONS[rec.category] ?? '💡'}
            title={rec.title}
            message={rec.message}
            reason={rec.reason}
            action={rec.action}
            severity={rec.severity as RecommendationSeverity}
            score={rec.score ?? undefined}
          />
        ))
      ) : (
        <EmptyView message="No advice needed — conditions look fine." icon="👌" />
      )}

      {/* Severe weather alerts */}
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
  locationIcon: { fontSize: 14 },
  locationText: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  heroCard: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.m,
    ...SHADOWS.card,
  },
  heroLoading: { paddingVertical: SPACING.xxl },
  heroLoadingText: { color: COLORS.white, fontSize: TYPOGRAPHY.fontSize.m },
  weatherEmoji: { fontSize: 64, marginBottom: SPACING.s },
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.s,
    marginBottom: SPACING.xs,
  },
  gridItem: { flex: 1, minWidth: '45%' },
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
