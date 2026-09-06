/**
 * components/ScreenContainer.tsx
 * Root container wrapper for all screens.
 * Handles safe area insets and optional scrollable content.
 */

import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../constants/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  /** If true, wraps children in a ScrollView */
  scrollable?: boolean;
  /** Extra styles applied to the inner content container */
  contentStyle?: StyleProp<ViewStyle>;
  /** Background color override */
  backgroundColor?: string;
}

export function ScreenContainer({
  children,
  scrollable = false,
  contentStyle,
  backgroundColor = COLORS.background,
}: ScreenContainerProps) {
  const inner = scrollable ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      {inner}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.m,
    paddingBottom: SPACING.xxl,
  },
  content: {
    flex: 1,
    padding: SPACING.m,
  },
});
