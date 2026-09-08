import { useEffect, useState } from 'react';
import type { WeatherData } from '../types';
import { getCurrentWeather, MOCK_WEATHER } from '../services/weatherService';

export function useWeather(latitude?: number, longitude?: number) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const w = latitude !== undefined && longitude !== undefined ? await getCurrentWeather(latitude, longitude) : MOCK_WEATHER;
        if (mounted) setData(w);
      } catch (err: any) {
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [latitude, longitude]);

  return { data, loading, error };
}
