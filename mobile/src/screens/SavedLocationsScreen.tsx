import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/ScreenContainer';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import {
  deleteSavedLocation,
  getCurrentLocation,
  listSavedLocations,
  saveLocation,
  searchPlaces,
  updateSavedLocation,
  type PlaceSearchResult,
  type SavedLocation,
} from '../services/locationService';

type LocationDraft = {
  label: string;
  latitude: number;
  longitude: number;
};

function shortPlaceName(label: string) {
  return label.split(',').slice(0, 2).join(',').trim();
}

export function SavedLocationsScreen() {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<SavedLocation | null>(null);
  const [placeQuery, setPlaceQuery] = useState('');
  const [label, setLabel] = useState('');
  const [draft, setDraft] = useState<LocationDraft | null>(null);
  const [placeResults, setPlaceResults] = useState<PlaceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  const loadLocations = useCallback(async () => {
    setIsLoading(true);
    setScreenError(null);
    try {
      setLocations(await listSavedLocations());
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : 'Could not load saved locations.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLocations();
  }, [loadLocations]);

  const openAddEditor = () => {
    setEditingLocation(null);
    setPlaceQuery('');
    setLabel('');
    setDraft(null);
    setPlaceResults([]);
    setEditorError(null);
    setIsEditorOpen(true);
  };

  const openRenameEditor = (location: SavedLocation) => {
    setEditingLocation(location);
    setPlaceQuery('');
    setLabel(location.label);
    setDraft({ label: location.label, latitude: location.latitude, longitude: location.longitude });
    setPlaceResults([]);
    setEditorError(null);
    setIsEditorOpen(true);
  };

  const searchForPlaces = async () => {
    const query = placeQuery.trim();
    if (query.length < 2 || query.length > 120) {
      setEditorError('Search must be between 2 and 120 characters.');
      return;
    }
    setIsSearching(true);
    setEditorError(null);
    try {
      const results = await searchPlaces(query);
      setPlaceResults(results);
      if (results.length === 0) setEditorError('No places found. Try a nearby city or a more specific search.');
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : 'Place search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const useDeviceLocation = async () => {
    setIsSearching(true);
    setEditorError(null);
    try {
      const current = await getCurrentLocation();
      const place = {
        label: current.displayName,
        latitude: current.latitude,
        longitude: current.longitude,
      };
      setDraft(place);
      setLabel(shortPlaceName(place.label));
      setPlaceResults([]);
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : 'Could not determine your current location.');
    } finally {
      setIsSearching(false);
    }
  };

  const choosePlace = (place: PlaceSearchResult) => {
    setDraft(place);
    setLabel(place.name || shortPlaceName(place.label));
    setEditorError(null);
  };

  const saveDraft = async () => {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      setEditorError('Add a name for this location.');
      return;
    }
    if (!editingLocation && !draft) {
      setEditorError('Search for a place or use your current location first.');
      return;
    }
    setIsSaving(true);
    setEditorError(null);
    try {
      if (editingLocation) {
        await updateSavedLocation(editingLocation.id, { label: trimmedLabel });
      } else if (draft) {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        await saveLocation({
          label: trimmedLabel,
          latitude: draft.latitude,
          longitude: draft.longitude,
          timezone,
          isDefault: locations.length === 0,
        });
      }
      setIsEditorOpen(false);
      await loadLocations();
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : 'Could not save this location.');
    } finally {
      setIsSaving(false);
    }
  };

  const makeDefault = async (location: SavedLocation) => {
    try {
      const updated = await updateSavedLocation(location.id, { isDefault: true });
      setLocations((current) => current.map((item) => ({ ...item, isDefault: item.id === updated.id })));
    } catch (error) {
      Alert.alert('Could not update default', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const confirmDelete = (location: SavedLocation) => {
    Alert.alert('Remove saved location?', `Remove ${location.label} from your saved locations?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSavedLocation(location.id);
            await loadLocations();
          } catch (error) {
            Alert.alert('Could not remove location', error instanceof Error ? error.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <ScreenContainer scrollable contentStyle={styles.screen}>
      <View style={styles.topLine}>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>PERSONALIZE YOUR FORECAST</Text>
          <Text style={styles.heading}>Saved locations</Text>
          <Text style={styles.subtitle}>Keep the places that matter close at hand.</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Add a location" onPress={openAddEditor} style={styles.addButton}>
          <Ionicons name="add" size={22} color={COLORS.white} />
        </Pressable>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryIcon}><Ionicons name="navigate" size={23} color={COLORS.info} /></View>
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryTitle}>Your places, one forecast</Text>
          <Text style={styles.summaryText}>Choose a default location for the weather you see first.</Text>
        </View>
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Your locations</Text>
        <Text style={styles.locationCount}>{locations.length} saved</Text>
      </View>

      {isLoading ? (
        <View style={styles.stateCard}>
          <ActivityIndicator color={COLORS.info} />
          <Text style={styles.stateText}>Loading your locations...</Text>
        </View>
      ) : screenError ? (
        <View style={styles.stateCard}>
          <Ionicons name="cloud-offline-outline" size={30} color={COLORS.warning} />
          <Text style={styles.emptyTitle}>Couldn't load locations</Text>
          <Text style={styles.stateText}>{screenError}</Text>
          <Pressable accessibilityRole="button" onPress={() => void loadLocations()} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : locations.length === 0 ? (
        <View style={styles.stateCard}>
          <View style={styles.emptyIcon}><Ionicons name="location-outline" size={27} color={COLORS.info} /></View>
          <Text style={styles.emptyTitle}>No saved places yet</Text>
          <Text style={styles.stateText}>Add your home, work, or anywhere you want to check the weather.</Text>
          <Pressable accessibilityRole="button" onPress={openAddEditor} style={styles.emptyAction}>
            <Ionicons name="add" size={18} color={COLORS.white} />
            <Text style={styles.emptyActionText}>Add your first location</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.locationList}>
          {locations.map((location) => (
            <View key={String(location.id)} style={styles.locationCard}>
              <View style={styles.locationTop}>
                <View style={[styles.locationIcon, location.isDefault && styles.defaultLocationIcon]}>
                  <Ionicons name={location.isDefault ? 'home' : 'location'} size={20} color={location.isDefault ? COLORS.info : COLORS.textSecondary} />
                </View>
                <View style={styles.locationInfo}>
                  <View style={styles.locationNameRow}>
                    <Text style={styles.locationName} numberOfLines={1}>{location.label}</Text>
                    {location.isDefault && <Text style={styles.defaultBadge}>DEFAULT</Text>}
                  </View>
                  <Text style={styles.coordinates}>
                    {location.latitude.toFixed(3)}°, {location.longitude.toFixed(3)}°
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Rename ${location.label}`}
                  onPress={() => openRenameEditor(location)}
                  style={styles.iconButton}
                >
                  <Ionicons name="pencil-outline" size={18} color={COLORS.textSecondary} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${location.label}`}
                  onPress={() => confirmDelete(location)}
                  style={styles.iconButton}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.textSecondary} />
                </Pressable>
              </View>
              {!location.isDefault && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void makeDefault(location)}
                  style={styles.defaultAction}
                >
                  <Ionicons name="star-outline" size={16} color={COLORS.info} />
                  <Text style={styles.defaultActionText}>Make default</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}

      <Modal visible={isEditorOpen} transparent animationType="fade" onRequestClose={() => setIsEditorOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleBlock}>
                <Text style={styles.modalEyebrow}>{editingLocation ? 'LOCATION DETAILS' : 'ADD A PLACE'}</Text>
                <Text style={styles.modalTitle}>{editingLocation ? 'Rename location' : 'Find a location'}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setIsEditorOpen(false)} style={styles.closeButton}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            {!editingLocation && (
              <>
                <Text style={styles.inputLabel}>City or address</Text>
                <View style={styles.searchRow}>
                  <TextInput
                    accessibilityLabel="City or address"
                    value={placeQuery}
                    onChangeText={setPlaceQuery}
                    onSubmitEditing={() => void searchForPlaces()}
                    placeholder="e.g. Colombo, Sri Lanka"
                    placeholderTextColor={COLORS.textSecondary}
                    style={styles.searchInput}
                    returnKeyType="search"
                  />
                  <Pressable accessibilityRole="button" accessibilityLabel="Search places" disabled={isSearching} onPress={() => void searchForPlaces()} style={styles.searchButton}>
                    {isSearching ? <ActivityIndicator size="small" color={COLORS.white} /> : <Ionicons name="search" size={19} color={COLORS.white} />}
                  </Pressable>
                </View>
                <Pressable accessibilityRole="button" disabled={isSearching} onPress={() => void useDeviceLocation()} style={styles.currentLocationButton}>
                  <Ionicons name="navigate-outline" size={16} color={COLORS.info} />
                  <Text style={styles.currentLocationText}>Use my current location</Text>
                </Pressable>
                {placeResults.length > 0 && (
                  <View style={styles.resultsList}>
                    {placeResults.map((place, index) => (
                      <Pressable
                        key={`${place.latitude}-${place.longitude}-${index}`}
                        accessibilityRole="button"
                        onPress={() => choosePlace(place)}
                        style={[styles.resultRow, draft?.latitude === place.latitude && styles.selectedResult]}
                      >
                        <Ionicons name="location-outline" size={17} color={COLORS.info} />
                        <Text style={styles.resultText} numberOfLines={2}>{place.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                {draft && (
                  <View style={styles.selectedPlace}>
                    <Ionicons name="checkmark-circle" size={17} color={COLORS.success} />
                    <Text style={styles.selectedPlaceText} numberOfLines={1}>
                      {draft.label} · {draft.latitude.toFixed(3)}, {draft.longitude.toFixed(3)}
                    </Text>
                  </View>
                )}
              </>
            )}

            <Text style={styles.inputLabel}>Location name</Text>
            <TextInput
              accessibilityLabel="Location name"
              value={label}
              onChangeText={setLabel}
              placeholder="e.g. Home"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
              returnKeyType="done"
            />
            {editorError && <Text accessibilityRole="alert" style={styles.editorError}>{editorError}</Text>}
            <View style={styles.modalActions}>
              <Pressable accessibilityRole="button" disabled={isSaving} onPress={() => setIsEditorOpen(false)} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={isSaving} onPress={() => void saveDraft()} style={[styles.saveButton, isSaving && styles.disabledButton]}>
                {isSaving ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={styles.saveText}>{editingLocation ? 'Save name' : 'Add location'}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: SPACING.m, paddingBottom: SPACING.xxl },
  topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.l },
  titleBlock: { flex: 1, paddingRight: SPACING.m },
  eyebrow: { color: COLORS.info, fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.bold, letterSpacing: 1.1, marginBottom: SPACING.xs },
  heading: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.xxl, fontWeight: TYPOGRAPHY.fontWeight.bold },
  subtitle: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s, marginTop: SPACING.xs },
  addButton: { width: 46, height: 46, borderRadius: BORDER_RADIUS.s, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  summary: { flexDirection: 'row', alignItems: 'center', gap: SPACING.m, padding: SPACING.m, marginBottom: SPACING.xl, backgroundColor: '#172D40', borderRadius: BORDER_RADIUS.m, borderWidth: 1, borderColor: '#25445D' },
  summaryIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: BORDER_RADIUS.s, backgroundColor: '#203C54' },
  summaryCopy: { flex: 1 },
  summaryTitle: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.semiBold, marginBottom: 3 },
  summaryText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s, lineHeight: 20 },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: SPACING.m },
  sectionTitle: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.l, fontWeight: TYPOGRAPHY.fontWeight.bold },
  locationCount: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s },
  locationList: { gap: SPACING.s },
  locationCard: { padding: SPACING.m, borderRadius: BORDER_RADIUS.m, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.backgroundCard },
  locationTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s },
  locationIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: BORDER_RADIUS.s, backgroundColor: '#263344' },
  defaultLocationIcon: { backgroundColor: '#203C54' },
  locationInfo: { flex: 1, minWidth: 0 },
  locationNameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  locationName: { flexShrink: 1, color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  defaultBadge: { color: COLORS.info, fontSize: 9, fontWeight: TYPOGRAPHY.fontWeight.bold, letterSpacing: 0.6, overflow: 'hidden' },
  coordinates: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.xs, marginTop: 4 },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: BORDER_RADIUS.s },
  defaultAction: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, alignSelf: 'flex-start', minHeight: 40, marginTop: SPACING.s, marginLeft: 52, paddingHorizontal: SPACING.s },
  defaultActionText: { color: COLORS.info, fontSize: TYPOGRAPHY.fontSize.s, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  stateCard: { alignItems: 'center', paddingHorizontal: SPACING.l, paddingVertical: SPACING.xl, borderRadius: BORDER_RADIUS.m, backgroundColor: COLORS.backgroundCard, borderWidth: 1, borderColor: COLORS.border },
  stateText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s, lineHeight: 21, textAlign: 'center', marginTop: SPACING.s },
  emptyIcon: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: BORDER_RADIUS.round, backgroundColor: '#203C54', marginBottom: SPACING.m },
  emptyTitle: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.l, fontWeight: TYPOGRAPHY.fontWeight.semiBold, textAlign: 'center' },
  emptyAction: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, minHeight: 44, marginTop: SPACING.l, paddingHorizontal: SPACING.m, borderRadius: BORDER_RADIUS.s, backgroundColor: COLORS.primary },
  emptyActionText: { color: COLORS.white, fontSize: TYPOGRAPHY.fontSize.s, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  retryButton: { minHeight: 42, justifyContent: 'center', marginTop: SPACING.m, paddingHorizontal: SPACING.m, borderRadius: BORDER_RADIUS.s, backgroundColor: COLORS.primary },
  retryText: { color: COLORS.white, fontSize: TYPOGRAPHY.fontSize.s, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: SPACING.m, backgroundColor: 'rgba(3, 8, 18, 0.78)' },
  modalPanel: { width: '100%', maxWidth: 480, alignSelf: 'center', padding: SPACING.m, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.m, backgroundColor: COLORS.backgroundCard },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.m },
  modalTitleBlock: { flex: 1 },
  modalEyebrow: { color: COLORS.info, fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.bold, letterSpacing: 1, marginBottom: SPACING.xs },
  modalTitle: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.bold },
  closeButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  inputLabel: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s, marginBottom: SPACING.xs, marginTop: SPACING.s },
  searchRow: { flexDirection: 'row', gap: SPACING.s },
  searchInput: { minHeight: 46, flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.s, paddingHorizontal: SPACING.m, color: COLORS.textPrimary, backgroundColor: COLORS.background, fontSize: TYPOGRAPHY.fontSize.s },
  searchButton: { width: 46, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: BORDER_RADIUS.s, backgroundColor: COLORS.primary },
  currentLocationButton: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, minHeight: 40, alignSelf: 'flex-start', paddingHorizontal: SPACING.xs },
  currentLocationText: { color: COLORS.info, fontSize: TYPOGRAPHY.fontSize.s, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  resultsList: { maxHeight: 180, marginTop: SPACING.xs, borderRadius: BORDER_RADIUS.s, overflow: 'hidden', backgroundColor: COLORS.background },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s, minHeight: 48, paddingHorizontal: SPACING.s, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  selectedResult: { backgroundColor: '#203C54' },
  resultText: { flex: 1, color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.s, lineHeight: 18 },
  selectedPlace: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.s },
  selectedPlaceText: { flex: 1, color: COLORS.success, fontSize: TYPOGRAPHY.fontSize.xs },
  input: { minHeight: 46, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.s, paddingHorizontal: SPACING.m, color: COLORS.textPrimary, backgroundColor: COLORS.background, fontSize: TYPOGRAPHY.fontSize.s },
  editorError: { color: COLORS.danger, fontSize: TYPOGRAPHY.fontSize.s, lineHeight: 20, marginTop: SPACING.s },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.s, marginTop: SPACING.l },
  cancelButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: SPACING.m },
  cancelText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  saveButton: { minWidth: 112, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.m, borderRadius: BORDER_RADIUS.s, backgroundColor: COLORS.primary },
  saveText: { color: COLORS.white, fontSize: TYPOGRAPHY.fontSize.s, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  disabledButton: { opacity: 0.7 },
});
