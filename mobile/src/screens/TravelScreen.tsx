import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import type { TravelMapStackParamList } from '../navigation/RootNavigator';
import { getCurrentLocation } from '../services/locationService';
import { compareTravelRisk } from '../services/weatherService';
import type { TravelRiskComparison } from '../types';

const DEFAULT_DESTINATION = {
  label: 'Kandy',
  latitude: 7.2906,
  longitude: 80.6337,
};

type Props = NativeStackScreenProps<TravelMapStackParamList, 'Travel'>;

export function TravelScreen({ navigation }: Props) {
  const [comparison, setComparison] = React.useState<TravelRiskComparison | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadTravelRisk = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const origin = await getCurrentLocation();
      const nextComparison = await compareTravelRisk(
        { latitude: origin.latitude, longitude: origin.longitude, label: origin.city || origin.displayName },
        DEFAULT_DESTINATION,
      );
      setComparison(nextComparison);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to compare travel conditions right now.');
      setComparison(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadTravelRisk();
  }, [loadTravelRisk]);

  const riskColor = comparison?.riskLevel === 'high'
    ? COLORS.danger
    : comparison?.riskLevel === 'moderate'
      ? COLORS.warning
      : COLORS.success;

  return (
    <ScreenContainer scrollable>
      <View style={styles.header}>
        <Text style={styles.emoji}>🚗</Text>
        <Text style={styles.title}>Travel Safety</Text>
        <Text style={styles.subtitle}>Compare your current weather with a destination before you leave.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Current / destination</Text>
        <Text style={styles.routeText}>Current: live location</Text>
        <Text style={styles.routeText}>Destination: {DEFAULT_DESTINATION.label}</Text>
      </View>

      {loading ? (
        <View style={styles.card}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Checking travel conditions…</Text>
        </View>
      ) : error ? (
        <View style={styles.card}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.secondaryButton} onPress={() => void loadTravelRisk()}>
            <Text style={styles.secondaryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : comparison ? (
        <>
          <View style={[styles.scoreCard, { borderColor: riskColor }]}> 
            <Text style={styles.scoreLabel}>Travel risk score</Text>
            <Text style={[styles.scoreValue, { color: riskColor }]}>{comparison.score}/100</Text>
            <View style={[styles.badge, { backgroundColor: riskColor }]}>
              <Text style={styles.badgeText}>{comparison.riskLevel.toUpperCase()}</Text>
            </View>
            <Text style={styles.summary}>{comparison.summary}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Main risk factors</Text>
            {comparison.factors.map((factor) => (
              <View key={`${factor.type}-${factor.title}`} style={styles.factorRow}>
                <Text style={styles.factorTitle}>{factor.title}</Text>
                <Text style={styles.factorValue}>{factor.value}</Text>
                <Text style={styles.factorMessage}>{factor.message}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <View style={styles.buttonRow}>
        <Pressable style={styles.secondaryButton} onPress={() => void loadTravelRisk()}>
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
  card: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 14,
    padding: SPACING.m,
    marginBottom: SPACING.m,
  },
  cardLabel: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.xs, textTransform: 'uppercase', letterSpacing: 1 },
  routeText: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.m, marginTop: SPACING.xs },
  scoreCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 14,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    borderWidth: 2,
  },
  scoreLabel: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s },
  scoreValue: { fontSize: 42, fontWeight: TYPOGRAPHY.fontWeight.bold, marginTop: SPACING.xs },
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: SPACING.m, paddingVertical: 6, marginTop: SPACING.s },
  badgeText: { color: COLORS.background, fontSize: TYPOGRAPHY.fontSize.s, fontWeight: TYPOGRAPHY.fontWeight.bold },
  summary: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.m, marginTop: SPACING.s, lineHeight: TYPOGRAPHY.fontSize.m * 1.6 },
  sectionTitle: { fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.bold, color: COLORS.textPrimary, marginBottom: SPACING.s },
  factorRow: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.s, marginTop: SPACING.s },
  factorTitle: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.semiBold },
  factorValue: { color: COLORS.primary, fontSize: TYPOGRAPHY.fontSize.s, marginTop: 4, fontWeight: TYPOGRAPHY.fontWeight.bold },
  factorMessage: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.s, marginTop: 4, lineHeight: TYPOGRAPHY.fontSize.s * 1.5 },
  loadingText: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.m, textAlign: 'center', marginTop: SPACING.s },
  errorText: { color: COLORS.danger, fontSize: TYPOGRAPHY.fontSize.m, marginBottom: SPACING.m },
  buttonRow: { flexDirection: 'row', gap: SPACING.s, marginTop: SPACING.s },
  button: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: SPACING.l, paddingVertical: SPACING.m, flex: 1 },
  secondaryButton: { backgroundColor: COLORS.backgroundCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: SPACING.l, paddingVertical: SPACING.m, flex: 1 },
  buttonText: { color: COLORS.background, fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.semiBold, textAlign: 'center' },
  secondaryButtonText: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.fontSize.m, fontWeight: TYPOGRAPHY.fontWeight.semiBold, textAlign: 'center' },
});
