/**
 * screens/TravelScreen.tsx
 * Travel safety comparison for WeatherWise AI.
 *
 * Day 27 Integration:
 *  - User types a destination city / coordinates
 *  - POST /api/v1/travel/compare → risk_level + risk_factors + suggested_departure
 *  - Displays Low / Medium / High risk card with colour coding and factor list
 *  - Also links to the WeatherMapScreen
 *  - Loading, empty, and error states per UIUXDesignBrief §8
 */

import React from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { apiFetch } from '../services/api';
import { getCurrentLocation } from '../services/locationService';
import type { TravelMapStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<TravelMapStackParamList, 'Travel'>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TravelRiskResult {
  risk_level: 'low' | 'medium' | 'high';
  risk_factors: string[] | string;
  suggested_departure?: string;
  origin?: Record<string, unknown>;
  destination?: Record<string, unknown>;
}

interface GeocodeResult {
  lat: number;
  lon: number;
  displayName: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function riskStyle(level: string): { bg: string; border: string; text: string; emoji: string; label: string } {
  switch (level) {
    case 'high':
      return { bg: COLORS.dangerLight, border: COLORS.danger, text: COLORS.danger, emoji: '🔴', label: 'High Risk' };
    case 'medium':
      return { bg: COLORS.warningLight, border: COLORS.warning, text: COLORS.warning, emoji: '🟡', label: 'Moderate Risk' };
    default:
      return { bg: COLORS.successLight, border: COLORS.success, text: COLORS.success, emoji: '🟢', label: 'Low Risk' };
  }
}

function parseFactors(raw: string[] | string): string[] {
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw) as string[]; } catch { return String(raw).split(',').map((s) => s.trim()).filter(Boolean); }
}

