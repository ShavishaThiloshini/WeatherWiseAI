/**
 * screens/ProfileScreen.tsx
 * Placeholder screen for user profile and app settings.
 * TODO (Day 2+): Implement user preferences (units, location, notifications),
 *               and any auth flow if required.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

export function ProfileScreen() {
  return (
    <ScreenContainer>
      <View style={styles.center}>
        <Text style={styles.emoji}>⚙️</Text>
        <Text style={styles.title}>Profile & Settings Screen</Text>
        <Text style={styles.subtitle}>
          User profile, preferences, unit settings, and notifications will be configured here.{'\n'}
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
