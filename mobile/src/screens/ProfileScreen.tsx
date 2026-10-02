import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, Switch, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import type { ProfileStackParamList } from '../navigation/RootNavigator';
import { getCurrentUser, AuthResponse } from '../services/authService';
import {
  DEFAULT_USER_PREFERENCES,
  PREFERENCE_OPTIONS,
  USER_PREFERENCES_STORAGE_KEY,
  cyclePreferenceOption,
  parseUserPreferences,
  serializeUserPreferences,
  updateUserPreference,
  type UserPreferences,
} from '../utils/userPreferences';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'> & {
  onLogout?: () => void;
};

// --- Reusable UI Components ---

function ProfileHeader({ name, email }: { name: string; email: string }) {
  return (
    <View style={styles.profileHeader}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
      </View>
      <View>
        <Text style={styles.profileName}>{name}</Text>
        <Text style={styles.profileEmail}>{email}</Text>
      </View>
    </View>
  );
}

function PreferenceSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
}

function PreferenceToggle({ label, value, onValueChange, disabled = false }: { label: string; value: boolean; onValueChange: (val: boolean) => void; disabled?: boolean }) {
  return (
    <View style={styles.preferenceItem}>
      <Text style={styles.preferenceLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: COLORS.border, true: COLORS.primary }}
        thumbColor={COLORS.white}
      />
    </View>
  );
}

function PreferenceSelector<T extends string>({ label, value, options, onSelect, disabled = false }: { label: string; value: T; options: readonly T[]; onSelect: (val: T) => void; disabled?: boolean }) {
  const handlePress = () => {
    onSelect(cyclePreferenceOption(value, options));
  };

  return (
    <Pressable disabled={disabled} style={[styles.preferenceItem, disabled && styles.preferenceDisabled]} onPress={handlePress}>
      <Text style={styles.preferenceLabel}>{label}</Text>
      <View style={styles.selectorValueContainer}>
        <Text style={styles.selectorValueText}>{value}</Text>
      </View>
    </Pressable>
  );
}

function AccountAction({ label, onPress, isDestructive = false }: { label: string; onPress: () => void; isDestructive?: boolean }) {
  return (
    <Pressable style={styles.accountAction} onPress={onPress}>
      <Text style={[styles.accountActionText, isDestructive && styles.destructiveText]}>{label}</Text>
    </Pressable>
  );
}

// --- Main Screen ---

