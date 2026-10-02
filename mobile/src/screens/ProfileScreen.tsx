import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
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

function PreferenceSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function PreferenceSelector({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
}) {
  const handlePress = () => {
    const currentIndex = options.indexOf(value);
    onSelect(options[(currentIndex + 1) % options.length]);
  };

  return (
    <Pressable accessibilityRole="button" onPress={handlePress} style={styles.preferenceItem}>
      <Text style={styles.preferenceLabel}>{label}</Text>
      <View style={styles.selectorValueContainer}>
        <Text style={styles.selectorValueText}>{value}</Text>
      </View>
    </Pressable>
  );
}

export function ProfileScreen({ navigation, onLogout }: Props) {
  const [units, setUnits] = useState('Metric');
  const [coldTolerance, setColdTolerance] = useState('Medium');
  const [preferredActivity, setPreferredActivity] = useState('Walking');
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState('System');

  return (
    <ScreenContainer scrollable contentStyle={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>PROFILE</Text>
        <Text style={styles.title}>Settings & tools</Text>
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

      <PreferenceSection title="App preferences">
        <PreferenceSelector label="Theme" value={theme} options={['System', 'Light', 'Dark']} onSelect={setTheme} />
        <PreferenceSelector label="Units" value={units} options={['Metric', 'Imperial']} onSelect={setUnits} />
      </PreferenceSection>

      <PreferenceSection title="Personalization">
        <PreferenceSelector label="Cold tolerance" value={coldTolerance} options={['Low', 'Medium', 'High']} onSelect={setColdTolerance} />
        <PreferenceSelector label="Preferred activity" value={preferredActivity} options={['Walking', 'Running', 'Cycling']} onSelect={setPreferredActivity} />
      </PreferenceSection>

      <PreferenceSection title="Notifications">
        <View style={styles.preferenceItem}>
          <Text style={styles.preferenceLabel}>Enable notifications</Text>
          <Switch
            accessibilityLabel="Enable notifications"
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.white}
          />
        </View>
      </PreferenceSection>

      {onLogout ? (
        <Pressable style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
      ) : null}
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
    flexShrink: 1,
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
  section: {
    marginBottom: SPACING.s,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.s,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.s,
    marginLeft: SPACING.xs,
  },
  sectionContent: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.m,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
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
  selectorValueContainer: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.s,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.s,
  },
  selectorValueText: {
    fontSize: TYPOGRAPHY.fontSize.m,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
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
