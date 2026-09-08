/**
 * screens/WeatherMapScreen.tsx
 * Placeholder screen for interactive weather map.
 * TODO (Day 2+): Integrate a map component (e.g. react-native-maps) with
 *               weather overlays (rain radar, wind, temperature).
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { MapView } from '../components/MapView';
import { useLocation } from '../hooks/useLocation';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { SectionHeader } from '../components/SectionHeader';
import { InfoCard } from '../components/InfoCard';

export function WeatherMapScreen() {
  const { location } = useLocation();
  const lat = location?.latitude ?? 0;
  const lon = location?.longitude ?? 0;

  // Show only the map on this screen — no header, no buttons, no cards
  return (
    <ScreenContainer>
      <View style={styles.mapContainer}>
        <MapView latitude={lat} longitude={lon} height="100vh" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mapContainer: { flex: 1, width: '100%', height: '100%' },
});
