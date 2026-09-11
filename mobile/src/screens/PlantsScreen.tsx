/**
 * screens/PlantsScreen.tsx
 * Plant care management and watering recommendations for WeatherWise AI.
 *
 * Day 27 Integration:
 *  - GET /api/v1/plants — list user's plant profiles
 *  - POST /api/v1/plants — add a new plant profile
 *  - Each plant card shows its weather-based watering recommendation
 *  - Empty state with "Add your first plant" CTA
 *  - Loading and error states per UIUXDesignBrief §8
 */

import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { apiFetch } from '../services/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Plant {
  id: string;
  name: string;
  species_type?: string;
  last_watered_at?: string;
  watering_advice?: string;
  watering_status?: 'water_now' | 'skip' | 'water_evening' | 'unknown';
}

interface PlantsResponse {
  plants: Plant[];
}

interface AddPlantResponse {
  plant: Plant;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  string,
  { emoji: string; label: string; color: string; bg: string }
> = {
  water_now: { emoji: '💧', label: 'Water Now', color: COLORS.primary, bg: COLORS.infoLight },
  skip: { emoji: '✅', label: 'Skip Today', color: COLORS.success, bg: COLORS.successLight },
  water_evening: { emoji: '🌙', label: 'Water This Evening', color: COLORS.warning, bg: COLORS.warningLight },
  unknown: { emoji: '🌱', label: 'Check Soil', color: COLORS.textSecondary, bg: COLORS.backgroundCard },
};

function statusFor(plant: Plant): typeof STATUS_CONFIG[string] {
  return STATUS_CONFIG[plant.watering_status ?? 'unknown'] ?? STATUS_CONFIG.unknown;
}

// ---------------------------------------------------------------------------
// Plant Card
// ---------------------------------------------------------------------------

function PlantCard({ plant }: { plant: Plant }) {
  const status = statusFor(plant);
  return (
    <View style={[styles.plantCard, { borderColor: status.color }]}>
      <View style={[styles.statusIconBox, { backgroundColor: status.bg }]}>
        <Text style={styles.statusEmoji}>{status.emoji}</Text>
      </View>
      <View style={styles.plantInfo}>
        <Text style={styles.plantName}>{plant.name}</Text>
        {plant.species_type ? (
          <Text style={styles.plantSpecies}>{plant.species_type}</Text>
        ) : null}
        <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
        {plant.watering_advice ? (
          <Text style={styles.plantAdvice}>{plant.watering_advice}</Text>
        ) : null}
        {plant.last_watered_at ? (
          <Text style={styles.lastWatered}>
            Last watered: {new Date(plant.last_watered_at).toLocaleDateString()}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Add Plant Form
// ---------------------------------------------------------------------------

function AddPlantForm({
  onAdd,
  onCancel,
}: {
  onAdd: (name: string, species: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = React.useState('');
  const [species, setSpecies] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Plant name required', 'Enter a name for your plant.');
      return;
    }
    setIsSaving(true);
    try {
      await onAdd(name.trim(), species.trim());
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.addForm}>
      <Text style={styles.formTitle}>Add a Plant</Text>

      <Text style={styles.fieldLabel}>Plant Name *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Tomato, Basil, Rose…"
        placeholderTextColor={COLORS.textSecondary}
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        accessibilityLabel="Plant name"
      />

      <Text style={styles.fieldLabel}>Species / Type (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Cherry Tomato, Sweet Basil…"
        placeholderTextColor={COLORS.textSecondary}
        value={species}
        onChangeText={setSpecies}
        autoCapitalize="words"
        accessibilityLabel="Plant species or type"
      />

      <View style={styles.formActions}>
        <Pressable
          style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }, isSaving && { opacity: 0.6 }]}
          onPress={() => void handleSave()}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel="Save plant"
        >
          {isSaving
            ? <ActivityIndicator size="small" color={COLORS.white} />
            : <Text style={styles.saveBtnText}>Save Plant</Text>
          }
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function PlantsScreen() {
  const [plants, setPlants] = React.useState<Plant[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showAddForm, setShowAddForm] = React.useState(false);

  const loadPlants = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiFetch<PlantsResponse>('/plants');
      setPlants(response.plants ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your plants.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadPlants();
  }, [loadPlants]);

  const handleAddPlant = async (name: string, speciesType: string) => {
    try {
      const response = await apiFetch<AddPlantResponse>('/plants', {
        method: 'POST',
        body: JSON.stringify({ name, species_type: speciesType || undefined }),
      });
      setPlants((prev) => [response.plant, ...prev]);
      setShowAddForm(false);
    } catch (err) {
      Alert.alert('Could not add plant', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  // ---- Loading ----
  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your plants…</Text>
        </View>
      </ScreenContainer>
    );
  }

  // ---- Error ----
  if (error) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={styles.stateIcon}>⚠️</Text>
          <Text style={styles.stateMessage}>We couldn't load your plants.{'\n'}{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void loadPlants()} accessibilityRole="button">
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>🌿 My Plants</Text>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
          onPress={() => setShowAddForm(true)}
          accessibilityRole="button"
          accessibilityLabel="Add a new plant"
        >
          <Text style={styles.addBtnText}>+ Add Plant</Text>
        </Pressable>
      </View>

      {/* Add plant form (inline) */}
      {showAddForm && (
        <AddPlantForm
          onAdd={handleAddPlant}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Plant list */}
      {plants.length === 0 && !showAddForm ? (
        <View style={styles.emptyState}>
          <Text style={styles.stateIcon}>🌱</Text>
          <Text style={styles.emptyTitle}>No plants yet</Text>
          <Text style={styles.stateMessage}>
            Add your plants and WeatherWise AI will tell you when to water them based on the forecast.
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => setShowAddForm(true)}
            accessibilityRole="button"
          >
            <Text style={styles.retryBtnText}>Add your first plant</Text>
          </TouchableOpacity>
        </View>
      ) : (
        plants.map((plant) => <PlantCard key={plant.id} plant={plant} />)
      )}
    </ScreenContainer>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.m,
  },
  loadingText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.m },
  stateIcon: { fontSize: 56, textAlign: 'center' },
  stateMessage: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.m,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.m * 1.5,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    marginTop: SPACING.s,
  },
  retryBtnText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  pageTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.extraBold,
    color: COLORS.textPrimary,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
  },
  addBtnText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.s,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.s,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  // Plant card
  plantCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.m,
    borderLeftWidth: 4,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    gap: SPACING.m,
    alignItems: 'flex-start',
    ...SHADOWS.subtle,
  },
  statusIconBox: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusEmoji: { fontSize: 28 },
  plantInfo: { flex: 1, gap: 4 },
  plantName: {
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  plantSpecies: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  statusLabel: {
    fontSize: TYPOGRAPHY.fontSize.s,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  plantAdvice: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.fontSize.s * 1.5,
  },
  lastWatered: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  // Add form
  addForm: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.m,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    ...SHADOWS.subtle,
  },
  formTitle: {
    fontSize: TYPOGRAPHY.fontSize.l,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.m,
  },
  fieldLabel: {
    fontSize: TYPOGRAPHY.fontSize.s,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.m,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    marginBottom: SPACING.m,
    minHeight: 48,
  },
  formActions: {
    flexDirection: 'row',
    gap: SPACING.s,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    borderRadius: BORDER_RADIUS.m,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelBtnText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.m },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.m,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    minHeight: 44,
    justifyContent: 'center',
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
});
