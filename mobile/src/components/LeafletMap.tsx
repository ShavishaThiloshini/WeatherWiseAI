import React from 'react';
import { LatLngExpression } from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, LayerGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Read OpenWeather API key from env/global (do not commit keys)
const OPENWEATHER_KEY = (process.env.EXPO_PUBLIC_OPENWEATHER_KEY as string) || (process.env.OPENWEATHER_API_KEY as string) || (globalThis as any).__OPENWEATHER_API_KEY__;

// A Leaflet map component intended for web (react-leaflet).
// If an OpenWeather key is present, an overlay layer (precipitation) will be shown.
export default function LeafletMap({ latitude = 0, longitude = 0, height = '60vh' }: { latitude?: number; longitude?: number; height?: string }) {
  const center: LatLngExpression = [latitude, longitude];

  const openWeatherUrl = OPENWEATHER_KEY
    ? `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_KEY}`
    : null;

  return (
    <div style={{ height: height, width: '100%' }}>
      <MapContainer center={center} zoom={7} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {openWeatherUrl ? (
          <LayerGroup>
            <TileLayer
              attribution='Map data © OpenWeather'
              url={openWeatherUrl}
              opacity={0.6}
            />
          </LayerGroup>
        ) : null}

        <Marker position={center}>
          <Popup>You're here</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
