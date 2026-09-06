/**
 * components/LoadingPlaceholder.tsx
 * Standard loading skeleton/placeholder shown while data is being fetched.
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

interface LoadingPlaceholderProps {
  message?: string;
}

export function LoadingPlaceholder({
  message = 'Loading weather...',
}: LoadingPlaceholderProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.m,
  },
  message: {
    fontSize: TYPOGRAPHY.fontSize.m,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
