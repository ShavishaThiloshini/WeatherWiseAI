import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { InfoCard } from '../components/InfoCard';
import { EmptyView, ErrorView } from '../components/StateViews';
import { LoadingPlaceholder } from '../components/LoadingPlaceholder';
import { WeatherCard } from '../components/WeatherCard';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/theme';
import { useLocation, useWeather, useRecommendations } from '../hooks';
import type { TravelMapStackParamList } from '../navigation/RootNavigator';
import type { RecommendationSeverity } from '../types';

type Props = NativeStackScreenProps<TravelMapStackParamList, 'Travel'>;

export function TravelScreen({ navigation }: Props) {
  const location = useLocation();
  const weather = useWeather(location.data?.latitude ?? null, location.data?.longitude ?? null);
  const recommendations = useRecommendations(weather.data);
  if (location.isLoading || (weather.isLoading && !weather.data)) return <ScreenContainer><LoadingPlaceholder message="Checking travel conditions..." /></ScreenContainer>;
  if (location.error || weather.error || !weather.data) return <ScreenContainer><ErrorView message={location.error || weather.error || 'Weather is unavailable'} onRetry={weather.refresh} /></ScreenContainer>;

  const travelItems = (recommendations.data ?? []).filter((item) => ['travel', 'rain', 'wind'].includes(item.category));
  const score = recommendations.data?.find((item) => item.category === 'travel' && item.score != null)?.score;

  return (
    <ScreenContainer scrollable>
      <SectionHeader title="Travel Conditions" />
      <View style={styles.grid}>
        <WeatherCard label="Visibility" value={`${weather.data.visibilityKm} km`} subLabel={weather.data.visibilityKm < 5 ? 'Drive carefully' : 'Good'} style={styles.cell} />
        <WeatherCard label="Wind" value={`${weather.data.windSpeedKmh} km/h`} subLabel={weather.data.windDirection} style={styles.cell} />
        <WeatherCard label="Rain chance" value={`${weather.data.rainProbability}%`} subLabel={weather.data.rainProbability >= 50 ? 'Wet roads likely' : 'Roads mostly dry'} style={styles.cell} />
        <WeatherCard label="Travel score" value={score == null ? 'Pending' : `${score}/100`} subLabel="AI assessment" style={styles.cell} />
      </View>
      <SectionHeader title="Travel Advice" />
      {recommendations.isLoading ? <LoadingPlaceholder message="Preparing travel advice..." /> : null}
      {recommendations.error ? <ErrorView message={recommendations.error} onRetry={recommendations.refresh} /> : null}
      {!recommendations.isLoading && !recommendations.error && travelItems.length === 0 ? <EmptyView message="No travel advisories for current conditions." /> : null}
      {travelItems.map((item) => <InfoCard key={item.id} title={item.title} message={item.message} reason={item.reason} action={item.action} severity={item.severity as RecommendationSeverity} score={item.score} />)}
      <Pressable accessibilityRole="button" style={styles.mapButton} onPress={() => navigation.navigate('Map')}><Text style={styles.mapButtonText}>Open local weather map</Text></Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.s, marginBottom: SPACING.s },
  cell: { flex: 1, minWidth: '45%' },
  mapButton: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.m, paddingVertical: SPACING.m, alignItems: 'center', marginTop: SPACING.m },
  mapButtonText: { color: COLORS.white, fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
});
