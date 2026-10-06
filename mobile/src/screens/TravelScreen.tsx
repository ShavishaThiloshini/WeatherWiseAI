import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import type { TravelMapStackParamList } from '../navigation/RootNavigator';
import { getCurrentLocation } from '../services/locationService';
import { compareTravelRisk, getCurrentWeather } from '../services/weatherService';
import type { LocationData, TravelRiskComparison, WeatherData } from '../types';

type Props = NativeStackScreenProps<TravelMapStackParamList, 'Travel'>;

interface GeocodingResult {
  name?: string;
  display_name?: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

async function findDestination(query: string): Promise<LocationData> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    limit: '1',
    q: query,
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { Accept: 'application/json', 'Accept-Language': 'en' },
  });
  if (!response.ok) throw new Error('Place search is temporarily unavailable. Try again shortly.');

  const results = await response.json() as GeocodingResult[];
  const result = results[0];
  if (!result) throw new Error('We could not find that place. Try a city and country.');

  const address = result.address ?? {};
  const city = address.city || address.town || address.village || address.municipality || address.county || result.name || query;
  const country = address.country || '';
  return {
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    city,
    region: address.state || '',
    country,
    displayName: result.display_name || [city, country].filter(Boolean).join(', '),
  };
}

function conditionIcon(condition: WeatherData['condition']): keyof typeof Ionicons.glyphMap {
  switch (condition) {
    case 'sunny': return 'sunny-outline';
    case 'partly-cloudy': return 'partly-sunny-outline';
    case 'cloudy': return 'cloudy-outline';
    case 'rainy': return 'rainy-outline';
    case 'stormy': return 'thunderstorm-outline';
    case 'snowy': return 'snow-outline';
    case 'foggy': return 'cloud-outline';
    case 'windy': return 'flag-outline';
    default: return 'help-circle-outline';
  }
}

function WeatherSummary({ label, location, weather }: { label: string; location: LocationData; weather: WeatherData }) {
  return (
    <View style={styles.weatherPanel}>
      <Text style={styles.panelEyebrow}>{label}</Text>
      <Text numberOfLines={1} style={styles.placeName}>{location.city}</Text>
      <Text numberOfLines={1} style={styles.placeRegion}>{location.country || location.region || location.displayName}</Text>
      <View style={styles.conditionsRow}>
        <Ionicons name={conditionIcon(weather.condition)} size={25} color={COLORS.warning} />
        <Text style={styles.temperature}>{weather.temperatureC}°</Text>
        <View style={styles.conditionCopy}>
          <Text numberOfLines={1} style={styles.condition}>{weather.conditionLabel}</Text>
          <Text style={styles.feelsLike}>Feels {weather.feelsLikeC}°C</Text>
        </View>
      </View>
      <View style={styles.metricRow}>
        <View style={styles.metric}>
          <Ionicons name="rainy-outline" size={15} color={COLORS.info} />
          <Text style={styles.metricText}>{weather.rainProbability}% rain</Text>
        </View>
        <View style={styles.metric}>
          <Ionicons name="navigate-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.metricText}>{weather.windSpeedKmh} km/h</Text>
        </View>
      </View>
    </View>
  );
}

