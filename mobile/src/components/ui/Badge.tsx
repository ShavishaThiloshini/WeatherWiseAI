/**
 * components/ui/Badge.tsx
 * Small colored pill for statuses, scores, and labels.
 */

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  COLORS,
  TYPOGRAPHY,
  BORDER_RADIUS,
  SPACING,
} from "../../constants/theme";
import type { RecommendationSeverity } from "../../types";

const TONES: Record<RecommendationSeverity, { bg: string; fg: string }> = {
  info: { bg: COLORS.infoLight, fg: COLORS.info },
  success: { bg: COLORS.successLight, fg: COLORS.success },
  warning: { bg: COLORS.warningLight, fg: COLORS.warning },
  danger: { bg: COLORS.dangerLight, fg: COLORS.danger },
};

interface BadgeProps {
  label: string;
  tone?: RecommendationSeverity;
}

export function Badge({ label, tone = "info" }: BadgeProps) {
  const { bg, fg } = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.s,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});
