/**
 * hooks/useLocation.ts
 * Loads the device's current location.
 */

import { getCurrentLocation } from "../services/locationService";
import { useAsyncData } from "./useAsyncData";
import type { LocationData } from "../types";

export function useLocation() {
  return useAsyncData<LocationData>(() => getCurrentLocation(), []);
}
