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
  useWindowDimensions,
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
  const { width } = useWindowDimensions();
  const horizontalPadding = width < 340 ? SPACING.s : width >= 768 ? SPACING.l : SPACING.m;
  const orbSize = Math.min(Math.max(width * 0.82, 280), 520);

  const inner = scrollable ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, { paddingHorizontal: horizontalPadding }, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <View
        pointerEvents="none"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.backgroundDepth}
      >
        <View style={[styles.ambientOrb, styles.backOrb, { width: orbSize, height: orbSize, borderRadius: orbSize / 2 }]} />
        <View style={[styles.ambientOrb, styles.frontOrb, { width: orbSize * 0.7, height: orbSize * 0.7, borderRadius: orbSize }]} />
        <View style={[styles.orbHighlight, { width: orbSize * 0.23, height: orbSize * 0.08, borderRadius: orbSize }]} />
        <View
          style={[
            styles.liquidWindow,
            {
              width: orbSize * 0.95,
              height: orbSize * 0.5,
              borderRadius: orbSize * 0.2,
              top: '22%',
              right: -orbSize * 0.46,
              transform: [{ rotate: '-18deg' }],
            },
          ]}
        >
          <View style={styles.liquidWindowGlint} />
          <View style={styles.liquidWindowEdge} />
        </View>
        <View
          style={[
            styles.liquidWindow,
            styles.liquidWindowLower,
            {
              width: orbSize * 0.72,
              height: orbSize * 0.38,
              borderRadius: orbSize * 0.16,
              bottom: '20%',
              left: -orbSize * 0.34,
              transform: [{ rotate: '16deg' }],
            },
          ]}
        >
          <View style={styles.liquidWindowGlint} />
          <View style={styles.liquidWindowEdge} />
        </View>
      </View>
      {inner}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    overflow: 'hidden',
  },
  backgroundDepth: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  ambientOrb: {
    position: 'absolute',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 48,
    elevation: 14,
  },
  backOrb: {
    top: -170,
    right: -170,
    backgroundColor: 'rgba(0, 194, 168, 0.045)',
    borderColor: 'rgba(0, 194, 168, 0.10)',
    shadowColor: '#00C2A8',
  },
  frontOrb: {
    left: -150,
    bottom: -220,
    backgroundColor: 'rgba(26, 108, 245, 0.035)',
    borderColor: 'rgba(56, 189, 248, 0.07)',
    shadowColor: '#1A6CF5',
  },
  orbHighlight: {
    position: 'absolute',
    top: 44,
    right: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
  },
  liquidWindow: {
    position: 'absolute',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(191, 239, 255, 0.14)',
    backgroundColor: 'rgba(126, 211, 238, 0.025)',
    shadowColor: '#75D8F0',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 34,
    elevation: 8,
  },
  liquidWindowLower: {
    borderColor: 'rgba(140, 190, 255, 0.11)',
    backgroundColor: 'rgba(63, 112, 205, 0.025)',
    shadowColor: '#4A83E8',
  },
  liquidWindowGlint: {
    position: 'absolute',
    top: 1,
    left: '12%',
    right: '12%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  liquidWindowEdge: {
    position: 'absolute',
    top: '16%',
    right: '10%',
    width: '30%',
    height: '70%',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.018)',
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
