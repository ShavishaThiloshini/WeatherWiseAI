/**
 * screens/ForecastScreen.tsx
 * Placeholder screen for 7-day weather forecast.
 * TODO (Day 2+): Implement hourly and daily forecast lists using ForecastData.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import type { RootStackParamList } from '../navigation/RootNavigator';

export function ForecastScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <ScreenContainer>
      <View style={styles.center}>
        <Text style={styles.emoji}>📅</Text>
        <Text style={styles.title}>Forecast Screen</Text>
        <Text style={styles.subtitle}>
          7-day hourly and daily forecast will be displayed here.{'\n'}
          (Day 2+ feature)
        </Text>
        <Pressable style={styles.button} onPress={() => navigation.navigate('WeatherDetails')}>
          <Text style={styles.buttonText}>View Current Weather</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  emoji: { fontSize: 56, marginBottom: SPACING.m },
  title: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.textPrimary, marginBottom: SPACING.s },
  subtitle: { fontSize: TYPOGRAPHY.fontSize.m, color: COLORS.textSecondary, textAlign: 'center', lineHeight: TYPOGRAPHY.fontSize.m * 1.6 },
  button: { backgroundColor: COLORS.primary, borderRadius: 8, marginTop: SPACING.l, paddingHorizontal: SPACING.l, paddingVertical: SPACING.m },
  buttonText: { color: COLORS.background, fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
});
