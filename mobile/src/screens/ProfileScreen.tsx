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
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import type { ProfileStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'> & {
  onLogout?: () => void;
};

const PROFILE_ACTIONS = [
  { key: 'locations', title: 'Saved locations', description: 'Manage places you check often', route: 'SavedLocations' as const },
  { key: 'plants', title: 'Plant care', description: 'Watering reminders and your garden', route: 'Plants' as const },
  { key: 'assistant', title: 'AI assistant', description: 'Ask for weather advice', route: 'Assistant' as const },
];

export function ProfileScreen({ navigation, onLogout }: Props) {
  return (
    <ScreenContainer scrollable contentStyle={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>PROFILE</Text>
          <Text style={styles.title}>Settings & tools</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>ACCOUNT</Text>
        <Text style={styles.accountName}>WeatherWise User</Text>
        <Text style={styles.accountMeta}>Personalized weather and location management</Text>
      </View>

      <View style={styles.list}>
        {PROFILE_ACTIONS.map((action) => (
          <Pressable
            key={action.key}
            accessibilityRole="button"
            onPress={() => navigation.navigate(action.route)}
            style={styles.actionCard}
          >
            <View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionDescription}>{action.description}</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </Pressable>
        ))}
      </View>

      {onLogout && (
        <Pressable style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: SPACING.m,
  },
  header: {
    marginBottom: SPACING.xs,
  },
  eyebrow: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    letterSpacing: 1.2,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.m,
  },
  cardLabel: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    letterSpacing: 1.2,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.xs,
  },
  accountName: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.l,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    marginBottom: SPACING.xs,
  },
  accountMeta: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.m,
    lineHeight: 22,
  },
  list: {
    gap: SPACING.m,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.m,
  },
  actionTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.l,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    marginBottom: SPACING.xs,
  },
  actionDescription: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.s,
    maxWidth: 240,
  },
  actionArrow: {
    color: COLORS.primary,
    fontSize: 28,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  logoutButton: {
    backgroundColor: COLORS.danger,
    borderRadius: BORDER_RADIUS.m,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    marginTop: SPACING.s,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    textAlign: 'center',
  },
});
