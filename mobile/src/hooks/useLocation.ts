import { useEffect, useState } from 'react';
import type { LocationData } from '../types';
import { getCurrentLocation, MOCK_LOCATION } from '../services/locationService';

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const loc = await getCurrentLocation();
        if (mounted) setLocation(loc);
      } catch (err: any) {
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return { location, loading, error };
}
