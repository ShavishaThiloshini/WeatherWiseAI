import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/theme';

interface Props { locationName?: string; dateLabel?: string; }

export function AppHeader({ locationName, dateLabel }: Props) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.appName}>WeatherWise AI</Text>
        {dateLabel ? <Text style={styles.dateText}>{dateLabel}</Text> : null}
      </View>
      {locationName ? (
        <View style={styles.locationBadge}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText}>{locationName}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.m },
  appName: { fontSize: TYPOGRAPHY.fontSize.xxl, fontWeight: TYPOGRAPHY.fontWeight.extraBold, color: COLORS.textPrimary },
  dateText: { fontSize: TYPOGRAPHY.fontSize.s, color: COLORS.textSecondary, marginTop: 2 },
  locationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.round, paddingHorizontal: SPACING.s, paddingVertical: SPACING.xs, gap: 4 },
  locationIcon: { fontSize: 14 },
  locationText: { fontSize: TYPOGRAPHY.fontSize.s, color: COLORS.textSecondary, fontWeight: TYPOGRAPHY.fontWeight.medium },
});
