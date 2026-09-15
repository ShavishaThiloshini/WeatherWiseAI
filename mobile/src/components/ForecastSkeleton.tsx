/**
 * components/ForecastSkeleton.tsx
 *
 * Skeleton placeholder shown while forecast data is loading.
 * Renders shimmer-shaped placeholders matching the real card layout,
 * reducing perceived wait time per the UI/UX Design Brief (Section 8).
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';

// ---------------------------------------------------------------------------
// DailyForecastSkeleton — one placeholder row
// ---------------------------------------------------------------------------

function DailyRowSkeleton() {
  return (
    <View style={styles.card}>
      {/* Day label */}
      <View style={[styles.block, { width: 56, height: 14 }]} />
      {/* Icon */}
      <View style={[styles.block, { width: 28, height: 28, borderRadius: BORDER_RADIUS.s }]} />
      {/* Temp range */}
      <View style={styles.tempRow}>
        <View style={[styles.block, { width: 24, height: 12 }]} />
        <View style={[styles.block, { flex: 1, height: 6, borderRadius: BORDER_RADIUS.round }]} />
        <View style={[styles.block, { width: 24, height: 12 }]} />
      </View>
      {/* Rain */}
      <View style={[styles.block, { width: 44, height: 14 }]} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// HourlyCardSkeleton — one placeholder hourly card
// ---------------------------------------------------------------------------

function HourlyCardSkeleton() {
  return (
    <View style={styles.hourCard}>
      <View style={[styles.block, { width: 36, height: 10 }]} />
      <View style={[styles.block, { width: 28, height: 28, borderRadius: BORDER_RADIUS.s }]} />
      <View style={[styles.block, { width: 32, height: 16 }]} />
      <View style={[styles.block, { width: '100%', height: 4, borderRadius: BORDER_RADIUS.round }]} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// DayDetailSkeleton — bottom detail panel
// ---------------------------------------------------------------------------

function DayDetailSkeleton() {
  return (
    <View style={styles.detailCard}>
      <View style={[styles.block, { width: 120, height: 18, marginBottom: SPACING.s }]} />
      <View style={[styles.block, { width: 160, height: 14, marginBottom: SPACING.m }]} />
      <View style={styles.detailGrid}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.block, { width: '44%', height: 14 }]} />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Exported: ForecastSkeleton (full-screen)
// ---------------------------------------------------------------------------

interface ForecastSkeletonProps {
  /** Number of daily row skeletons to render (max 7). */
  dailyCount?: number;
  /** Number of hourly card skeletons to render. */
  hourlyCount?: number;
}

export function ForecastSkeleton({
  dailyCount = 7,
  hourlyCount = 5,
}: ForecastSkeletonProps) {
  return (
    <>
      {/* Header block */}
      <View style={[styles.block, { width: 180, height: 28, marginBottom: SPACING.xs }]} />
      <View style={[styles.block, { width: 240, height: 13, marginBottom: SPACING.l }]} />

      {/* Hourly strip */}
      <View style={[styles.block, { width: 80, height: 16, marginBottom: SPACING.s }]} />
      <View style={styles.hourlyRow}>
        {Array.from({ length: hourlyCount }, (_, i) => (
          <HourlyCardSkeleton key={i} />
        ))}
      </View>

      {/* Daily list */}
      <View style={[styles.block, { width: 100, height: 16, marginBottom: SPACING.s, marginTop: SPACING.l }]} />
      <View style={styles.dayList}>
        {Array.from({ length: dailyCount }, (_, i) => (
          <DailyRowSkeleton key={i} />
        ))}
      </View>

      {/* Detail panel */}
      <DayDetailSkeleton />
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  block: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.s,
    opacity: 0.7,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.m,
    padding: SPACING.m,
    gap: SPACING.s,
    marginBottom: SPACING.s,
    opacity: 0.7,
  },
  tempRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  hourlyRow: {
    flexDirection: 'row',
    gap: SPACING.s,
  },
  hourCard: {
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.m,
    width: 80,
    padding: SPACING.s,
    gap: SPACING.xs,
    opacity: 0.7,
  },
  dayList: {
    gap: SPACING.s,
  },
  detailCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.m,
    padding: SPACING.m,
    marginTop: SPACING.l,
    opacity: 0.7,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.m,
  },
});
