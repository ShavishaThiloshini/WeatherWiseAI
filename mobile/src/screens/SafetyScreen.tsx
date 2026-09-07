import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

export function SafetyScreen() {
  return (
    <ScreenContainer>
      <View style={styles.center}>
        <Text style={styles.icon}>✅</Text>
        <Text style={styles.title}>Safety Center</Text>
        <Text style={styles.subtitle}>
          Severe-weather alerts and recommended safety actions will appear here.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  icon: { fontSize: 56, marginBottom: SPACING.m },
  title: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.s,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.m,
    lineHeight: TYPOGRAPHY.fontSize.m * 1.6,
    textAlign: 'center',
  },
});
