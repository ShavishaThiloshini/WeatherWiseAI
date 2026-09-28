import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import type { TravelMapStackParamList } from '../navigation/RootNavigator';
import { getCurrentLocation } from '../services/locationService';
import { getCurrentWeather, getDestinationWeatherData, getTravelRecommendation } from '../services/weatherService';
import type { WeatherData } from '../types';

const DEFAULT_DESTINATION = {
  label: 'Kandy',
  latitude: 7.2906,
  longitude: 80.6337,
};

type Props = NativeStackScreenProps<TravelMapStackParamList, 'Travel'>;

export function TravelScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [originWeather, setOriginWeather] = React.useState<WeatherData | null>(null);
  const [destinationWeather, setDestinationWeather] = React.useState<any | null>(null);
  const [recommendation, setRecommendation] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [originName, setOriginName] = React.useState('Current Location');

  const loadTravelData = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const origin = await getCurrentLocation();
      setOriginName(origin.city || origin.displayName || 'Current Location');

      const [originW, destResponse, recResponse] = await Promise.all([
        getCurrentWeather(origin.latitude, origin.longitude),
        getDestinationWeatherData(DEFAULT_DESTINATION.latitude, DEFAULT_DESTINATION.longitude),
        getTravelRecommendation(
          { latitude: origin.latitude, longitude: origin.longitude },
          { latitude: DEFAULT_DESTINATION.latitude, longitude: DEFAULT_DESTINATION.longitude }
        ),
      ]);

      setOriginWeather(originW);
      setDestinationWeather(destResponse.weather);
      setRecommendation(recResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load travel data.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadTravelData();
  }, [loadTravelData]);

  const renderWeatherMetrics = (title: string, data: any, isDestination = false) => {
    if (!data) return <Text style={styles.missingData}>Data unavailable</Text>;
    
    // Map data fields to handle differences in naming from different APIs
    const temp = data.temperatureC ?? data.temperature;
    const feelsLike = data.feelsLikeC ?? data.feelsLike;
    const condition = data.conditionLabel ?? data.condition;
    const humidity = data.humidity;
    const windSpeed = data.windSpeedKmh ?? data.windSpeed;
    const rain = data.rainProbability;
    const uv = data.uvIndex;

    return (
      <View style={[styles.card, isDesktop && styles.desktopCard]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardEmoji}>{isDestination ? '✈️' : '📍'}</Text>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Temperature</Text>
          <Text style={styles.metricValue}>{temp != null ? `${temp}°C` : '-'}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Feels like</Text>
          <Text style={styles.metricValue}>{feelsLike != null ? `${feelsLike}°C` : '-'}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Condition</Text>
          <Text style={styles.metricValue}>{condition || '-'}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Humidity</Text>
          <Text style={styles.metricValue}>{humidity != null ? `${humidity}%` : '-'}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Wind Speed</Text>
          <Text style={styles.metricValue}>{windSpeed != null ? `${windSpeed} km/h` : '-'}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Rain Prob.</Text>
          <Text style={styles.metricValue}>{rain != null ? `${rain}%` : '-'}</Text>
        </View>
        {uv != null && (
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>UV Index</Text>
            <Text style={styles.metricValue}>{uv}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderDifferences = () => {
    if (!originWeather || !destinationWeather) return null;

    const oTemp = originWeather.temperatureC;
    const dTemp = destinationWeather.temperature;
    const tempDiff = dTemp - oTemp;

    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Weather Differences</Text>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Temperature</Text>
          <Text style={[styles.metricValue, { color: tempDiff > 0 ? COLORS.danger : tempDiff < 0 ? COLORS.info : COLORS.textPrimary }]}>
            {tempDiff > 0 ? '+' : ''}{tempDiff.toFixed(1)}°C
          </Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Humidity</Text>
          <Text style={styles.metricValue}>
            {(destinationWeather.humidity - originWeather.humidity) > 0 ? '+' : ''}
            {(destinationWeather.humidity - originWeather.humidity).toFixed(0)}%
          </Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Wind Speed</Text>
          <Text style={styles.metricValue}>
            {(destinationWeather.windSpeed - originWeather.windSpeedKmh) > 0 ? '+' : ''}
            {(destinationWeather.windSpeed - originWeather.windSpeedKmh).toFixed(1)} km/h
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer scrollable>
      <View style={styles.header}>
        <Text style={styles.emoji}>🚗</Text>
        <Text style={styles.title}>Travel Comparison</Text>
        <Text style={styles.subtitle}>Compare your current weather with your destination.</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Loading destination weather…</Text>
        </View>
      ) : error ? (
        <View style={styles.card}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.button} onPress={() => void loadTravelData()}>
            <Text style={styles.buttonText}>Retry</Text>
          </Pressable>
        </View>
      ) : originWeather && destinationWeather ? (
        <View style={styles.content}>
          <View style={isDesktop ? styles.desktopComparison : styles.mobileComparison}>
            {renderWeatherMetrics(originName, originWeather, false)}
            
            {!isDesktop && (
              <View style={styles.arrowContainer}>
                <Text style={styles.arrow}>↓</Text>
              </View>
            )}

            {renderWeatherMetrics(DEFAULT_DESTINATION.label, destinationWeather, true)}
          </View>

          {renderDifferences()}

          {/* AI Recommendation Section */}
          <View style={[styles.card, styles.aiCard]}>
            <Text style={styles.sectionTitle}>🕐 Best Travel Time</Text>
            {recommendation ? (
              <>
                <Text style={styles.aiTime}>{recommendation.bestTime || 'Consulting AI...'}</Text>
                <Text style={styles.aiMessage}>{recommendation.message || recommendation.summary || 'Wait for AI module recommendations.'}</Text>
              </>
            ) : (
              <Text style={styles.missingData}>Data unavailable</Text>
            )}
          </View>
        </View>
      ) : null}

      <View style={styles.buttonRow}>
        <Pressable style={styles.secondaryButton} onPress={() => void loadTravelData()}>
          <Text style={styles.secondaryButtonText}>Refresh</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => navigation.navigate('Map')}>
          <Text style={styles.buttonText}>Open Weather Map</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: SPACING.m },
  emoji: { fontSize: 56, marginBottom: SPACING.xs },
  title: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.textPrimary },
  subtitle: { fontSize: TYPOGRAPHY.fontSize.m, color: COLORS.textSecondary, textAlign: 'center', lineHeight: TYPOGRAPHY.fontSize.m * 1.6, marginTop: SPACING.xs },
  centered: { alignItems: 'center', padding: SPACING.xl },
  loadingText: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.m, marginTop: SPACING.m },
  errorText: { color: COLORS.danger, fontSize: TYPOGRAPHY.fontSize.m, marginBottom: SPACING.m, textAlign: 'center' },
  content: { gap: SPACING.m },
  mobileComparison: { gap: SPACING.s },
  desktopComparison: { flexDirection: 'row', gap: SPACING.m },
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.l,
    padding: SPACING.l,
    ...SHADOWS.card,
  },
  desktopCard: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.m, gap: SPACING.s },
  cardEmoji: { fontSize: 24 },
  cardTitle: { fontSize: TYPOGRAPHY.fontSize.l, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.textPrimary },
  sectionTitle: { fontSize: TYPOGRAPHY.fontSize.l, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.primary, marginBottom: SPACING.m },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  metricLabel: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.m },
  metricValue: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  arrowContainer: { alignItems: 'center', marginVertical: -SPACING.s, zIndex: 1 },
  arrow: { fontSize: 24, color: COLORS.primary, backgroundColor: COLORS.background, borderRadius: 12, paddingHorizontal: 8 },
  missingData: { color: COLORS.textSecondary, fontStyle: 'italic' },
  aiCard: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary, borderWidth: 1 },
  aiTime: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.primaryDark, marginBottom: SPACING.s },
  aiMessage: { fontSize: TYPOGRAPHY.fontSize.m, color: COLORS.textPrimary, lineHeight: 22 },
  buttonRow: { flexDirection: 'row', gap: SPACING.s, marginTop: SPACING.xl },
  button: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.m, padding: SPACING.m, flex: 1, alignItems: 'center' },
  secondaryButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.primary, borderRadius: BORDER_RADIUS.m, padding: SPACING.m, flex: 1, alignItems: 'center' },
  buttonText: { color: COLORS.white, fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.bold },
  secondaryButtonText: { color: COLORS.primary, fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.bold },
});
