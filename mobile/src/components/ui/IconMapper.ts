/**
 * components/ui/IconMapper.ts
 * Maps weather conditions to emoji icons for consistent visuals.
 */

import type { WeatherCondition } from "../../types";

export const CONDITION_ICONS: Record<WeatherCondition, string> = {
  sunny: "☀️",
  "partly-cloudy": "⛅",
  cloudy: "☁️",
  rainy: "🌧️",
  stormy: "⛈️",
  snowy: "❄️",
  foggy: "🌫️",
  windy: "🌬️",
  unknown: "🌡️",
};

export function conditionIcon(condition: string): string {
  return CONDITION_ICONS[condition as WeatherCondition] ?? "🌡️";
}

export function uvLabel(uv: number): {
  label: string;
  tone: "info" | "success" | "warning" | "danger";
} {
  if (uv >= 11) return { label: "Extreme", tone: "danger" };
  if (uv >= 8) return { label: "Very High", tone: "danger" };
  if (uv >= 6) return { label: "High", tone: "warning" };
  if (uv >= 3) return { label: "Moderate", tone: "info" };
  return { label: "Low", tone: "success" };
}
