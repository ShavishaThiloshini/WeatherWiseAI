/**
 * components/DailyForecastCard.tsx
 *
 * Reusable card component for displaying a single day's forecast summary.
 * Used in the 7-day forecast list on the ForecastScreen.
 *
 * Displays:
 *  - Day label (Today / Tomorrow / Mon 15 etc.)
 *  - Weather condition icon + label
 *  - Min / Max temperature range with a visual bar
 *  - Rain probability with colour-coded indicator
 *  - UV index badge (when available)
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import type { DailyForecast } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Maps a WeatherCondition string to an emoji glyph. */
export function conditionToIcon(condition: DailyForecast['condition']): string {
  const MAP: Record<string, string> = {
    sunny: '☀️',
    'partly-cloudy': '⛅',
    cloudy: '☁️',
    rainy: '🌧️',
    stormy: '⛈️',
    snowy: '❄️',
    foggy: '🌫️',
    windy: '🌬️',
    unknown: '🌥️',
  };
  return MAP[condition] ?? '🌥️';
}

/** Returns "Today", "Tomorrow", or "Mon 15" style label. */
export function formatDayLabel(dateStr: string): string {
  const parsed = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(parsed, today)) return 'Today';
  if (sameDay(parsed, tomorrow)) return 'Tomorrow';
  return parsed.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
}

/** Colour-codes rain probability. */
export function rainColor(probability: number): string {
  if (probability >= 70) return COLORS.danger;
  if (probability >= 40) return COLORS.warning;
  return COLORS.info;
}

/** Returns a UV risk label and colour for a given UV index. */
export function uvInfo(uvIndex: number): { label: string; color: string } {
  if (uvIndex >= 11) return { label: 'Extreme', color: COLORS.danger };
  if (uvIndex >= 8) return { label: 'Very High', color: COLORS.danger };
  if (uvIndex >= 6) return { label: 'High', color: COLORS.warning };
  if (uvIndex >= 3) return { label: 'Moderate', color: COLORS.warning };
  return { label: 'Low', color: COLORS.success };
}

// ---------------------------------------------------------------------------
// Sub-component: Temperature range bar
// ---------------------------------------------------------------------------

interface TempRangeBarProps {
  /** Global minimum across all days (for proportional bar width). */
  globalMin: number;
  /** Global maximum across all days (for proportional bar width). */
  globalMax: number;
  minTempC: number;
  maxTempC: number;
}

function TempRangeBar({ globalMin, globalMax, minTempC, maxTempC }: TempRangeBarProps) {
  const range = Math.max(globalMax - globalMin, 1);
  const startFraction = (minTempC - globalMin) / range;
  const widthFraction = (maxTempC - minTempC) / range;

  return (
    <View
      style={styles.tempBarTrack}
      accessible
      accessibilityLabel={`Temperature range ${minTempC} to ${maxTempC} degrees Celsius`}
    >
      <View style={[styles.tempBarSegment, { flex: Math.max(startFraction, 0) }]} />
      <View style={[styles.tempBarFill, { flex: Math.max(widthFraction, 0.06) }]} />
      <View
        style={[
          styles.tempBarSegment,
          { flex: Math.max(1 - startFraction - widthFraction, 0) },
        ]}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export interface DailyForecastCardProps {
  day: DailyForecast;
  /** Whether this card is the currently selected/expanded day. */
  selected?: boolean;
  /** Called when the user taps the card. */
  onPress?: () => void;
  /** Global min/max used to draw the proportional temperature bar. */
  globalMin?: number;
  globalMax?: number;
  /** Show the UV badge — defaults to true. */
  showUV?: boolean;
}

export function DailyForecastCard({
  day,
  selected = false,
  onPress,
  globalMin = 0,
  globalMax = 40,
  showUV = true,
}: DailyForecastCardProps) {
  const uv = uvInfo(day.uvIndex);
  const label = formatDayLabel(day.date);
  const isToday = label === 'Today';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        isToday && styles.cardToday,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={[
        `${label}: ${day.conditionLabel},`,
        `Low ${day.minTempC} degrees, High ${day.maxTempC} degrees,`,
        `${day.rainProbability}% rain,`,
        `UV ${day.uvIndex} (${uv.label})`,
      ].join(' ')}
      accessibilityState={{ selected }}
    >
      {/* ---- Left: Day label ---- */}
      <View style={styles.dayLabelContainer}>
        <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]} numberOfLines={1}>
          {label}
        </Text>
        {isToday && <Text style={styles.todayBadge}>NOW</Text>}
      </View>

      {/* ---- Centre-left: Icon + condition ---- */}
      <View style={styles.conditionContainer}>
        <Text style={styles.conditionIcon}>{conditionToIcon(day.condition)}</Text>
        <Text style={styles.conditionLabel} numberOfLines={1}>
          {day.conditionLabel}
        </Text>
      </View>

      {/* ---- Centre: Temperature range bar ---- */}
      <View style={styles.tempContainer}>
        <Text style={styles.tempMin}>{day.minTempC}°</Text>
        <TempRangeBar
          globalMin={globalMin}
          globalMax={globalMax}
          minTempC={day.minTempC}
          maxTempC={day.maxTempC}
        />
        <Text style={styles.tempMax}>{day.maxTempC}°</Text>
      </View>

      {/* ---- Right: Rain + UV ---- */}
      <View style={styles.indicators}>
        <View style={styles.rainIndicator}>
          <Text style={styles.rainIcon}>☔</Text>
          <Text style={[styles.rainText, { color: rainColor(day.rainProbability) }]}>
            {day.rainProbability}%
          </Text>
        </View>
        {showUV && (
          <View style={[styles.uvBadge, { backgroundColor: `${uv.color}22` }]}>
            <Text style={[styles.uvText, { color: uv.color }]}>UV {day.uvIndex}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.m,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.m,
    gap: SPACING.s,
    borderWidth: 1,
    borderColor: 'transparent',
    ...SHADOWS.subtle,
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}14`,
  },
  cardToday: {
    borderColor: `${COLORS.secondary}50`,
  },
  cardPressed: {
    opacity: 0.75,
  },

  // Day label column
  dayLabelContainer: {
    width: 74,
    alignItems: 'flex-start',
    gap: 2,
  },
  dayLabel: {
    fontSize: TYPOGRAPHY.fontSize.s,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  dayLabelToday: {
    color: COLORS.secondary,
  },
  todayBadge: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },

  // Condition icon + label
  conditionContainer: {
    width: 70,
    alignItems: 'center',
    gap: 2,
  },
  conditionIcon: {
    fontSize: 22,
  },
  conditionLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Temperature range
  tempContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  tempMin: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    minWidth: 28,
    textAlign: 'right',
  },
  tempMax: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    minWidth: 28,
    textAlign: 'left',
  },
  tempBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: BORDER_RADIUS.round,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: COLORS.border,
  },
  tempBarSegment: {
    backgroundColor: COLORS.border,
  },
  tempBarFill: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.round,
  },

  // Rain + UV indicators
  indicators: {
    width: 58,
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  rainIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rainIcon: {
    fontSize: 11,
  },
  rainText: {
    fontSize: TYPOGRAPHY.fontSize.s,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  uvBadge: {
    borderRadius: BORDER_RADIUS.s,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  uvText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});