export function TravelScreen({ navigation }: Props) {
  const [destinationQuery, setDestinationQuery] = React.useState('');
  const [comparison, setComparison] = React.useState<{
    origin: LocationData;
    originWeather: WeatherData;
    destination: LocationData;
    destinationWeather: WeatherData;
    risk: TravelRiskComparison;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const compareWeather = async () => {
    const query = destinationQuery.trim();
    if (!query || isLoading) return;

    setIsLoading(true);
    setError(null);
    setComparison(null);
    try {
      const [destination, origin] = await Promise.all([
        findDestination(query),
        getCurrentLocation(),
      ]);
      const [destinationWeather, originWeather, risk] = await Promise.all([
        getCurrentWeather(destination.latitude, destination.longitude),
        getCurrentWeather(origin.latitude, origin.longitude),
        compareTravelRisk(
          { latitude: origin.latitude, longitude: origin.longitude, label: origin.displayName },
          { latitude: destination.latitude, longitude: destination.longitude, label: destination.displayName },
        ),
      ]);
      setComparison({ origin, originWeather, destination, destinationWeather, risk });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to compare weather right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const risk = comparison?.risk;
  const riskColor = risk?.riskLevel === 'high'
    ? COLORS.danger
    : risk?.riskLevel === 'moderate'
      ? COLORS.warning
      : COLORS.secondary;
  const riskLabel = risk?.riskLevel ? risk.riskLevel[0].toUpperCase() + risk.riskLevel.slice(1) : '';

  return (
    <ScreenContainer scrollable>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>TRAVEL WEATHER</Text>
        <Text style={styles.title}>Know before{'\n'}you go.</Text>
        <Text style={styles.subtitle}>Compare live conditions where you are with the weather at your destination.</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.inputHeading}>
          <Ionicons name="location-outline" size={17} color={COLORS.secondary} />
          <Text style={styles.inputLabel}>DESTINATION</Text>
        </View>
        <TextInput
          accessibilityLabel="Destination city or place"
          autoCapitalize="words"
          autoCorrect={false}
          editable={!isLoading}
          onChangeText={(value) => {
            setDestinationQuery(value);
            setComparison(null);
            setError(null);
          }}
          onSubmitEditing={() => void compareWeather()}
          placeholder="City, region or country"
          placeholderTextColor={COLORS.textSecondary}
          returnKeyType="search"
          style={styles.input}
          value={destinationQuery}
        />
        <Pressable
          accessibilityRole="button"
          disabled={isLoading || !destinationQuery.trim()}
          onPress={() => void compareWeather()}
          style={({ pressed }) => [styles.searchButton, (pressed || isLoading) && styles.buttonPressed, (!destinationQuery.trim() || isLoading) && styles.buttonDisabled]}
        >
          {isLoading ? <ActivityIndicator size="small" color={COLORS.background} /> : <Ionicons name="arrow-forward" size={18} color={COLORS.background} />}
          <Text style={styles.searchButtonText}>{isLoading ? 'Checking weather' : 'Compare conditions'}</Text>
        </Pressable>
        {error ? (
          <View accessibilityRole="alert" style={styles.errorMessage}>
            <Ionicons name="alert-circle-outline" size={17} color={COLORS.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>

      {comparison && risk ? (
        <>
          <View style={[styles.riskPanel, { borderTopColor: riskColor }]}>
            <View style={styles.riskHeader}>
              <View>
                <Text style={styles.panelEyebrow}>WEATHER TRAVEL RISK</Text>
                <Text style={[styles.riskLabel, { color: riskColor }]}>{riskLabel}</Text>
              </View>
              <View style={styles.scoreWrap}>
                <Text style={[styles.scoreValue, { color: riskColor }]}>{risk.score}</Text>
                <Text style={styles.scoreOutOf}>/ 100</Text>
              </View>
            </View>
            <View style={styles.scoreTrack}>
              <View style={[styles.scoreFill, { width: `${risk.score}%`, backgroundColor: riskColor }]} />
            </View>
            <Text style={styles.riskAdvice}>{risk.summary}</Text>
          </View>

          <View style={styles.comparisonHeading}>
            <Text style={styles.sectionTitle}>Conditions now</Text>
            <View style={styles.liveLabel}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View>
          </View>
          <View style={styles.comparisonRow}>
            <WeatherSummary label="YOUR START" location={comparison.origin} weather={comparison.originWeather} />
            <View style={styles.routeArrow}><Ionicons name="arrow-forward" size={17} color={COLORS.textSecondary} /></View>
            <WeatherSummary label="DESTINATION" location={comparison.destination} weather={comparison.destinationWeather} />
          </View>

          <View style={styles.factorsSection}>
            <Text style={styles.sectionTitle}>What affects this score</Text>
            {risk.factors.map((factor) => (
              <View key={factor.type} style={styles.factorRow}>
                <Ionicons name={risk.riskLevel === 'high' ? 'warning-outline' : 'checkmark-circle-outline'} size={18} color={riskColor} />
                <View style={styles.factorCopy}>
                  <Text style={styles.factorTitle}>{factor.title}</Text>
                  <Text style={styles.factorText}>{factor.message}</Text>
                </View>
              </View>
            ))}
          </View>
          <Text style={styles.disclaimer}>Weather-only estimate based on current conditions. It does not include traffic, road closures, or future forecast changes. Check local alerts before travelling.</Text>
        </>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}><Ionicons name="navigate-circle-outline" size={30} color={COLORS.secondary} /></View>
          <Text style={styles.emptyTitle}>Your trip, at a glance</Text>
          <Text style={styles.emptyCopy}>Add a destination to see current weather at both ends and the conditions that may affect your journey.</Text>
        </View>
      )}

      <Pressable
        style={styles.mapLink}
        onPress={() => navigation.navigate('Map', comparison ? {
          latitude: comparison.destination.latitude,
          longitude: comparison.destination.longitude,
          label: comparison.destination.displayName,
        } : undefined)}
      >
        <Ionicons name="map-outline" size={17} color={COLORS.info} />
        <Text style={styles.mapLinkText}>Open weather map</Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: { paddingTop: SPACING.s, marginBottom: SPACING.l },
  eyebrow: { color: COLORS.secondary, fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.bold, marginBottom: SPACING.s },
  title: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.xxl, fontWeight: TYPOGRAPHY.fontWeight.extraBold, lineHeight: 33 },
  subtitle: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s, lineHeight: 20, marginTop: SPACING.s, maxWidth: 360 },
  searchSection: { marginBottom: SPACING.l },
  inputHeading: { alignItems: 'center', flexDirection: 'row', gap: SPACING.s, marginBottom: SPACING.s },
  inputLabel: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.bold },
  input: { backgroundColor: COLORS.backgroundCard, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.s, borderWidth: 1, color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.m, height: 52, paddingHorizontal: SPACING.m },
  searchButton: { alignItems: 'center', backgroundColor: COLORS.secondary, borderRadius: BORDER_RADIUS.s, flexDirection: 'row', gap: SPACING.s, height: 50, justifyContent: 'center', marginTop: SPACING.s },
  buttonPressed: { opacity: 0.8 },
  buttonDisabled: { opacity: 0.5 },
  searchButtonText: { color: COLORS.background, fontSize: TYPOGRAPHY.fontSize.s, fontWeight: TYPOGRAPHY.fontWeight.bold },
  errorMessage: { alignItems: 'flex-start', flexDirection: 'row', gap: SPACING.s, marginTop: SPACING.s },
  errorText: { color: COLORS.danger, flex: 1, fontSize: TYPOGRAPHY.fontSize.s, lineHeight: 19 },
  emptyState: { alignItems: 'center', borderBottomColor: COLORS.border, borderBottomWidth: 1, borderTopColor: COLORS.border, borderTopWidth: 1, paddingHorizontal: SPACING.l, paddingVertical: SPACING.xl },
  emptyIcon: { alignItems: 'center', backgroundColor: '#15343A', borderRadius: BORDER_RADIUS.round, height: 56, justifyContent: 'center', marginBottom: SPACING.m, width: 56 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.l, fontWeight: TYPOGRAPHY.fontWeight.bold, marginBottom: SPACING.s },
  emptyCopy: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s, lineHeight: 21, textAlign: 'center' },
  riskPanel: { backgroundColor: COLORS.backgroundCard, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.s, borderTopWidth: 3, marginBottom: SPACING.l, padding: SPACING.m },
  riskHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  panelEyebrow: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.bold },
  riskLabel: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.bold, marginTop: 2 },
  scoreWrap: { alignItems: 'baseline', flexDirection: 'row' },
  scoreValue: { fontSize: 40, fontWeight: TYPOGRAPHY.fontWeight.extraBold, lineHeight: 46 },
  scoreOutOf: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s, marginLeft: 3 },
  scoreTrack: { backgroundColor: COLORS.border, borderRadius: BORDER_RADIUS.round, height: 6, marginTop: SPACING.s, overflow: 'hidden' },
  scoreFill: { borderRadius: BORDER_RADIUS.round, height: '100%' },
  riskAdvice: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.s, lineHeight: 21, marginTop: SPACING.m },
  comparisonHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.s },
  sectionTitle: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.l, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  liveLabel: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  liveDot: { backgroundColor: COLORS.secondary, borderRadius: BORDER_RADIUS.round, height: 6, width: 6 },
  liveText: { color: COLORS.secondary, fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.bold },
  comparisonRow: { alignItems: 'stretch', flexDirection: 'row', gap: 7 },
  weatherPanel: { backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.s, flex: 1, minWidth: 0, padding: SPACING.s },
  placeName: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.bold, marginTop: 5 },
  placeRegion: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.xs, marginTop: 2 },
  conditionsRow: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: SPACING.s },
  temperature: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.xxl, fontWeight: TYPOGRAPHY.fontWeight.bold },
  conditionCopy: { flex: 1, minWidth: 0 },
  condition: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.medium },
  feelsLike: { color: COLORS.textSecondary, fontSize: 10, marginTop: 2 },
  metricRow: { borderTopColor: COLORS.border, borderTopWidth: 1, gap: 5, marginTop: SPACING.s, paddingTop: SPACING.s },
  metric: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  metricText: { color: COLORS.textSecondary, flexShrink: 1, fontSize: 10 },
  routeArrow: { alignItems: 'center', justifyContent: 'center', width: 17 },
  factorsSection: { marginTop: SPACING.l },
  factorRow: { alignItems: 'flex-start', flexDirection: 'row', gap: SPACING.s, marginTop: SPACING.m },
  factorCopy: { flex: 1 },
  factorTitle: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.s, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  factorText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s, lineHeight: 20, marginTop: 2 },
  disclaimer: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.xs, lineHeight: 18, marginTop: SPACING.l },
  mapLink: { alignItems: 'center', borderTopColor: COLORS.border, borderTopWidth: 1, flexDirection: 'row', gap: SPACING.s, marginTop: SPACING.l, paddingVertical: SPACING.m },
  mapLinkText: { color: COLORS.info, flex: 1, fontSize: TYPOGRAPHY.fontSize.s, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
});
