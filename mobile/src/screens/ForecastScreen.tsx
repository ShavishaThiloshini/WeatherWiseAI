/**
 * screens/ForecastScreen.tsx
 * Hourly (next 24h) + 7-day forecast screen for WeatherWise AI.
 *
 * Day 27 Integration:
 *  - Fetches device location via locationService.getCurrentLocation()
 *  - Calls weatherService.getForecast() which proxies through the backend
 *    and falls back to Open-Meteo directly if the backend is unavailable
 *  - Shows horizontally scrollable hourly strip and vertically scrolling daily list
 *  - Loading, error, and empty states per UIUXDesignBrief §8
 */

import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { getForecast } from '../services/weatherService';
import { getCurrentLocation } from '../services/locationService';
import type { HourlyForecast, DailyForecast, WeatherCondition } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CONDITION_EMOJI: Record<WeatherCondition, string> = {
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

function formatHour(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}

function rainColor(prob: number): string {
  if (prob >= 70) return COLORS.danger;
  if (prob >= 40) return COLORS.warning;
  return COLORS.success;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function HourlyItem({ item }: { item: HourlyForecast }) {
  return (
    <View style={styles.hourlyItem}>
      <Text style={styles.hourlyTime}>{formatHour(item.time)}</Text>
      <Text style={styles.hourlyEmoji}>{CONDITION_EMOJI[item.condition] ?? '🌡️'}</Text>
      <Text style={styles.hourlyTemp}>{item.temperatureC}°</Text>
      <View style={styles.rainBar}>
        <View
          style={[
            styles.rainFill,
            {
              height: `${item.rainProbability}%` as unknown as number,
              backgroundColor: rainColor(item.rainProbability),
            },
          ]}
        />
      </View>
      <Text style={[styles.rainPct, { color: rainColor(item.rainProbability) }]}>
        {item.rainProbability}%
      </Text>
    </View>
  );
}

function DailyItem({ item }: { item: DailyForecast }) {
  return (
    <View style={styles.dailyRow}>
      <Text style={styles.dailyDay}>{formatDay(item.date)}</Text>
      <Text style={styles.dailyEmoji}>{CONDITION_EMOJI[item.condition] ?? '🌡️'}</Text>
      <Text style={styles.dailyLabel} numberOfLines={1}>{item.conditionLabel}</Text>
      <Text style={[styles.dailyRain, { color: rainColor(item.rainProbability) }]}>
        {item.rainProbability}%
      </Text>
      <Text style={styles.dailyTemps}>
        <Text style={styles.dailyHigh}>{item.maxTempC}°</Text>
        <Text style={styles.dailyLow}> / {item.minTempC}°</Text>
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function ForecastScreen() {
  const [hourly, setHourly] = React.useState<HourlyForecast[]>([]);
  const [daily, setDaily] = React.useState<DailyForecast[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadForecast = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loc = await getCurrentLocation();
      const data = await getForecast(loc.latitude, loc.longitude);
      if (data.hourly.length === 0 && data.daily.length === 0) {
        setError('Forecast data is not available right now. Please try again later.');
      } else {
        setHourly(data.hourly);
        setDaily(data.daily);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load forecast.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadForecast();
  }, [loadForecast]);

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading forecast…</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void loadForecast()} accessibilityRole="button">
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      {/* ------------------------------------------------------------------ */}
      {/* Hourly strip                                                         */}
      {/* ------------------------------------------------------------------ */}
      <Text style={styles.sectionTitle}>Next 24 Hours</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hourlyStrip}
        accessibilityLabel="Hourly forecast"
      >
        {hourly.map((item) => (
          <HourlyItem key={item.time} item={item} />
        ))}
        {hourly.length === 0 && (
          <Text style={styles.emptyText}>No hourly data available.</Text>
        )}
      </ScrollView>

      {/* Rain legend */}
      <View style={styles.legendRow}>
        <Text style={styles.legendText}>Rain probability: </Text>
        <Text style={[styles.legendDot, { color: COLORS.success }]}>● Low</Text>
        <Text style={[styles.legendDot, { color: COLORS.warning }]}> ● Moderate</Text>
        <Text style={[styles.legendDot, { color: COLORS.danger }]}> ● High</Text>
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* 7-day forecast                                                       */}
      {/* ------------------------------------------------------------------ */}
      <Text style={[styles.sectionTitle, { marginTop: SPACING.l }]}>7-Day Forecast</Text>
      <View style={styles.dailyCard}>
        {daily.map((item, idx) => (
          <React.Fragment key={item.date}>
            <DailyItem item={item} />
            {idx < daily.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
        {daily.length === 0 && (
          <Text style={styles.emptyText}>No daily forecast data available.</Text>
        )}
      </View>
    </ScreenContainer>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.m,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.m,
    marginTop: SPACING.s,
  },
  errorIcon: { fontSize: 48 },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.m,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.m * 1.5,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    marginTop: SPACING.s,
  },
  retryBtnText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.l,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    marginBottom: SPACING.s,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.m,
    padding: SPACING.l,
  },

  // Hourly
  hourlyStrip: {
    gap: SPACING.s,
    paddingBottom: SPACING.s,
    paddingRight: SPACING.s,
  },
  hourlyItem: {
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.m,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.s,
    width: 72,
    ...SHADOWS.subtle,
  },
  hourlyTime: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginBottom: SPACING.xs,
  },
  hourlyEmoji: { fontSize: 24, marginBottom: SPACING.xs },
  hourlyTemp: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    marginBottom: SPACING.xs,
  },
  rainBar: {
    width: 8,
    height: 40,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  rainFill: {
    width: '100%',
    borderRadius: 4,
  },
  rainPct: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  // Legend
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.s,
    marginBottom: SPACING.xs,
    flexWrap: 'wrap',
  },
  legendText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.xs },
  legendDot: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.semiBold },

  // Daily
  dailyCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.m,
    overflow: 'hidden',
    marginBottom: SPACING.l,
    ...SHADOWS.subtle,
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    gap: SPACING.s,
  },
  dailyDay: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.s,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    width: 76,
  },
  dailyEmoji: { fontSize: 22, width: 30, textAlign: 'center' },
  dailyLabel: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.s,
  },
  dailyRain: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    width: 34,
    textAlign: 'right',
  },
  dailyTemps: { width: 60, textAlign: 'right' },
  dailyHigh: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.s,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  dailyLow: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.s,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.m,
  },
});
