/**
 * components/SectionHeader.tsx
 * Standardized section header for groups of content on any screen.
 */

import React from 'react';
import { StyleSheet, Text, View, TextStyle } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

interface SectionHeaderProps {
  title: string;
  /** Optional right-side action label (e.g. "See All") */
  actionLabel?: string;
  onActionPress?: () => void;
  style?: TextStyle;
}

export function SectionHeader({ title, actionLabel, onActionPress, style }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, style]}>{title}</Text>
      {actionLabel ? (
        <Text style={styles.action} onPress={onActionPress}>
          {actionLabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.s,
    marginTop: SPACING.l,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.l,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  action: {
    fontSize: TYPOGRAPHY.fontSize.s,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary,
  },
});
