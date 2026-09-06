/**
 * screens/AIAssistantScreen.tsx
 * Placeholder screen for the AI weather assistant chatbot.
 * TODO (Day 2+): Integrate the AI chat interface once the AI team provides the API.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

export function AIAssistantScreen() {
  return (
    <ScreenContainer>
      <View style={styles.center}>
        <Text style={styles.emoji}>🤖</Text>
        <Text style={styles.title}>AI Assistant Screen</Text>
        <Text style={styles.subtitle}>
          The WeatherWise AI chatbot will answer personalised weather questions here.{'\n'}
          (Day 2+ feature — requires AI team API)
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  emoji: { fontSize: 56, marginBottom: SPACING.m },
  title: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.textPrimary, marginBottom: SPACING.s },
  subtitle: { fontSize: TYPOGRAPHY.fontSize.m, color: COLORS.textSecondary, textAlign: 'center', lineHeight: TYPOGRAPHY.fontSize.m * 1.6 },
});