export function ProfileScreen({ navigation, onLogout }: Props) {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [preferenceError, setPreferenceError] = useState<string | null>(null);
  const preferencesRef = useRef(preferences);
  const saveQueue = useRef(Promise.resolve());

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(USER_PREFERENCES_STORAGE_KEY)
      .then((stored) => {
        if (!active) return;
        const loaded = parseUserPreferences(stored);
        preferencesRef.current = loaded;
        setPreferences(loaded);
      })
      .catch((storageError: unknown) => {
        if (active) {
          setPreferenceError(storageError instanceof Error ? storageError.message : 'Could not load your preferences.');
        }
      })
      .finally(() => {
        if (active) setPreferencesReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const setPreference = <K extends keyof UserPreferences,>(key: K, value: UserPreferences[K]) => {
    const updated = updateUserPreference(preferencesRef.current, key, value);
    preferencesRef.current = updated;
    setPreferences(updated);
    setPreferenceError(null);
    if (!preferencesReady) return;
    saveQueue.current = saveQueue.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem(USER_PREFERENCES_STORAGE_KEY, serializeUserPreferences(updated)))
      .catch((storageError: unknown) => {
        setPreferenceError(storageError instanceof Error ? storageError.message : 'Could not save your preferences.');
      });
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.stateText}>Loading profile...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={fetchUser}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : user ? (
          <ProfileHeader name={user.name} email={user.email} />
        ) : null}

        <PreferenceSection title="App Preferences">
          <PreferenceSelector 
            label="Theme" 
            value={preferences.theme}
            options={PREFERENCE_OPTIONS.theme}
            onSelect={(value) => setPreference('theme', value)}
            disabled={!preferencesReady}
          />
          <PreferenceSelector 
            label="Units" 
            value={preferences.units}
            options={PREFERENCE_OPTIONS.units}
            onSelect={(value) => setPreference('units', value)}
            disabled={!preferencesReady}
          />
        </PreferenceSection>

        <PreferenceSection title="Personalization">
          <PreferenceSelector 
            label="Cold Tolerance" 
            value={preferences.coldTolerance}
            options={PREFERENCE_OPTIONS.coldTolerance}
            onSelect={(value) => setPreference('coldTolerance', value)}
            disabled={!preferencesReady}
          />
          <PreferenceSelector 
            label="Preferred Activity" 
            value={preferences.preferredActivity}
            options={PREFERENCE_OPTIONS.preferredActivity}
            onSelect={(value) => setPreference('preferredActivity', value)}
            disabled={!preferencesReady}
          />
        </PreferenceSection>

        <PreferenceSection title="Location Settings">
          <Pressable style={styles.preferenceItem} onPress={() => navigation.navigate('SavedLocations')}>
            <View>
              <Text style={styles.preferenceLabel}>Saved Locations</Text>
              <Text style={styles.preferenceHint}>Manage places and default forecast</Text>
            </View>
            <Text style={styles.navArrow}>›</Text>
          </Pressable>
          <Pressable style={styles.preferenceItem} onPress={() => navigation.navigate('Plants')}>
            <Text style={styles.preferenceLabel}>Plant Care Settings</Text>
            <Text style={styles.navArrow}>›</Text>
          </Pressable>
        </PreferenceSection>

        <PreferenceSection title="Notifications">
          <PreferenceToggle 
            label="Enable Notifications" 
            value={preferences.notifications}
            onValueChange={(value) => setPreference('notifications', value)}
            disabled={!preferencesReady}
          />
        </PreferenceSection>
        {preferenceError && (
          <Text accessibilityRole="alert" style={styles.preferenceError}>
            Preference storage issue: {preferenceError}
          </Text>
        )}

        <PreferenceSection title="Account">
          {onLogout && (
            <AccountAction label="Logout" onPress={onLogout} isDestructive />
          )}
        </PreferenceSection>

      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: SPACING.m,
    paddingBottom: SPACING.xxl,
  },
  centerState: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    marginTop: SPACING.m,
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.m,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: TYPOGRAPHY.fontSize.m,
    textAlign: 'center',
    marginBottom: SPACING.m,
  },
  retryButton: {
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.l,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.backgroundCard,
    padding: SPACING.l,
    borderRadius: 16,
    ...SHADOWS.card,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.m,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  profileName: {
    fontSize: TYPOGRAPHY.fontSize.l,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: TYPOGRAPHY.fontSize.m,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: SPACING.l,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.s,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.s,
    marginLeft: SPACING.xs,
  },
  sectionContent: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 12,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  preferenceDisabled: {
    opacity: 0.6,
  },
  preferenceLabel: {
    fontSize: TYPOGRAPHY.fontSize.m,
    color: COLORS.textPrimary,
  },
  preferenceHint: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  preferenceError: {
    color: COLORS.danger,
    fontSize: TYPOGRAPHY.fontSize.s,
    marginBottom: SPACING.m,
  },
  selectorValueContainer: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.s,
    paddingVertical: 4,
    borderRadius: 8,
  },
  selectorValueText: {
    fontSize: TYPOGRAPHY.fontSize.m,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  navArrow: {
    fontSize: 20,
    color: COLORS.textSecondary,
  },
  accountAction: {
    padding: SPACING.m,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  accountActionText: {
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.primary,
  },
  destructiveText: {
    color: COLORS.danger,
  },
});
