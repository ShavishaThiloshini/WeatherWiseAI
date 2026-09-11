/**
 * screens/ProfileScreen.tsx
 * User profile, account settings, and navigation hub for WeatherWise AI.
 *
 * Day 27 Integration:
 *  - Displays authenticated user's name and email (decoded from stored JWT via /auth/me)
 *  - Fetches and displays user preferences from GET /api/v1/users/preferences
 *  - Links to Plants, AI Assistant, and Weather History sub-screens
 *  - Logout button calls onLogout() to clear token and return to AuthScreen
 */

import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { apiFetch } from '../services/api';
import type { ProfileStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'> & {
  onLogout?: () => void;
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

interface UserPreferences {
  cold_tolerance?: string;
  preferred_activity?: string;
  preferred_activity_time?: string;
  units?: string;
  notifications_enabled?: boolean;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function NavRow({
  icon,
  label,
  subtitle,
  onPress,
}: {
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.navRow}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.navIcon}>
        <Text style={styles.navIconText}>{icon}</Text>
      </View>
      <View style={styles.navText}>
        <Text style={styles.navLabel}>{label}</Text>
        {subtitle ? <Text style={styles.navSubtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.navChevron}>›</Text>
    </TouchableOpacity>
  );
}

function PrefRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.prefRow}>
      <Text style={styles.prefLabel}>{label}</Text>
      <Text style={styles.prefValue}>{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function ProfileScreen({ navigation, onLogout }: Props) {
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [prefs, setPrefs] = React.useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [userRes, prefRes] = await Promise.allSettled([
          apiFetch<{ user: UserProfile }>('/auth/me'),
          apiFetch<{ preferences: UserPreferences }>('/users/preferences'),
        ]);
        if (userRes.status === 'fulfilled') setUser(userRes.value.user);
        if (prefRes.status === 'fulfilled') setPrefs(prefRes.value.preferences);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: onLogout,
        },
      ],
    );
  };

  return (
    <ScreenContainer scrollable>
      {/* ---- Account header ---- */}
      <View style={styles.accountHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user ? user.name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.accountInfo}>
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : user ? (
            <>
              <Text style={styles.accountName}>{user.name}</Text>
              <Text style={styles.accountEmail}>{user.email}</Text>
            </>
          ) : (
            <Text style={styles.accountEmail}>Unable to load profile</Text>
          )}
        </View>
      </View>

      {/* ---- Navigation links ---- */}
      <ProfileSection title="My Weather">
        <NavRow
          icon="🌿"
          label="My Plants"
          subtitle="Watering recommendations"
          onPress={() => navigation.navigate('Plants')}
        />
        <View style={styles.rowDivider} />
        <NavRow
          icon="🤖"
          label="AI Assistant"
          subtitle="Ask weather questions"
          onPress={() => navigation.navigate('Assistant')}
        />
      </ProfileSection>

      {/* ---- Preferences ---- */}
      {prefs && (
        <ProfileSection title="My Preferences">
          {prefs.units && (
            <PrefRow label="Units" value={prefs.units === 'imperial' ? 'Imperial (°F, mph)' : 'Metric (°C, km/h)'} />
          )}
          {prefs.cold_tolerance && (
            <PrefRow label="Cold Tolerance" value={prefs.cold_tolerance.charAt(0).toUpperCase() + prefs.cold_tolerance.slice(1)} />
          )}
          {prefs.preferred_activity && (
            <PrefRow label="Preferred Activity" value={prefs.preferred_activity.charAt(0).toUpperCase() + prefs.preferred_activity.slice(1)} />
          )}
          {prefs.preferred_activity_time && (
            <PrefRow label="Activity Time" value={prefs.preferred_activity_time} />
          )}
          {prefs.notifications_enabled !== undefined && (
            <PrefRow label="Notifications" value={prefs.notifications_enabled ? 'Enabled' : 'Disabled'} />
          )}
        </ProfileSection>
      )}

      {/* ---- Account actions ---- */}
      <ProfileSection title="Account">
        {onLogout && (
          <TouchableOpacity
            style={styles.logoutRow}
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Log out"
          >
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        )}
      </ProfileSection>

      {/* ---- App info ---- */}
      <Text style={styles.appInfo}>WeatherWise AI — v1.0.0</Text>
    </ScreenContainer>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.l,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    gap: SPACING.m,
    ...SHADOWS.subtle,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  accountInfo: { flex: 1 },
  accountName: {
    fontSize: TYPOGRAPHY.fontSize.l,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  accountEmail: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.textSecondary,
  },

  // Sections
  section: { marginBottom: SPACING.m },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.s,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  sectionCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.m,
    overflow: 'hidden',
    ...SHADOWS.subtle,
  },
  rowDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.m,
  },

  // Nav rows
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    gap: SPACING.m,
    minHeight: 56,
  },
  navIcon: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.s,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconText: { fontSize: 20 },
  navText: { flex: 1 },
  navLabel: {
    fontSize: TYPOGRAPHY.fontSize.m,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  navSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  navChevron: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },

  // Preference rows
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  prefLabel: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.textSecondary,
  },
  prefValue: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  // Logout
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    gap: SPACING.m,
    minHeight: 56,
  },
  logoutIcon: { fontSize: 20 },
  logoutText: {
    fontSize: TYPOGRAPHY.fontSize.m,
    color: COLORS.danger,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  appInfo: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.s,
  },
});
