import React from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyView, ErrorView } from '../components/StateViews';
import { LoadingPlaceholder } from '../components/LoadingPlaceholder';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { conditionIcon } from '../components/ui/IconMapper';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useForecast, useLocation } from '../hooks';

export function ForecastScreen() {
  const location = useLocation();
  const forecast = useForecast(location.data?.latitude ?? null, location.data?.longitude ?? null);

  if (location.isLoading && !location.data) return <ScreenContainer><LoadingPlaceholder message="Finding your location..." /></ScreenContainer>;
  if (location.error) return <ScreenContainer><ErrorView message={location.error} onRetry={location.refresh} /></ScreenContainer>;

  const hourly = forecast.data?.hourly ?? [];
  const daily = forecast.data?.daily ?? [];

  return (
    <ScreenContainer scrollable refreshControl={<RefreshControl refreshing={forecast.isLoading} onRefresh={forecast.refresh} tintColor={COLORS.primary} />}>
      <SectionHeader title="Next 24 Hours" />
      {forecast.isLoading && !forecast.data ? <LoadingPlaceholder message="Loading forecast..." /> : null}
      {forecast.error ? <ErrorView message={forecast.error} onRetry={forecast.refresh} /> : null}
      {!forecast.isLoading && !forecast.error && hourly.length === 0 ? <EmptyView message="No hourly data is available." /> : null}
      {hourly.map((hour) => (
        <Card key={hour.time} style={styles.hourCard}>
          <Text style={styles.hourTime}>{new Date(hour.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</Text>
          <Text style={styles.icon}>{conditionIcon(hour.condition)}</Text>
          <Text style={styles.temperature}>{hour.temperatureC} deg</Text>
          <Badge label={`Rain ${hour.rainProbability}%`} tone={hour.rainProbability >= 50 ? 'warning' : 'info'} />
        </Card>
      ))}
      <SectionHeader title="7-Day Outlook" />
      {!forecast.isLoading && !forecast.error && daily.length === 0 ? <EmptyView message="No daily data is available." /> : null}
      {daily.map((day) => (
        <Card key={day.date} style={styles.dayCard}>
          <View style={styles.dayDetails}>
            <Text style={styles.dayName}>{new Date(day.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}</Text>
            <Text style={styles.condition}>{day.conditionLabel}</Text>
          </View>
          <Text style={styles.icon}>{conditionIcon(day.condition)}</Text>
          <View style={styles.temps}><Text style={styles.temperature}>{day.maxTempC} deg</Text><Text style={styles.lowTemperature}>{day.minTempC} deg</Text></View>
          <Badge label={`Rain ${day.rainProbability}%`} tone={day.rainProbability >= 60 ? 'warning' : 'info'} />
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hourCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.m },
  hourTime: { width: 52, color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.m },
  icon: { fontSize: 22 },
  temperature: { color: COLORS.textPrimary, fontWeight: TYPOGRAPHY.fontWeight.bold, fontSize: TYPOGRAPHY.fontSize.m },
  dayCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s },
  dayDetails: { flex: 1 },
  dayName: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  condition: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s, marginTop: 2 },
  temps: { alignItems: 'flex-end' },
  lowTemperature: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s, marginTop: 2 },
});