/** Simple geocode using Nominatim (free, no API key). */
async function geocodeCity(city: string): Promise<GeocodeResult> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'WeatherWiseAI/1.0' } });
  if (!res.ok) throw new Error('Location search failed.');
  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  if (!data.length) throw new Error(`"${city}" not found. Try a different city name.`);
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), displayName: data[0].display_name };
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function TravelScreen({ navigation }: Props) {
  const [destination, setDestination] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<TravelRiskResult | null>(null);
  const [destName, setDestName] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const handleCompare = React.useCallback(async () => {
    const trimmed = destination.trim();
    if (!trimmed) return;

    Keyboard.dismiss();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const [origin, dest] = await Promise.all([
        getCurrentLocation(),
        geocodeCity(trimmed),
      ]);
      setDestName(dest.displayName);

      const response = await apiFetch<TravelRiskResult>('/travel/compare', {
        method: 'POST',
        body: JSON.stringify({
          origin: { latitude: origin.latitude, longitude: origin.longitude },
          destination: { latitude: dest.lat, longitude: dest.lon },
        }),
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to assess travel risk. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [destination]);

  const rStyle = result ? riskStyle(result.risk_level) : null;
  const factors = result ? parseFactors(result.risk_factors) : [];

  return (
    <ScreenContainer scrollable>
      <Text style={styles.pageTitle}>🚗 Travel Safety</Text>
      <Text style={styles.pageSubtitle}>
        Enter your destination to get a weather-based risk score for your journey.
      </Text>

      {/* ---- Destination input ---- */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Enter destination city…"
          placeholderTextColor={COLORS.textSecondary}
          value={destination}
          onChangeText={setDestination}
          returnKeyType="search"
          onSubmitEditing={() => void handleCompare()}
          accessibilityLabel="Destination city"
        />
        <Pressable
          style={({ pressed }) => [styles.searchBtn, pressed && styles.searchBtnPressed]}
          onPress={() => void handleCompare()}
          disabled={isLoading || !destination.trim()}
          accessibilityRole="button"
          accessibilityLabel="Check travel risk"
        >
          <Text style={styles.searchBtnText}>Check</Text>
        </Pressable>
      </View>

      {/* ---- Loading ---- */}
      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Assessing travel risk…</Text>
        </View>
      )}

      {/* ---- Error ---- */}
      {error && !isLoading && (
        <View style={styles.errorCard}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* ---- Risk result ---- */}
      {result && rStyle && !isLoading && (
        <>
          <View style={[styles.riskCard, { backgroundColor: rStyle.bg, borderColor: rStyle.border }]}>
            <Text style={styles.riskEmoji}>{rStyle.emoji}</Text>
            <View style={styles.riskBody}>
              <Text style={[styles.riskLabel, { color: rStyle.text }]}>{rStyle.label}</Text>
              <Text style={styles.riskDest} numberOfLines={2}>{destName}</Text>
            </View>
          </View>

          {/* Risk factors */}
          {factors.length > 0 && (
            <View style={styles.factorsCard}>
              <Text style={styles.factorsTitle}>Contributing Risk Factors</Text>
              {factors.map((factor, i) => (
                <View key={i} style={styles.factorRow}>
                  <Text style={styles.factorBullet}>•</Text>
                  <Text style={styles.factorText}>{factor}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Suggested departure */}
          {result.suggested_departure && (
            <View style={styles.departureCard}>
              <Text style={styles.departureIcon}>🕐</Text>
              <View style={styles.departureBody}>
                <Text style={styles.departureTitle}>Suggested Departure</Text>
                <Text style={styles.departureTime}>
                  {new Date(result.suggested_departure).toLocaleString()}
                </Text>
              </View>
            </View>
          )}
        </>
      )}

      {/* ---- Map link ---- */}
      <TouchableOpacity
        style={styles.mapBtn}
        onPress={() => navigation.navigate('Map')}
        accessibilityRole="button"
        accessibilityLabel="Open weather map"
      >
        <Text style={styles.mapBtnText}>🗺️  Open Weather Map</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.extraBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  pageSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.textSecondary,
    marginBottom: SPACING.m,
    lineHeight: TYPOGRAPHY.fontSize.s * 1.5,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.s,
    marginBottom: SPACING.m,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.m,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    minHeight: 52,
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.m,
    paddingHorizontal: SPACING.m,
    justifyContent: 'center',
    minHeight: 52,
    minWidth: 72,
  },
  searchBtnPressed: { opacity: 0.8 },
  searchBtnText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    textAlign: 'center',
  },
  center: {
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.m,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.m,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.dangerLight,
    borderRadius: BORDER_RADIUS.m,
    padding: SPACING.m,
    gap: SPACING.s,
    marginBottom: SPACING.m,
  },
  errorIcon: { fontSize: 20 },
  errorText: {
    flex: 1,
    color: COLORS.danger,
    fontSize: TYPOGRAPHY.fontSize.s,
    lineHeight: TYPOGRAPHY.fontSize.s * 1.5,
  },
  riskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 2,
    padding: SPACING.l,
    gap: SPACING.m,
    marginBottom: SPACING.m,
    ...SHADOWS.card,
  },
  riskEmoji: { fontSize: 40 },
  riskBody: { flex: 1 },
  riskLabel: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.extraBold,
    marginBottom: SPACING.xs,
  },
  riskDest: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.fontSize.s * 1.5,
  },
  factorsCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.m,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    ...SHADOWS.subtle,
  },
  factorsTitle: {
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.s,
  },
  factorRow: {
    flexDirection: 'row',
    gap: SPACING.s,
    marginBottom: SPACING.xs,
  },
  factorBullet: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.m,
    lineHeight: TYPOGRAPHY.fontSize.m * 1.5,
  },
  factorText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.s,
    lineHeight: TYPOGRAPHY.fontSize.s * 1.5,
  },
  departureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.m,
    padding: SPACING.m,
    gap: SPACING.m,
    marginBottom: SPACING.m,
    ...SHADOWS.subtle,
  },
  departureIcon: { fontSize: 28 },
  departureBody: { flex: 1 },
  departureTitle: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  departureTime: {
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.textPrimary,
  },
  mapBtn: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.m,
    alignItems: 'center',
    marginTop: SPACING.s,
    marginBottom: SPACING.l,
  },
  mapBtnText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
});
