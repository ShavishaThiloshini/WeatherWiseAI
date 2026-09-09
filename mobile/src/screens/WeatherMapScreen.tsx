import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { ScreenContainer } from '../components/ScreenContainer';
import { ErrorView } from '../components/StateViews';
import { LoadingPlaceholder } from '../components/LoadingPlaceholder';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useLocation, useWeather } from '../hooks';

export function WeatherMapScreen() {
  const location = useLocation();
  const weather = useWeather(location.data?.latitude ?? null, location.data?.longitude ?? null);
  if (location.isLoading) return <ScreenContainer><LoadingPlaceholder message="Locating your weather map..." /></ScreenContainer>;
  if (location.error || !location.data) return <ScreenContainer><ErrorView message={location.error || 'Location is unavailable'} onRetry={location.refresh} /></ScreenContainer>;
  const region = { latitude: location.data.latitude, longitude: location.data.longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 };
  return (
    <ScreenContainer contentStyle={styles.screen}>
      <View style={styles.summary}><Text style={styles.title}>{location.data.displayName}</Text><Text style={styles.detail}>{weather.data ? `${weather.data.conditionLabel}, ${weather.data.temperatureC} deg` : 'Loading local weather...'}</Text></View>
      <MapView style={styles.map} initialRegion={region} showsCompass showsMyLocationButton>
        <Marker coordinate={region} title={location.data.city} description={weather.data ? `${weather.data.conditionLabel}, ${weather.data.temperatureC} deg` : 'Current weather area'} />
      </MapView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 0 },
  summary: { backgroundColor: COLORS.backgroundCard, paddingHorizontal: SPACING.m, paddingVertical: SPACING.s },
  title: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  detail: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s, marginTop: 2 },
  map: { flex: 1, width: '100%' },
});
