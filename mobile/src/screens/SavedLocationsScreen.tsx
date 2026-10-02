import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/ScreenContainer';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { listSavedLocations, saveLocation, type SavedLocation } from '../services/locationService';

const STORAGE_KEY = 'weatherwise.saved-locations.v1';

const DEFAULT_LOCATIONS: SavedLocation[] = [
  {
    id: 1,
    label: 'Home',
    latitude: 6.9271,
    longitude: 79.8612,
    timezone: 'Asia/Colombo',
    is_default: true,
  },
  {
    id: 2,
    label: 'Workplace',
    latitude: 6.9157,
    longitude: 79.8571,
    timezone: 'Asia/Colombo',
    is_default: false,
  },
  {
    id: 3,
    label: 'Parents\' House',
    latitude: 6.0535,
    longitude: 80.2200,
    timezone: 'Asia/Colombo',
    is_default: false,
  },
];

function formatCoordinates(latitude: number, longitude: number) {
  return `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
}

function normalizeLocations(items: SavedLocation[]) {
  const hasDefault = items.some((location) => location.is_default);
  if (!hasDefault && items.length > 0) {
    return items.map((location, index) => ({
      ...location,
      is_default: index === 0,
    }));
  }

  return items;
}

export function SavedLocationsScreen() {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [latitude, setLatitude] = useState('6.9271');
  const [longitude, setLongitude] = useState('79.8612');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!active) return;

        if (stored) {
          const parsed = JSON.parse(stored) as SavedLocation[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLocations(normalizeLocations(parsed));
            return;
          }
        }

        try {
          const remoteLocations = await listSavedLocations();
          if (active && remoteLocations.length > 0) {
            setLocations(normalizeLocations(remoteLocations));
            return;
          }
        } catch {
          // Fall back to the seeded local list when the backend is unavailable.
        }

        if (active) {
          setLocations(DEFAULT_LOCATIONS);
        }
      } catch {
        if (active) setLocations(DEFAULT_LOCATIONS);
      } finally {
        if (active) setIsHydrated(true);
      }
    };

    void hydrate();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(locations)).catch(() => undefined);
  }, [isHydrated, locations]);

  const resetForm = () => {
    setLabel('');
    setLatitude('6.9271');
    setLongitude('79.8612');
    setIsDefault(false);
    setIsAddOpen(false);
  };

  const handleSaveLocation = async () => {
    const trimmedLabel = label.trim();
    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    if (!trimmedLabel) {
      Alert.alert('Missing label', 'Give this saved place a name so it is easy to recognize.');
      return;
    }

    if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
      Alert.alert('Invalid coordinates', 'Latitude and longitude must be numeric values.');
      return;
    }

    if (parsedLatitude < -90 || parsedLatitude > 90 || parsedLongitude < -180 || parsedLongitude > 180) {
      Alert.alert('Invalid coordinates', 'Latitude must be between -90 and 90 and longitude between -180 and 180.');
      return;
    }

    const nextLocation: Omit<SavedLocation, 'id'> = {
      label: trimmedLabel,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      timezone: 'Asia/Colombo',
      is_default: isDefault || locations.length === 0,
    };

    try {
      const created = await saveLocation(nextLocation);
      setLocations((current) => {
        const next = created.is_default
          ? [{ ...created }, ...current.filter((item) => item.id !== created.id).map((item) => ({ ...item, is_default: false }))]
          : [{ ...created }, ...current];
        return normalizeLocations(next);
      });
    } catch {
      const fallbackLocation: SavedLocation = {
        id: Date.now(),
        ...nextLocation,
      };
      setLocations((current) => {
        const next = [...current, fallbackLocation];
        return normalizeLocations(next);
      });
    }

    resetForm();
  };

  const handleSetDefault = (locationId: number) => {
    setLocations((current) => current.map((location) => ({
      ...location,
      is_default: location.id === locationId,
    })));
  };

  const handleDelete = (locationId: number) => {
    const location = locations.find((item) => item.id === locationId);
    if (!location) return;

    Alert.alert('Remove saved location?', `Delete ${location.label}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setLocations((current) => {
            const remaining = current.filter((item) => item.id !== locationId);
            if (remaining.length === 0) return remaining;
            if (location.is_default && !remaining.some((item) => item.is_default)) {
              return remaining.map((item, index) => ({
                ...item,
                is_default: index === 0,
              }));
            }
            return remaining;
          });
        },
      },
    ]);
  };

  const defaultLocation = locations.find((location) => location.is_default) ?? null;

  return (
    <ScreenContainer scrollable contentStyle={styles.screen}>
      <View style={styles.heroCard}>
        <View>
          <Text style={styles.eyebrow}>MY PLACES</Text>
          <Text style={styles.title}>Saved locations</Text>
        </View>
        <Pressable accessibilityLabel="Add a saved location" onPress={() => setIsAddOpen(true)} style={styles.primaryButton}>
          <Ionicons name="add" size={18} color={COLORS.background} />
          <Text style={styles.primaryButtonText}>Add</Text>
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryTextWrap}>
          <Text style={styles.summaryLabel}>DEFAULT PLACE</Text>
          <Text style={styles.summaryTitle}>{defaultLocation ? defaultLocation.label : 'No default yet'}</Text>
          <Text style={styles.summarySubtitle}>
            {defaultLocation ? formatCoordinates(defaultLocation.latitude, defaultLocation.longitude) : 'Add a location to start planning around it.'}
          </Text>
        </View>
        <View style={styles.summaryIcon}><Text style={styles.summaryEmoji}>📍</Text></View>
      </View>

      {locations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={36} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>No saved locations yet</Text>
          <Text style={styles.emptySubtitle}>Save your home, office, or favorite travel spot to check the weather faster.</Text>
          <Pressable onPress={() => setIsAddOpen(true)} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Add your first place</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {locations.map((location) => (
            <View key={location.id} style={styles.locationCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.locationIdentity}>
                  <View style={styles.pinBadge}>
                    <Ionicons name="location" size={16} color={COLORS.primary} />
                  </View>
                  <View>
                    <Text style={styles.locationLabel}>{location.label}</Text>
                    <Text style={styles.locationMeta}>{formatCoordinates(location.latitude, location.longitude)}</Text>
                  </View>
                </View>
                {location.is_default ? (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.locationFooter}>
                <Text style={styles.timezone}>{location.timezone}</Text>
                <View style={styles.actionsRow}>
                  {!location.is_default ? (
                    <Pressable onPress={() => handleSetDefault(location.id)} style={styles.ghostButton}>
                      <Text style={styles.ghostButtonText}>Set default</Text>
                    </Pressable>
                  ) : null}
                  <Pressable onPress={() => handleDelete(location.id)} style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <Modal visible={isAddOpen} transparent animationType="slide" onRequestClose={resetForm}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add saved location</Text>
              <Pressable onPress={resetForm} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={COLORS.textPrimary} />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Location name</Text>
            <TextInput
              accessibilityLabel="Location name"
              autoCapitalize="words"
              autoCorrect={false}
              onChangeText={setLabel}
              placeholder="Home, Office, Studio"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
              value={label}
            />

            <View style={styles.coordinateRow}>
              <View style={styles.coordinateField}>
                <Text style={styles.inputLabel}>Latitude</Text>
                <TextInput
                  accessibilityLabel="Latitude"
                  keyboardType="decimal-pad"
                  onChangeText={setLatitude}
                  placeholder="6.9271"
                  placeholderTextColor={COLORS.textSecondary}
                  style={styles.input}
                  value={latitude}
                />
              </View>
              <View style={styles.coordinateField}>
                <Text style={styles.inputLabel}>Longitude</Text>
                <TextInput
                  accessibilityLabel="Longitude"
                  keyboardType="decimal-pad"
                  onChangeText={setLongitude}
                  placeholder="79.8612"
                  placeholderTextColor={COLORS.textSecondary}
                  style={styles.input}
                  value={longitude}
                />
              </View>
            </View>

            <Pressable onPress={() => setIsDefault((value) => !value)} style={styles.checkRow}>
              <View style={[styles.checkbox, isDefault && styles.checkboxChecked]}>
                {isDefault ? <Ionicons name="checkmark" size={16} color={COLORS.background} /> : null}
              </View>
              <Text style={styles.checkText}>Set as default location</Text>
            </Pressable>

            <Pressable onPress={() => void handleSaveLocation()} style={styles.modalActionButton}>
              <Text style={styles.modalActionText}>Save location</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: SPACING.m,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.l,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eyebrow: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    letterSpacing: 1.2,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.xs,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.m,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
  },
  primaryButtonText: {
    color: COLORS.background,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.m,
  },
  summaryCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.l,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTextWrap: {
    flex: 1,
    marginRight: SPACING.m,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    letterSpacing: 1.2,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  summaryTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.l,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    marginBottom: SPACING.xs,
  },
  summarySubtitle: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.s,
  },
  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryEmoji: {
    fontSize: 24,
  },
  list: {
    gap: SPACING.m,
  },
  locationCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.l,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  locationIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.s,
  },
  pinBadge: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationLabel: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.l,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    marginBottom: 2,
  },
  locationMeta: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.s,
  },
  defaultBadge: {
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.s,
    paddingVertical: 4,
    backgroundColor: COLORS.secondaryLight,
  },
  defaultBadgeText: {
    color: COLORS.secondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  locationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.s,
  },
  timezone: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.s,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  ghostButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.s,
    borderRadius: BORDER_RADIUS.m,
    backgroundColor: COLORS.primaryLight,
  },
  ghostButtonText: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.s,
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.l,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.m,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.l,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  secondaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.m,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
  },
  secondaryButtonText: {
    color: COLORS.background,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    fontSize: TYPOGRAPHY.fontSize.m,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  modalCard: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.l,
    paddingBottom: SPACING.xxl,
    gap: SPACING.m,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.s,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
  },
  coordinateRow: {
    flexDirection: 'row',
    gap: SPACING.m,
  },
  coordinateField: {
    flex: 1,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
  },
  checkText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.m,
  },
  modalActionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.m,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.m,
  },
  modalActionText: {
    color: COLORS.background,
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
});
