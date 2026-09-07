/**
 * screens/TravelScreen.tsx
 * Placeholder screen for travel safety information.
 * TODO (Day 2+): Implement travel risk scoring, route conditions, and safety alerts.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import type { TravelMapStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<TravelMapStackParamList, 'Travel'>;

export function TravelScreen({ navigation }: Props) {
  return (
    <ScreenContainer>
      <View style={styles.center}>
        <Text style={styles.emoji}>🚗</Text>
        <Text style={styles.title}>Travel Safety Screen</Text>
        <Text style={styles.subtitle}>
          Travel risk scores, road conditions, and safe-driving alerts will be shown here.{'\n'}
          (Day 2+ feature)
        </Text>
        <Pressable style={styles.button} onPress={() => navigation.navigate('Map')}>
          <Text style={styles.buttonText}>Open Weather Map</Text>
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
