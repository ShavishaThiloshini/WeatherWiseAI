/**
 * screens/ForecastScreen.tsx
 *
 * Multi-Day / 7-Day Forecast screen for WeatherWise AI.
 *
 * Day 10 Implementation (Frontend — Shavisha):
 *  - Horizontally scrollable 24-hour
 * strip at the top (per Design Brief §7.2)
 *  - 7-day daily forecast list using the reusable DailyForecastCard component
 *  - Proportional temperature range bars anchored to the week's global min/max
 *  - Tapping a day card expands a detail panel showing all metrics
 *  - Skeleton loading state (shape-matched placeholders per Design Brief §8)
 *  - Error state with retry (plain-language message per Design Brief §8)
 *  - Empty state with friendly message
 *  - Falls back to Open-Meteo direct fetch when the backend is unavailable
 *  - All UI states implemented; no hardcoded forecast data in production path
 *
 * Data flow:
 *  locationService → getCurrentLocation()
 *    → weatherService.getForecast(lat, lon)  [backend /weather/forecast]
 *    → on failure: direct Open-Meteo fetch via weatherService.getForecastDirect()
 *
 * Navigation: this screen is already registered as the "Forecast" tab
 * in RootNavigator.tsx — no navigation changes required for Day 10.
 */

import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyView, ErrorView } from '../components/StateViews';
import { DailyForecastCard, conditionToIcon, formatDayLabel, rainColor, uvInfo } from '../components/DailyForecastCard';
import { ForecastSkeleton } from '../components/ForecastSkeleton';
import { getCurrentLocation } from '../services/locationService';
import { getForecast, getForecastDirect } from '../services/weatherService';
import type { DailyForecast, ForecastData, HourlyForecast } from '../types';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatHour(time: string): string {
  const parsed = new Date(time);
  return Number.isNaN(parsed.getTime())
    ? '--:--'
    : parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Derives global min/max temps across the week for proportional range bars. */
function deriveGlobalRange(days: DailyForecast[]): { globalMin: number; globalMax: number } {
  if (days.length === 0) return { globalMin: 0, globalMax: 40 };
  const mins = days.map((d) => d.minTempC);
  const maxs = days.map((d) => d.maxTempC);
  const globalMin = Math.floor(Math.min(...mins)) - 2;
  const globalMax = Math.ceil(Math.max(...maxs)) + 2;
  return { globalMin, globalMax };
}

// ---------------------------------------------------------------------------
// HourCard — individual hourly forecast tile
// ---------------------------------------------------------------------------

function HourCard({ hour }: { hour: HourlyForecast }) {
  return (
    <View
      style={styles.hourCard}
      accessible
      accessibilityLabel={[
        `${formatHour(hour.time)},`,
        `${hour.temperatureC} degrees,`,
        `${hour.rainProbability}% rain chance`,
        hour.feelsLikeC != null ? `, feels like ${hour.feelsLikeC} degrees` : '',
      ].join('')}
    >
      <Text style={styles.hourTime}>{formatHour(hour.time)}</Text>
      <Text style={styles.hourIcon}>{conditionToIcon(hour.condition)}</Text>
      <Text style={styles.hourTemp}>{hour.temperatureC}°</Text>
      {hour.feelsLikeC != null && (
        <Text style={styles.hourFeels}>Feels {hour.feelsLikeC}°</Text>
      )}
      {/* Rain probability bar */}
      <View
        style={styles.rainTrack}
        accessibilityLabel={`${hour.rainProbability}% rain probability`}
      >
        <View
          style={[
            styles.rainBar,
            {
              width: `${Math.min(100, Math.max(0, hour.rainProbability))}%`,
              backgroundColor: rainColor(hour.rainProbability),
            },
          ]}
        />
      </View>
      <Text style={[styles.hourRain, { color: rainColor(hour.rainProbability) }]}>
        ☔ {hour.rainProbability}%
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// DayDetailPanel — expanded metrics for the selected day
// ---------------------------------------------------------------------------

function DayDetailPanel({ day }: { day: DailyForecast }) {
  const uv = uvInfo(day.uvIndex);
  const label = formatDayLabel(day.date);

  return (
    <View style={styles.detailPanel} accessible accessibilityLabel={`Details for ${label}`}>
      {/* Header */}
      <View style={styles.detailHeader}>
        <Text style={styles.detailIcon}>{conditionToIcon(day.condition)}</Text>
        <View style={styles.detailHeaderText}>
          <Text style={styles.detailTitle}>{label} details</Text>
          <Text style={styles.detailCondition}>{day.conditionLabel}</Text>
        </View>
      </View>

      {/* Metric grid */}
      <View style={styles.detailGrid}>
        <View style={styles.detailMetricCell}>
          <Text style={styles.detailMetricLabel}>Low</Text>
          <Text style={styles.detailMetricValue}>{day.minTempC}°C</Text>
        </View>
        <View style={styles.detailMetricCell}>
          <Text style={styles.detailMetricLabel}>High</Text>
          <Text style={styles.detailMetricValue}>{day.maxTempC}°C</Text>
        </View>
        <View style={styles.detailMetricCell}>
          <Text style={styles.detailMetricLabel}>Rain chance</Text>
          <Text style={[styles.detailMetricValue, { color: rainColor(day.rainProbability) }]}>
            {day.rainProbability}%
          </Text>
        </View>
        <View style={styles.detailMetricCell}>
          <Text style={styles.detailMetricLabel}>UV index</Text>
          <Text style={[styles.detailMetricValue, { color: uv.color }]}>
            {day.uvIndex} — {uv.label}
          </Text>
        </View>
      </View>

      {/* UV risk banner when High or above */}
      {day.uvIndex >= 6 && (
        <View style={[styles.uvBanner, { backgroundColor: `${uv.color}18` }]}>
          <Text style={[styles.uvBannerText, { color: uv.color }]}>
            ☀️ {uv.label} UV — apply sunscreen and limit direct exposure between 10 am–2 pm.
          </Text>
        </View>
      )}

      {/* High rain advisory */}
      {day.rainProbability >= 70 && (
        <View style={styles.rainBanner}>
          <Text style={styles.rainBannerText}>
            🌧️ High rain likelihood — carry an umbrella and plan indoor alternatives.
          </Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// ForecastScreen
// ---------------------------------------------------------------------------

export function ForecastScreen() {
  const [forecast, setForecast] = React.useState<ForecastData | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [locationLabel, setLocationLabel] = React.useState<string>('');

  /** Load forecast data — tries the backend first, then falls back to direct Open-Meteo. */
  const loadForecast = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const location = await getCurrentLocation();
      setLocationLabel(location.displayName);

      let data: ForecastData | null = null;

      // Primary: backend /weather/forecast (authenticated, cached)
      try {
        data = await getForecast(location.latitude, location.longitude);
      } catch {
        // Secondary: direct Open-Meteo fetch as fallback
        try {
          data = await getForecastDirect(location.latitude, location.longitude);
        } catch {
          data = null;
        }
      }

      if (!data || (data.daily.length === 0 && data.hourly.length === 0)) {
        setError("We couldn't reach the weather service. Please check your connection and try again.");
        setForecast(null);
      } else {
        setForecast(data);
        setSelectedDayIndex(0);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "We couldn't determine your location. Please allow location access and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadForecast();
  }, [loadForecast]);

  // ---- Loading state: skeleton placeholders ----
  if (loading) {
    return (
      <ScreenContainer scrollable>
        <ForecastSkeleton dailyCount={7} hourlyCount={5} />
      </ScreenContainer>
    );
  }

  // ---- Error state ----
  if (error) {
    return (
      <ScreenContainer>
        <ErrorView message={error} onRetry={() => void loadForecast()} />
      </ScreenContainer>
    );
  }

  // ---- Empty state ----
  if (!forecast || forecast.daily.length === 0) {
    return (
      <ScreenContainer>
        <EmptyView
          message="No seven-day forecast is available for your location."
          icon="📅"
        />
      </ScreenContainer>
    );
  }

  // ---- Success state ----
  const days = forecast.daily.slice(0, 7);
  const { globalMin, globalMax } = deriveGlobalRange(days);
  const selectedDay = days[Math.min(selectedDayIndex, days.length - 1)];

  return (
    <ScreenContainer scrollable>
      {/* ------------------------------------------------------------------ */}
      {/* Screen header                                                        */}
      {/* ------------------------------------------------------------------ */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>7-Day Forecast</Text>
          <Text style={styles.screenSubtitle}>
            Tap any day to see detailed conditions
          </Text>
        </View>
        {locationLabel ? (
          <View style={styles.locationBadge}>
            <Text style={styles.locationBadgeIcon}>📍</Text>
            <Text style={styles.locationBadgeText} numberOfLines={1}>
              {locationLabel.split(',')[0]}
            </Text>
          </View>
        ) : null}
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Hourly strip (next 24 h)                                             */}
      {/* ------------------------------------------------------------------ */}
      {forecast.hourly.length > 0 && (
        <>
          <SectionHeader title="Next 24 hours" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hourlyList}
            accessibilityLabel="Hourly forecast for the next 24 hours"
          >
            {forecast.hourly.slice(0, 24).map((hour) => (
              <HourCard key={hour.time} hour={hour} />
            ))}
          </ScrollView>
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 7-day daily forecast list                                            */}
      {/* ------------------------------------------------------------------ */}
      <SectionHeader title="Daily forecast" />

      {/* Legend row */}
      <View style={styles.legendRow}>
        <Text style={styles.legendItem}>Day</Text>
        <Text style={[styles.legendItem, { width: 70, textAlign: 'center' }]}>Condition</Text>
        <Text style={[styles.legendItem, { flex: 1, textAlign: 'center' }]}>Temp range</Text>
        <Text style={[styles.legendItem, { width: 58, textAlign: 'right' }]}>Rain / UV</Text>
      </View>

      <View style={styles.dayList} accessibilityLabel="Seven day forecast list">
        {days.map((day, index) => (
          <DailyForecastCard
            key={day.date}
            day={day}
            selected={index === selectedDayIndex}
            onPress={() => setSelectedDayIndex(index)}
            globalMin={globalMin}
            globalMax={globalMax}
            showUV
          />
        ))}
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Detail panel for the selected day                                   */}
      {/* ------------------------------------------------------------------ */}
      {selectedDay && <DayDetailPanel day={selectedDay} />}

      {/* ------------------------------------------------------------------ */}
      {/* Data source note                                                     */}
      {/* ------------------------------------------------------------------ */}
      <Text style={styles.dataNote}>
        Weather data sourced from Open-Meteo. Forecasts are for planning purposes only.
      </Text>
    </ScreenContainer>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.s,
  },
  screenTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.extraBold,
  },
  screenSubtitle: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.s,
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
    maxWidth: 130,
  },
  locationBadgeIcon: {
    fontSize: 13,
  },
  locationBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  // Hourly strip
  hourlyList: {
    gap: SPACING.s,
    paddingBottom: SPACING.s,
  },
  hourCard: {
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.m,
    minWidth: 82,
    padding: SPACING.s,
    gap: 3,
    ...SHADOWS.subtle,
  },
  hourTime: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  hourIcon: {
    fontSize: 24,
    marginVertical: 2,
  },
  hourTemp: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.l,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  hourFeels: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  rainTrack: {
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.round,
    height: 4,
    marginTop: SPACING.xs,
    overflow: 'hidden',
    width: '100%',
  },
  rainBar: {
    borderRadius: BORDER_RADIUS.round,
    height: '100%',
  },
  hourRain: {
    fontSize: TYPOGRAPHY.fontSize.xs,
  },

  // Legend
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
    marginBottom: SPACING.xs,
  },
  legendItem: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    width: 74,
  },

  // Day list
  dayList: {
    gap: SPACING.s,
  },

  // Detail panel
  detailPanel: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.l,
    marginTop: SPACING.l,
    padding: SPACING.m,
    ...SHADOWS.card,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    marginBottom: SPACING.m,
  },
  detailIcon: {
    fontSize: 40,
  },
  detailHeaderText: {
    flex: 1,
  },
  detailTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.l,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  detailCondition: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.s,
    marginTop: 2,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.m,
    marginBottom: SPACING.s,
  },
  detailMetricCell: {
    minWidth: '44%',
    flex: 1,
  },
  detailMetricLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailMetricValue: {
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  uvBanner: {
    borderRadius: BORDER_RADIUS.s,
    marginTop: SPACING.s,
    padding: SPACING.s,
  },
  uvBannerText: {
    fontSize: TYPOGRAPHY.fontSize.s,
    lineHeight: TYPOGRAPHY.fontSize.s * 1.5,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  rainBanner: {
    backgroundColor: `${COLORS.info}18`,
    borderRadius: BORDER_RADIUS.s,
    marginTop: SPACING.s,
    padding: SPACING.s,
  },
  rainBannerText: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.info,
    lineHeight: TYPOGRAPHY.fontSize.s * 1.5,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  // Data note
  dataNote: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.l,
    textAlign: 'center',
    opacity: 0.6,
  },
});