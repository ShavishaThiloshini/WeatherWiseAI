export const USER_PREFERENCES_STORAGE_KEY = 'weatherwise.user-preferences.v1';

export const PREFERENCE_OPTIONS = {
  theme: ['System', 'Light', 'Dark'],
  units: ['Metric', 'Imperial'],
  coldTolerance: ['Low', 'Medium', 'High'],
  preferredActivity: ['Walking', 'Running', 'Cycling'],
} as const;

export interface UserPreferences {
  theme: (typeof PREFERENCE_OPTIONS.theme)[number];
  units: (typeof PREFERENCE_OPTIONS.units)[number];
  coldTolerance: (typeof PREFERENCE_OPTIONS.coldTolerance)[number];
  preferredActivity: (typeof PREFERENCE_OPTIONS.preferredActivity)[number];
  notifications: boolean;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'System',
  units: 'Metric',
  coldTolerance: 'Medium',
  preferredActivity: 'Walking',
  notifications: true,
};

export function updateUserPreference<K extends keyof UserPreferences>(
  preferences: UserPreferences,
  key: K,
  value: UserPreferences[K],
): UserPreferences {
  return { ...preferences, [key]: value };
}

export function cyclePreferenceOption<T extends string>(current: T, options: readonly T[]): T {
  if (options.length === 0) throw new Error('Preference options must not be empty.');
  const currentIndex = options.indexOf(current);
  return options[(currentIndex + 1) % options.length];
}

function isOption<T extends readonly string[]>(value: unknown, options: T): value is T[number] {
  return typeof value === 'string' && options.some((option) => option === value);
}

export function parseUserPreferences(serialized: string | null): UserPreferences {
  if (serialized === null) return { ...DEFAULT_USER_PREFERENCES };

  let stored: unknown;
  try {
    stored = JSON.parse(serialized);
  } catch {
    return { ...DEFAULT_USER_PREFERENCES };
  }

  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) {
    return { ...DEFAULT_USER_PREFERENCES };
  }

  const values = stored as Record<string, unknown>;
  return {
    theme: isOption(values.theme, PREFERENCE_OPTIONS.theme) ? values.theme : DEFAULT_USER_PREFERENCES.theme,
    units: isOption(values.units, PREFERENCE_OPTIONS.units) ? values.units : DEFAULT_USER_PREFERENCES.units,
    coldTolerance: isOption(values.coldTolerance, PREFERENCE_OPTIONS.coldTolerance)
      ? values.coldTolerance
      : DEFAULT_USER_PREFERENCES.coldTolerance,
    preferredActivity: isOption(values.preferredActivity, PREFERENCE_OPTIONS.preferredActivity)
      ? values.preferredActivity
      : DEFAULT_USER_PREFERENCES.preferredActivity,
    notifications: typeof values.notifications === 'boolean'
      ? values.notifications
      : DEFAULT_USER_PREFERENCES.notifications,
  };
}

export function serializeUserPreferences(preferences: UserPreferences): string {
  return JSON.stringify(preferences);
}
