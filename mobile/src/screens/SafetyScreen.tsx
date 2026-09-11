/**
 * screens/SafetyScreen.tsx
 * Severe-weather alerts and Safety Center for WeatherWise AI.
 *
 * Day 27 Integration:
 *  - Fetches active alerts from GET /api/v1/alerts
 *  - Displays each alert color-coded by severity with an explanation
 *  - Shows calm empty state when no alerts are active (UIUXDesignBrief §7.3)
 *  - Loading and error states per UIUXDesignBrief §8
 */

import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { apiFetch } from '../services/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BackendAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high';
  reason: string;
  is_active: boolean;
  created_at: string;
  /** Optional human-readable title (may come from AI layer) */
  title?: string;
}

interface AlertsResponse {
  alerts: BackendAlert[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALERT_TYPE_LABEL: Record<string, string> = {
  heat: 'Extreme Heat',
  heavy_rain: 'Heavy Rain',
  thunderstorm: 'Thunderstorm',
  strong_wind: 'Strong Winds',
  cold: 'Cold Weather',
  high_uv: 'High UV Index',
};

const ALERT_TYPE_EMOJI: Record<string, string> = {
  heat: '🌡️',
  heavy_rain: '🌧️',
  thunderstorm: '⛈️',
  strong_wind: '💨',
  cold: '🥶',
  high_uv: '☀️',
};

function severityStyle(severity: string): { bg: string; border: string; badge: string; badgeText: string; label: string } {
  switch (severity) {
    case 'high':
      return {
        bg: COLORS.dangerLight,
        border: COLORS.danger,
        badge: COLORS.danger,
        badgeText: COLORS.white,
        label: 'High Risk',
      };
    case 'medium':
      return {
        bg: COLORS.warningLight,
        border: COLORS.warning,
        badge: COLORS.warning,
        badgeText: COLORS.white,
        label: 'Moderate Risk',
      };
    default:
      return {
        bg: COLORS.infoLight,
        border: COLORS.info,
        badge: COLORS.info,
        badgeText: COLORS.white,
        label: 'Advisory',
      };
  }
}

// ---------------------------------------------------------------------------
// Alert Card
// ---------------------------------------------------------------------------

function AlertCard({ alert }: { alert: BackendAlert }) {
  const [expanded, setExpanded] = React.useState(false);
  const sStyle = severityStyle(alert.severity);
  const emoji = ALERT_TYPE_EMOJI[alert.alert_type] ?? '⚠️';
  const title = alert.title ?? ALERT_TYPE_LABEL[alert.alert_type] ?? alert.alert_type;

  return (
    <TouchableOpacity
      style={[styles.alertCard, { backgroundColor: sStyle.bg, borderColor: sStyle.border }]}
      onPress={() => setExpanded((e) => !e)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${title} alert. ${expanded ? 'Collapse' : 'Expand'} for details.`}
    >
      <View style={styles.alertHeader}>
        <Text style={styles.alertEmoji}>{emoji}</Text>
        <View style={styles.alertTitleBlock}>
          <Text style={[styles.alertTitle, { color: sStyle.badge }]}>{title}</Text>
          <View style={[styles.severityBadge, { backgroundColor: sStyle.badge }]}>
            <Text style={[styles.severityBadgeText, { color: sStyle.badgeText }]}>
              {sStyle.label}
            </Text>
          </View>
        </View>
        <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
      </View>

      {expanded && (
        <View style={styles.alertBody}>
          <Text style={styles.alertReason}>{alert.reason}</Text>
          <Text style={styles.alertTimestamp}>
            Issued: {new Date(alert.created_at).toLocaleString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function SafetyScreen() {
  const [alerts, setAlerts] = React.useState<BackendAlert[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadAlerts = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiFetch<AlertsResponse>('/alerts');
      setAlerts((response.alerts ?? []).filter((a) => a.is_active));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load safety alerts.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  // ---- Loading ----
  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Checking for alerts…</Text>
        </View>
      </ScreenContainer>
    );
  }

  // ---- Error ----
  if (error) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={styles.stateIcon}>⚠️</Text>
          <Text style={styles.stateMessage}>
            {`We couldn't reach the weather service.\n${error}`}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void loadAlerts()} accessibilityRole="button">
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // ---- Empty ----
  if (alerts.length === 0) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={styles.stateIcon}>🌤️</Text>
          <Text style={styles.stateTitle}>All Clear</Text>
          <Text style={styles.stateMessage}>No severe weather right now.</Text>
          <Text style={styles.stateSubMessage}>
            You'll be notified if conditions change in your area.
          </Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => void loadAlerts()} accessibilityRole="button">
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // ---- Alerts list ----
  return (
    <ScreenContainer scrollable>
      <Text style={styles.pageTitle}>⚠️ Active Alerts</Text>
      <Text style={styles.pageSubtitle}>
        {alerts.length} active alert{alerts.length !== 1 ? 's' : ''} for your area.
        Tap an alert for details and recommended actions.
      </Text>

      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </ScreenContainer>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.s,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.m,
    marginTop: SPACING.s,
  },
  stateIcon: { fontSize: 56, marginBottom: SPACING.s },
  stateTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  stateMessage: {
    fontSize: TYPOGRAPHY.fontSize.m,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.m * 1.5,
  },
  stateSubMessage: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.s * 1.5,
    marginTop: SPACING.xs,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    marginTop: SPACING.m,
  },
  retryBtnText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  refreshBtn: {
    borderColor: COLORS.primary,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    marginTop: SPACING.m,
  },
  refreshBtnText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },

  // Page header
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

  // Alert card
  alertCard: {
    borderRadius: BORDER_RADIUS.m,
    borderWidth: 1.5,
    marginBottom: SPACING.m,
    overflow: 'hidden',
    ...SHADOWS.subtle,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    gap: SPACING.m,
  },
  alertEmoji: { fontSize: 28 },
  alertTitleBlock: { flex: 1, gap: SPACING.xs },
  alertTitle: {
    fontSize: TYPOGRAPHY.fontSize.m,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  severityBadge: {
    alignSelf: 'flex-start',
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.s,
    paddingVertical: 2,
  },
  severityBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 0.3,
  },
  expandIcon: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    paddingHorizontal: SPACING.xs,
  },
  alertBody: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SPACING.m,
    gap: SPACING.s,
  },
  alertReason: {
    fontSize: TYPOGRAPHY.fontSize.s,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.fontSize.s * 1.6,
  },
  alertTimestamp: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});
