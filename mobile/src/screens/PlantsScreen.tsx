import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/ScreenContainer';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

type Plant = {
  id: string;
  name: string;
  species: string;
  location: string;
  wateringEveryDays: number;
  nextWaterAt: number;
  lastWateredAt?: number;
  symbol: string;
};

type PlantFilter = 'all' | 'due' | 'healthy';

const STORAGE_KEY = 'weatherwise.plants.v1';
const DAY_MS = 24 * 60 * 60 * 1000;
const FERN = '#91C788';
const INITIAL_PLANTS: Plant[] = [
  {
    id: 'monstera',
    name: 'Monstera',
    species: 'Monstera deliciosa',
    location: 'Living room · Bright indirect',
    wateringEveryDays: 7,
    nextWaterAt: Date.now() - DAY_MS,
    symbol: '🌿',
  },
  {
    id: 'basil',
    name: 'Sweet basil',
    species: 'Ocimum basilicum',
    location: 'Kitchen · Sunny window',
    wateringEveryDays: 2,
    nextWaterAt: Date.now() + 2 * 60 * 60 * 1000,
    symbol: '🌱',
  },
  {
    id: 'snake-plant',
    name: 'Snake plant',
    species: 'Dracaena trifasciata',
    location: 'Bedroom · Low light',
    wateringEveryDays: 14,
    nextWaterAt: Date.now() + 4 * DAY_MS,
    symbol: '🪴',
  },
];

function getWateringLabel(plant: Plant, now: number) {
  const days = Math.ceil((plant.nextWaterAt - now) / DAY_MS);
  if (days <= 0) return days < -1 ? `${Math.abs(days)} days overdue` : 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `In ${days} days`;
}

