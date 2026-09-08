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
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { InfoCard } from '../components/InfoCard';
import { LoadingPlaceholder } from '../components/LoadingPlaceholder';
import { AppHeader } from '../components/AppHeader';
import { HeroWeather } from '../components/HeroWeather';
import { MetricsGrid } from '../components/MetricsGrid';
import { useWeather } from '../hooks/useWeather';
import { useLocation } from '../hooks/useLocation';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { MOCK_WEATHER } from '../services/weatherService';
import { MOCK_LOCATION } from '../services/locationService';

export function HomeScreen() {
  const { location, loading: locLoading } = useLocation();
  const { data: weather, loading: weatherLoading } = useWeather(location?.latitude, location?.longitude);

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const loc = location ?? MOCK_LOCATION;
  const w = weather ?? MOCK_WEATHER;

  return (
    <ScreenContainer scrollable>
      <AppHeader locationName={loc.city} dateLabel={today} />

      {weatherLoading || locLoading ? (
        <LoadingPlaceholder />
      ) : (
        <>
          <HeroWeather weather={w} locationLabel={loc.displayName} />

          <SectionHeader title="Current Conditions" />
          <MetricsGrid weather={w} />
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Smart Advice                                                         */}
      {/* ------------------------------------------------------------------ */}
      <SectionHeader title="Smart Advice" />

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
});
