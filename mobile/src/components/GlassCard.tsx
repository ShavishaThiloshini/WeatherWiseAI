import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, BORDER_RADIUS, SPACING } from '../constants/theme';

interface GlassCardProps {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
}

export function GlassCard({ children, style, intensity = 20 }: GlassCardProps) {
  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.l,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Subtle white tint
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)', // Glass reflection edge
  },
  content: {
    padding: SPACING.m,
  },
});

