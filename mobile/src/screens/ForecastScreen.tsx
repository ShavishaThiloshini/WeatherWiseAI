import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyView, ErrorView } from '../components/StateViews';
import { getCurrentLocation } from '../services/locationService';
import { getForecast } from '../services/weatherService';
import type { DailyForecast, ForecastData, HourlyForecast } from '../types';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

function rainColor(probability: number): string {
  if (probability >= 70) return COLORS.danger;
  if (probability >= 40) return COLORS.warning;
  return COLORS.info;
}

function formatDay(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
}

function formatHour(time: string): string {
  const parsed = new Date(time);
  return Number.isNaN(parsed.getTime()) ? '--:--' : parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function conditionIcon(condition: DailyForecast['condition']): string {
  if (condition === 'rainy') return '🌧️';
  if (condition === 'stormy') return '⛈️';
  if (condition === 'snowy') return '❄️';
  if (condition === 'sunny') return '☀️';
  if (condition === 'foggy') return '🌫️';
  return '⛅';
}

function HourCard({ hour }: { hour: HourlyForecast }) {
  return (
    <View
      style={styles.hourCard}
      accessible
      accessibilityLabel={`${formatHour(hour.time)}, ${hour.temperatureC} degrees, ${hour.rainProbability}% rain chance`}
    >
      <Text style={styles.hourTime}>{formatHour(hour.time)}</Text>
      <Text style={styles.hourIcon}>{conditionIcon(hour.condition)}</Text>
      <Text style={styles.hourTemp}>{hour.temperatureC}°</Text>
      <Text style={[styles.rainText, { color: rainColor(hour.rainProbability) }]}>☔ {hour.rainProbability}%</Text>
    </View>
  );
}

function DayRow({ day, selected, onPress }: { day: DailyForecast; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.dayRow, selected && styles.dayRowSelected]}
      accessibilityRole="button"
      accessibilityLabel={`Show forecast details for ${formatDay(day.date)}`}
    >
      <Text style={styles.dayLabel}>{formatDay(day.date)}</Text>
      <Text style={styles.dayIcon}>{conditionIcon(day.condition)}</Text>
      <Text style={styles.dayCondition}>{day.conditionLabel}</Text>
      <Text style={styles.dayTemperature}>{day.minTempC}° / {day.maxTempC}°</Text>
      <Text style={[styles.dayRain, { color: rainColor(day.rainProbability) }]}>☔ {day.rainProbability}%</Text>
    </Pressable>
  );
}

export function ForecastScreen() {
  const [forecast, setForecast] = React.useState<ForecastData | null>(null);
  const [selectedDay, setSelectedDay] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadForecast = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const location = await getCurrentLocation();
      setForecast(await getForecast(location.latitude, location.longitude));
      setSelectedDay(0);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load the forecast.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadForecast();
  }, [loadForecast]);

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.state}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.stateText}>Loading forecast</Text>
        </View>
      </ScreenContainer>
    );
  }
  if (error) return <ScreenContainer><ErrorView message={error} onRetry={() => void loadForecast()} /></ScreenContainer>;
  if (!forecast || forecast.daily.length === 0) return <ScreenContainer><EmptyView message="No seven-day forecast is available." icon="📅" /></ScreenContainer>;

  const day = forecast.daily[Math.min(selectedDay, forecast.daily.length - 1)];
  return (
    <ScreenContainer scrollable>
      <Text style={styles.title}>Seven-day forecast</Text>
      <Text style={styles.subtitle}>Tap a day to inspect temperatures, rain chance, and UV.</Text>

      <SectionHeader title="Next hours" />
      {forecast.hourly.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourList}>
          {forecast.hourly.slice(0, 12).map((hour) => <HourCard key={hour.time} hour={hour} />)}
        </ScrollView>
      ) : <EmptyView message="Hourly details are unavailable." icon="🕒" />}

      <SectionHeader title="Daily forecast" />
      <View style={styles.dayList}>
        {forecast.daily.slice(0, 7).map((item, index) => (
          <DayRow key={item.date} day={item} selected={index === selectedDay} onPress={() => setSelectedDay(index)} />
        ))}
      </View>

      <View style={styles.detail}>
        <Text style={styles.detailTitle}>{formatDay(day.date)} details</Text>
        <Text style={styles.detailCondition}>{conditionIcon(day.condition)} {day.conditionLabel}</Text>
        <View style={styles.detailGrid}>
          <Text style={styles.detailMetric}>Low <Text style={styles.detailValue}>{day.minTempC}°C</Text></Text>
          <Text style={styles.detailMetric}>High <Text style={styles.detailValue}>{day.maxTempC}°C</Text></Text>
          <Text style={styles.detailMetric}>Rain <Text style={[styles.detailValue, { color: rainColor(day.rainProbability) }]}>{day.rainProbability}%</Text></Text>
          <Text style={styles.detailMetric}>UV <Text style={styles.detailValue}>{day.uvIndex}</Text></Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.m },
  stateText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.m },
  title: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.xxl, fontWeight: TYPOGRAPHY.fontWeight.bold },
  subtitle: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.m, marginTop: SPACING.xs },
  hourList: { gap: SPACING.s, paddingBottom: SPACING.s },
  hourCard: { alignItems: 'center', backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.m, minWidth: 88, padding: SPACING.s },
  hourTime: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.xs },
  hourIcon: { fontSize: 25, marginVertical: SPACING.xs },
  hourTemp: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.l, fontWeight: TYPOGRAPHY.fontWeight.bold },
  rainText: { fontSize: TYPOGRAPHY.fontSize.xs, marginTop: SPACING.xs },
  dayList: { gap: SPACING.s },
  dayRow: { alignItems: 'center', backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.m, flexDirection: 'row', gap: SPACING.s, minHeight: 64, padding: SPACING.m },
  dayRowSelected: { borderColor: COLORS.primary, borderWidth: 1 },
  dayLabel: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.semiBold, width: 70 },
  dayIcon: { fontSize: 24 },
  dayCondition: { color: COLORS.textSecondary, flex: 1, fontSize: TYPOGRAPHY.fontSize.s },
  dayTemperature: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.s },
  dayRain: { fontSize: TYPOGRAPHY.fontSize.s, fontWeight: TYPOGRAPHY.fontWeight.semiBold, minWidth: 52, textAlign: 'right' },
  detail: { backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.m, marginTop: SPACING.l, padding: SPACING.m },
  detailTitle: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.l, fontWeight: TYPOGRAPHY.fontWeight.bold },
  detailCondition: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.m, marginTop: SPACING.s },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.m, marginTop: SPACING.m },
  detailMetric: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s, minWidth: '42%' },
  detailValue: { color: COLORS.textPrimary, fontWeight: TYPOGRAPHY.fontWeight.bold },
});