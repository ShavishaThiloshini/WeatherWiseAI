/**
 * screens/WeatherMapScreen.tsx
 * Placeholder screen for interactive weather map.
 * TODO (Day 2+): Integrate a map component (e.g. react-native-maps) with
 *               weather overlays (rain radar, wind, temperature).
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

export function WeatherMapScreen() {
  return (
    <ScreenContainer>
      <View style={styles.center}>
        <Text style={styles.emoji}>🗺️</Text>
        <Text style={styles.title}>Weather Map Screen</Text>
        <Text style={styles.subtitle}>
          Interactive weather map with rain radar, wind, and temperature overlays will be displayed here.{'\n'}
          (Day 2+ feature)
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  emoji: { fontSize: 56, marginBottom: SPACING.m },
  title: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.textPrimary, marginBottom: SPACING.s },
  subtitle: { fontSize: TYPOGRAPHY.fontSize.m, color: COLORS.textSecondary, textAlign: 'center', lineHeight: TYPOGRAPHY.fontSize.m * 1.6 },
});
