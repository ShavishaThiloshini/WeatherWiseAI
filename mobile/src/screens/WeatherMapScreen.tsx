/**
 * screens/WeatherMapScreen.tsx
 * Interactive weather map with a live-style regional view.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { ScreenContainer } from '../components/ScreenContainer';
import { COLORS, SPACING } from '../constants/theme';

const defaultRegion = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const weatherMarker = {
  latitude: 37.78825,
  longitude: -122.4324,
};

export function WeatherMapScreen() {
  return (
    <ScreenContainer>
      <View style={styles.container}>
        <MapView
          style={styles.map}
          initialRegion={defaultRegion}
          showsCompass
          showsScale
          showsMyLocationButton
        >
          <Marker
            coordinate={weatherMarker}
            title="WeatherWise AI"
            description="Current weather area"
          />
        </MapView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
    marginTop: SPACING.s,
  },
});
