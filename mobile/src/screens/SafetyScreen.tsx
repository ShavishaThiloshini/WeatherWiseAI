import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { InfoCard } from '../components/InfoCard';
import { EmptyView, ErrorView } from '../components/StateViews';
import { LoadingPlaceholder } from '../components/LoadingPlaceholder';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useLocation, useWeather, useRecommendations } from '../hooks';
import type { RecommendationSeverity } from '../types';

export function SafetyScreen() {
  const location = useLocation();
  const weather = useWeather(location.data?.latitude ?? null, location.data?.longitude ?? null);
  const recommendations = useRecommendations(weather.data);
  if (location.isLoading || (weather.isLoading && !weather.data)) return <ScreenContainer><LoadingPlaceholder message="Assessing local conditions..." /></ScreenContainer>;
  if (location.error || weather.error || !weather.data) return <ScreenContainer><ErrorView message={location.error || weather.error || 'Weather is unavailable'} onRetry={weather.refresh} /></ScreenContainer>;
  const safetyItems = (recommendations.data ?? []).filter((item) => ['warning', 'danger'].includes(item.severity) || ['rain', 'wind', 'uv', 'heat', 'cold', 'thunderstorm', 'travel'].includes(item.category));

  return (
    <ScreenContainer scrollable>
      <SectionHeader title="Safety Assessment" />
      <Card style={styles.summary}>
        <Text style={styles.summaryTitle}>Current local conditions</Text>
        <View style={styles.badges}>
          <Badge label={`Rain ${weather.data.rainProbability}%`} tone={weather.data.rainProbability >= 60 ? 'warning' : 'info'} />
          <Badge label={`Wind ${weather.data.windSpeedKmh} km/h`} tone={weather.data.windSpeedKmh >= 40 ? 'warning' : 'info'} />
          <Badge label={`UV ${weather.data.uvIndex}`} tone={weather.data.uvIndex >= 8 ? 'danger' : weather.data.uvIndex >= 6 ? 'warning' : 'info'} />
        </View>
      </Card>
      <SectionHeader title="Recommended Actions" />
      {recommendations.isLoading ? <LoadingPlaceholder message="Checking safety rules..." /> : null}
      {recommendations.error ? <ErrorView message={recommendations.error} onRetry={recommendations.refresh} /> : null}
      {!recommendations.isLoading && !recommendations.error && safetyItems.length === 0 ? <EmptyView message="No safety concerns right now." /> : null}
      {safetyItems.map((item) => <InfoCard key={item.id} title={item.title} message={item.message} reason={item.reason} action={item.action} severity={item.severity as RecommendationSeverity} />)}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  summary: { marginBottom: SPACING.s },
  summaryTitle: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.semiBold, marginBottom: SPACING.s },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.s },
});
