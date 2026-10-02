import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, Switch, ScrollView, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import type { ProfileStackParamList } from '../navigation/RootNavigator';
import { getCurrentUser, AuthResponse } from '../services/authService';

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

function PreferenceToggle({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (val: boolean) => void }) {
  return (
    <View style={styles.preferenceItem}>
      <Text style={styles.preferenceLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: COLORS.border, true: COLORS.primary }}
        thumbColor={COLORS.white}
      />
    </View>
  );
}

function PreferenceSelector({ label, value, options, onSelect }: { label: string; value: string; options: string[]; onSelect: (val: string) => void }) {
  // Simple cyclic selector for this demo, tapping it cycles through options
  const handlePress = () => {
    const currentIndex = options.indexOf(value);
    const nextIndex = (currentIndex + 1) % options.length;
    onSelect(options[nextIndex]);
  };

  return (
    <Pressable style={styles.preferenceItem} onPress={handlePress}>
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

  // Preference States
  const [units, setUnits] = useState('Metric');
  const [coldTolerance, setColdTolerance] = useState('Medium');
  const [preferredActivity, setPreferredActivity] = useState('Walking');
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState('System');

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
            value={theme} 
            options={['System', 'Light', 'Dark']} 
            onSelect={setTheme} 
          />
          <PreferenceSelector 
            label="Units" 
            value={units} 
            options={['Metric', 'Imperial']} 
            onSelect={setUnits} 
          />
        </PreferenceSection>

        <PreferenceSection title="Personalization">
          <PreferenceSelector 
            label="Cold Tolerance" 
            value={coldTolerance} 
            options={['Low', 'Medium', 'High']} 
            onSelect={setColdTolerance} 
          />
          <PreferenceSelector 
            label="Preferred Activity" 
            value={preferredActivity} 
            options={['Walking', 'Running', 'Cycling']} 
            onSelect={setPreferredActivity} 
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
            value={notifications} 
            onValueChange={setNotifications} 
          />
        </PreferenceSection>

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
  preferenceLabel: {
    fontSize: TYPOGRAPHY.fontSize.m,
    color: COLORS.textPrimary,
  },
  preferenceHint: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 4,
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
