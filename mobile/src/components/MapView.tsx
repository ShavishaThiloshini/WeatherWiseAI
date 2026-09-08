import React, { Suspense } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';

// Dynamically load the web Leaflet map only on web builds
const LeafletMap = React.lazy(() => import('./LeafletMap') as any);

export function MapView({ latitude = 0, longitude = 0, height = '60vh' }: { latitude?: number; longitude?: number; height?: string }) {
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.nativePlaceholder}>
        <Text style={styles.title}>Map (mobile)</Text>
        <Text style={styles.message}>
          Interactive map is available on web via Leaflet. For native builds use react-native-maps.
        </Text>
      </View>
    );
  }

  return (
    <Suspense fallback={<View style={styles.loading}><Text>Loading map…</Text></View>}>
      {/* @ts-ignore dynamic web-only component */}
      <LeafletMap latitude={latitude} longitude={longitude} height={height} />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  nativePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  message: { textAlign: 'center', color: '#666' },
  loading: { height: 300, alignItems: 'center', justifyContent: 'center' },
});
