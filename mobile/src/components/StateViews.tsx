/**
 * components/StateViews.tsx
 * Standardized empty-state and error-state views.
 * Use these across all screens to maintain visual consistency.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/theme';

// ---------------------------------------------------------------------------
// EmptyView
// ---------------------------------------------------------------------------

interface EmptyViewProps {
  message?: string;
  icon?: string;
}

export function EmptyView({
  message = 'No weather data available.',
  icon = '🌥️',
}: EmptyViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.stateIcon}>{icon}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ErrorView
// ---------------------------------------------------------------------------

interface ErrorViewProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorView({
  message = 'Unable to load weather information.',
  onRetry,
}: ErrorViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.stateIcon}>⚠️</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry} accessibilityRole="button">
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.m,
  },
  stateIcon: {
    fontSize: 48,
  },
  message: {
    fontSize: TYPOGRAPHY.fontSize.m,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.m * 1.5,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    marginTop: SPACING.s,
  },
  retryText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
});
