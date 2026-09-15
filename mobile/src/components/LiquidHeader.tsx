import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

interface LiquidHeaderProps {
  locationName: string;
  dateString: string;
}

export function LiquidHeader({ locationName, dateString }: LiquidHeaderProps) {
  const insets = useSafeAreaInsets();
  const animValue = useSharedValue(0);

  useEffect(() => {
    animValue.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.linear }),
      -1, // infinite
      true // yoyo
    );
  }, [animValue]);

  const animatedOrb1 = useAnimatedStyle(() => {
    const translateX = interpolate(animValue.value, [0, 1], [-50, 100]);
    const translateY = interpolate(animValue.value, [0, 1], [-20, 50]);
    return { transform: [{ translateX }, { translateY }] };
  });

  const animatedOrb2 = useAnimatedStyle(() => {
    const translateX = interpolate(animValue.value, [0, 1], [100, -50]);
    const translateY = interpolate(animValue.value, [0, 1], [50, -20]);
    return { transform: [{ translateX }, { translateY }] };
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Animated fluid orbs behind the glass */}
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[styles.orb, styles.orb1, animatedOrb1]}>
          <LinearGradient
            colors={['#4facfe', '#00f2fe']}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View style={[styles.orb, styles.orb2, animatedOrb2]}>
          <LinearGradient
            colors={['#b8c6db', '#f5f7fa']}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />

      {/* Content */}
      <View style={styles.content}>
        <View>
          <Text style={styles.appName}>WeatherWise</Text>
          <Text style={styles.dateText}>{dateString}</Text>
        </View>
        <View style={styles.locationBadge}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText}>{locationName}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Base dark tint
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.m,
    paddingBottom: SPACING.m,
    paddingTop: SPACING.s,
  },
  appName: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.extraBold,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingHorizontal: SPACING.s,
    paddingVertical: SPACING.xs,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  locationIcon: {
    fontSize: 14,
  },
  locationText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  // Orbs for liquid background
  orb: {
    position: 'absolute',
    borderRadius: 200,
    opacity: 0.6,
  },
  orb1: {
    width: 250,
    height: 250,
    top: -50,
    left: -50,
  },
  orb2: {
    width: 200,
    height: 200,
    bottom: -50,
    right: -20,
  },
});

