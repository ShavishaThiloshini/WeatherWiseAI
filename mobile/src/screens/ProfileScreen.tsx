/**
 * screens/ProfileScreen.tsx
 * Placeholder screen for user profile and app settings.
 * TODO (Day 2+): Implement user preferences (units, location, notifications),
 *               and any auth flow if required.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import type { ProfileStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'> & {
  onLogout?: () => void;
};

export function ProfileScreen({ navigation, onLogout }: Props) {
  return (
    <ScreenContainer>
      <View style={styles.center}>
        <Text style={styles.emoji}>⚙️</Text>
        <Text style={styles.title}>Profile & Settings Screen</Text>
        <Text style={styles.subtitle}>
          User profile, preferences, unit settings, and notifications will be configured here.{'\n'}
          (Day 2+ feature)
        </Text>
        <View style={styles.actions}>
          <Pressable style={styles.button} onPress={() => navigation.navigate('Plants')}>
            <Text style={styles.buttonText}>Open Plant Care</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('Assistant')}>
            <Text style={styles.secondaryButtonText}>Open AI Assistant</Text>
          </Pressable>
          {onLogout && (
            <Pressable style={styles.logoutButton} onPress={onLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </Pressable>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  emoji: { fontSize: 56, marginBottom: SPACING.m },
  title: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.textPrimary, marginBottom: SPACING.s },
  subtitle: { fontSize: TYPOGRAPHY.fontSize.m, color: COLORS.textSecondary, textAlign: 'center', lineHeight: TYPOGRAPHY.fontSize.m * 1.6 },
  actions: { alignItems: 'center', gap: SPACING.s, marginTop: SPACING.l },
  button: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: SPACING.l, paddingVertical: SPACING.m },
  buttonText: { color: COLORS.background, fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  secondaryButton: { borderColor: COLORS.primary, borderRadius: 8, borderWidth: 1, paddingHorizontal: SPACING.l, paddingVertical: SPACING.m },
  secondaryButtonText: { color: COLORS.primary, fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  logoutButton: { backgroundColor: COLORS.danger, borderRadius: 8, paddingHorizontal: SPACING.l, paddingVertical: SPACING.m },
  logoutButtonText: { color: COLORS.white, fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
});
