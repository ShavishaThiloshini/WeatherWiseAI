import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TextField } from '../components/ui/TextField';
import { ErrorView } from '../components/StateViews';
import { LoadingPlaceholder } from '../components/LoadingPlaceholder';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useLocation, useWeather } from '../hooks';

export function PlantsScreen() {
  const location = useLocation();
  const weather = useWeather(location.data?.latitude ?? null, location.data?.longitude ?? null);
  const [plant, setPlant] = useState('');
  const [plants, setPlants] = useState<string[]>([]);
  if (location.isLoading || (weather.isLoading && !weather.data)) return <ScreenContainer><LoadingPlaceholder message="Checking garden weather..." /></ScreenContainer>;
  if (location.error || weather.error || !weather.data) return <ScreenContainer><ErrorView message={location.error || weather.error || 'Weather is unavailable'} onRetry={weather.refresh} /></ScreenContainer>;
  const shouldWater = weather.data.rainProbability < 40 && weather.data.temperatureC >= 20;
  const advice = shouldWater ? 'The forecast is warm and dry. Check soil moisture and water plants that feel dry below the surface.' : 'Rain is likely or temperatures are mild. Hold off on watering unless the soil is dry.';
  const add = () => { if (plant.trim()) { setPlants((items) => [...items, plant.trim()]); setPlant(''); } };
  return <ScreenContainer scrollable>
    <Text style={styles.heading}>Plant care today</Text><Text style={styles.copy}>{advice}</Text>
    <Card><Text style={styles.metric}>Rain chance: {weather.data.rainProbability}%</Text><Text style={styles.metric}>Temperature: {weather.data.temperatureC} deg</Text></Card>
    <Text style={styles.section}>Your plants</Text>
    {plants.length === 0 ? <Text style={styles.empty}>Add a plant to keep a quick care list for this session.</Text> : null}
    {plants.map((name) => <Card key={name}><Text style={styles.plantName}>{name}</Text><Text style={styles.plantAdvice}>{shouldWater ? 'Check soil and water if dry.' : 'Skip watering unless soil is dry.'}</Text></Card>)}
    <TextField label="Plant name" value={plant} onChangeText={setPlant} placeholder="Basil, aloe, or balcony fern" />
    <Button label="Add plant" onPress={add} disabled={!plant.trim()} />
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  heading: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.xxl, fontWeight: TYPOGRAPHY.fontWeight.bold, marginTop: SPACING.m },
  copy: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.m, lineHeight: 22, marginTop: SPACING.s, marginBottom: SPACING.m },
  metric: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.m, marginBottom: SPACING.xs },
  section: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.l, fontWeight: TYPOGRAPHY.fontWeight.semiBold, marginTop: SPACING.l, marginBottom: SPACING.s },
  empty: { color: COLORS.textSecondary, marginBottom: SPACING.m }, plantName: { color: COLORS.textPrimary, fontWeight: TYPOGRAPHY.fontWeight.semiBold, fontSize: TYPOGRAPHY.fontSize.m }, plantAdvice: { color: COLORS.textSecondary, marginTop: SPACING.xs, fontSize: TYPOGRAPHY.fontSize.s },
});