export function PlantsScreen() {
  const [plants, setPlants] = useState(INITIAL_PLANTS);
  const [filter, setFilter] = useState<PlantFilter>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [frequency, setFrequency] = useState('7');
  const now = Date.now();
  const dueCount = plants.filter((plant) => plant.nextWaterAt <= now + DAY_MS).length;
  const visiblePlants = plants.filter((plant) => {
    if (filter === 'due') return plant.nextWaterAt <= now + DAY_MS;
    if (filter === 'healthy') return plant.nextWaterAt > now + DAY_MS;
    return true;
  });

  useEffect(() => {
    let isActive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!isActive) return;
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (Array.isArray(parsed)) setPlants(parsed as Plant[]);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (isActive) setIsHydrated(true);
      });
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (isHydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(plants)).catch(() => undefined);
  }, [isHydrated, plants]);

  const waterPlant = (plantId: string) => {
    const wateredAt = Date.now();
    setPlants((current) => current.map((plant) => (
      plant.id === plantId
        ? { ...plant, lastWateredAt: wateredAt, nextWaterAt: wateredAt + plant.wateringEveryDays * DAY_MS }
        : plant
    )));
  };

  const addPlant = () => {
    const trimmedName = name.trim();
    const wateringEveryDays = Number.parseInt(frequency, 10);
    if (!trimmedName || !Number.isFinite(wateringEveryDays) || wateringEveryDays < 1) {
      Alert.alert('Check plant details', 'Add a name and a watering interval of at least 1 day.');
      return;
    }
    setPlants((current) => [
      {
        id: `${Date.now()}-${trimmedName.toLowerCase().replace(/\s+/g, '-')}`,
        name: trimmedName,
        species: 'Your plant',
        location: location.trim() || 'Location not set',
        wateringEveryDays,
        nextWaterAt: Date.now() + wateringEveryDays * DAY_MS,
        lastWateredAt: Date.now(),
        symbol: '🪴',
      },
      ...current,
    ]);
    setName('');
    setLocation('');
    setFrequency('7');
    setIsAddOpen(false);
  };

  const removePlant = (plant: Plant) => {
    Alert.alert('Remove plant?', `Remove ${plant.name} from your garden?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setPlants((current) => current.filter((item) => item.id !== plant.id)) },
    ]);
  };

  return (
    <ScreenContainer scrollable contentStyle={styles.screen}>
      <View style={styles.topLine}>
        <View>
          <Text style={styles.eyebrow}>YOUR GARDEN</Text>
          <Text style={styles.heading}>Plant care</Text>
        </View>
        <Pressable accessibilityLabel="Add a plant" onPress={() => setIsAddOpen(true)} style={styles.addButton}>
          <Ionicons name="add" size={22} color={COLORS.background} />
          <Text style={styles.addButtonText}>Add plant</Text>
        </Pressable>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryLabel}>GARDEN CHECK-IN</Text>
          <Text style={styles.summaryTitle}>{dueCount === 0 ? 'Looking good' : `${dueCount} plant${dueCount === 1 ? '' : 's'} need attention`}</Text>
          <Text style={styles.summaryDescription}>
            {dueCount === 0 ? 'Your plants are on track. Keep enjoying the green.' : 'A quick watering keeps your garden happy.'}
          </Text>
        </View>
        <View style={styles.summaryIcon}><Text style={styles.summaryEmoji}>🌿</Text></View>
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Your plants</Text>
        <Text style={styles.plantCount}>{plants.length} total</Text>
      </View>

      <View style={styles.filters} accessibilityRole="tablist">
        {([
          ['all', 'All'],
          ['due', 'Needs water'],
          ['healthy', 'On track'],
        ] as const).map(([key, label]) => (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === key }}
            onPress={() => setFilter(key)}
            style={[styles.filterButton, filter === key && styles.filterButtonSelected]}
          >
            <Text style={[styles.filterText, filter === key && styles.filterTextSelected]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.plantList}>
        {visiblePlants.map((plant) => {
          const isDue = plant.nextWaterAt <= now + DAY_MS;
          return (
            <View key={plant.id} style={styles.plantCard}>
              <View style={styles.plantTopRow}>
                <View style={styles.plantIdentity}>
                  <View style={styles.plantIcon}><Text style={styles.plantEmoji}>{plant.symbol}</Text></View>
                  <View style={styles.plantNameBlock}>
                    <Text style={styles.plantName}>{plant.name}</Text>
                    <Text style={styles.species}>{plant.species}</Text>
                  </View>
                </View>
                <Pressable accessibilityLabel={`Remove ${plant.name}`} onPress={() => removePlant(plant)} style={styles.removeButton}>
                  <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textSecondary} />
                </Pressable>
              </View>
              <View style={styles.plantMeta}>
                <Ionicons name="location-outline" size={15} color={COLORS.textSecondary} />
                <Text style={styles.location} numberOfLines={1}>{plant.location}</Text>
              </View>
              <View style={styles.cardFooter}>
                <View style={styles.scheduleBlock}>
                  <View style={[styles.statusDot, isDue && styles.statusDotDue]} />
                  <View>
                    <Text style={[styles.dueLabel, isDue && styles.dueLabelDue]}>{getWateringLabel(plant, now)}</Text>
                    <Text style={styles.interval}>Every {plant.wateringEveryDays} days</Text>
                  </View>
                </View>
                <Pressable
                  accessibilityLabel={`Mark ${plant.name} as watered`}
                  onPress={() => waterPlant(plant.id)}
                  style={[styles.waterButton, !isDue && styles.waterButtonQuiet]}
                >
                  <Ionicons name="water-outline" size={16} color={isDue ? COLORS.background : FERN} />
                  <Text style={[styles.waterButtonText, !isDue && styles.waterButtonTextQuiet]}>{isDue ? 'Water now' : 'Water'}</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
        {visiblePlants.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nothing to water</Text>
            <Text style={styles.emptyCopy}>Your plants are on schedule. Check back soon.</Text>
          </View>
        )}
      </View>

      <View style={styles.tipRow}>
        <Ionicons name="sunny-outline" size={18} color={COLORS.warning} />
        <Text style={styles.tipText}>Check the top inch of soil before watering.</Text>
      </View>

      <Modal visible={isAddOpen} transparent animationType="fade" onRequestClose={() => setIsAddOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>GROW YOUR GARDEN</Text>
                <Text style={styles.modalTitle}>Add a plant</Text>
              </View>
              <Pressable accessibilityLabel="Close" onPress={() => setIsAddOpen(false)} style={styles.closeButton}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.inputLabel}>Plant name</Text>
            <TextInput value={name} onChangeText={setName} placeholder="e.g. Monstera" placeholderTextColor="#82909B" style={styles.input} returnKeyType="next" />
            <Text style={styles.inputLabel}>Location or light</Text>
            <TextInput value={location} onChangeText={setLocation} placeholder="e.g. Bedroom · Bright light" placeholderTextColor="#82909B" style={styles.input} returnKeyType="next" />
            <Text style={styles.inputLabel}>Water every (days)</Text>
            <TextInput value={frequency} onChangeText={setFrequency} keyboardType="number-pad" placeholder="7" placeholderTextColor="#82909B" style={styles.input} />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setIsAddOpen(false)} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
              <Pressable onPress={addPlant} style={styles.saveButton}><Text style={styles.saveText}>Add to garden</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: SPACING.m, paddingBottom: SPACING.xxl },
  topLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.l },
  eyebrow: { color: FERN, fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.bold, letterSpacing: 1.2, marginBottom: SPACING.xs },
  heading: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.xxl, fontWeight: TYPOGRAPHY.fontWeight.bold },
  addButton: { backgroundColor: FERN, minHeight: 42, borderRadius: BORDER_RADIUS.s, flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingHorizontal: SPACING.m },
  addButtonText: { color: COLORS.background, fontSize: TYPOGRAPHY.fontSize.s, fontWeight: TYPOGRAPHY.fontWeight.bold },
  summary: { minHeight: 142, borderRadius: BORDER_RADIUS.m, backgroundColor: '#203A31', padding: SPACING.m, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', marginBottom: SPACING.xl },
  summaryCopy: { flex: 1, paddingRight: SPACING.s },
  summaryLabel: { color: FERN, fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.bold, letterSpacing: 1, marginBottom: SPACING.s },
  summaryTitle: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.bold, marginBottom: SPACING.xs },
  summaryDescription: { color: '#C2D4C8', fontSize: TYPOGRAPHY.fontSize.s, lineHeight: 20, maxWidth: 245 },
  summaryIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#355343', alignItems: 'center', justifyContent: 'center' },
  summaryEmoji: { fontSize: 32 },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: SPACING.m },
  sectionTitle: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.l, fontWeight: TYPOGRAPHY.fontWeight.bold },
  plantCount: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s },
  filters: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.m },
  filterButton: { minHeight: 36, paddingHorizontal: SPACING.m, borderRadius: BORDER_RADIUS.round, justifyContent: 'center', backgroundColor: COLORS.backgroundCard },
  filterButtonSelected: { backgroundColor: FERN },
  filterText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s, fontWeight: TYPOGRAPHY.fontWeight.medium },
  filterTextSelected: { color: COLORS.background, fontWeight: TYPOGRAPHY.fontWeight.bold },
  plantList: { gap: SPACING.s },
  plantCard: { backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.m, padding: SPACING.m, borderWidth: 1, borderColor: COLORS.border },
  plantTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  plantIdentity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.m },
  plantIcon: { width: 48, height: 48, borderRadius: BORDER_RADIUS.s, backgroundColor: '#293C35', alignItems: 'center', justifyContent: 'center' },
  plantEmoji: { fontSize: 26 },
  plantNameBlock: { flex: 1 },
  plantName: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  species: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.xs, marginTop: 3 },
  removeButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  plantMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.m, paddingBottom: SPACING.m, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  location: { flex: 1, color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: SPACING.m, gap: SPACING.s },
  scheduleBlock: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s, flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: FERN },
  statusDotDue: { backgroundColor: COLORS.warning },
  dueLabel: { color: FERN, fontSize: TYPOGRAPHY.fontSize.s, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  dueLabelDue: { color: COLORS.warning },
  interval: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.xs, marginTop: 2 },
  waterButton: { minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, backgroundColor: FERN, borderRadius: BORDER_RADIUS.s, paddingHorizontal: SPACING.m },
  waterButtonQuiet: { borderWidth: 1, borderColor: '#49674E', backgroundColor: 'transparent' },
  waterButtonText: { color: COLORS.background, fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.bold },
  waterButtonTextQuiet: { color: FERN },
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xl, backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.m },
  emptyTitle: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  emptyCopy: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s, marginTop: SPACING.xs, textAlign: 'center', paddingHorizontal: SPACING.m },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s, marginTop: SPACING.l, paddingVertical: SPACING.m, paddingHorizontal: SPACING.m, borderTopWidth: 1, borderTopColor: COLORS.border },
  tipText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s, flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.68)', justifyContent: 'center', padding: SPACING.m },
  modalPanel: { backgroundColor: COLORS.backgroundCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.m, padding: SPACING.m },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.m },
  modalEyebrow: { color: FERN, fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.bold, letterSpacing: 1, marginBottom: SPACING.xs },
  modalTitle: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.bold },
  closeButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  inputLabel: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s, marginBottom: SPACING.xs, marginTop: SPACING.s },
  input: { minHeight: 46, backgroundColor: COLORS.background, borderColor: COLORS.border, borderWidth: 1, borderRadius: BORDER_RADIUS.s, color: COLORS.textPrimary, paddingHorizontal: SPACING.m, fontSize: TYPOGRAPHY.fontSize.s },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.s, marginTop: SPACING.l },
  cancelButton: { minHeight: 42, justifyContent: 'center', paddingHorizontal: SPACING.m },
  cancelText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  saveButton: { minHeight: 42, justifyContent: 'center', paddingHorizontal: SPACING.m, backgroundColor: FERN, borderRadius: BORDER_RADIUS.s },
  saveText: { color: COLORS.background, fontSize: TYPOGRAPHY.fontSize.s, fontWeight: TYPOGRAPHY.fontWeight.bold },
});
