import { useRef, useEffect } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';

interface WeatherMarker {
  lat: number;
  lng: number;
  city: string;
  temp: number;
  size: number;
}

const sampleMarkers: WeatherMarker[] = [
  { lat: 51.5074, lng: -0.1278, city: 'London', temp: 18, size: 0.5 },
  { lat: 40.7128, lng: -74.0060, city: 'New York', temp: 24, size: 0.5 },
  { lat: 35.6762, lng: 139.6503, city: 'Tokyo', temp: 21, size: 0.5 },
  { lat: 6.9271, lng: 79.8612, city: 'Colombo', temp: 30, size: 0.5 },
];

export default function WeatherGlobe() {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);

  useEffect(() => {
    if (globeEl.current) {
      // Auto-rotate the globe slowly
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.6;
    }
  }, []);

  return (
    <div style={{ width: '100%', height: '500px', backgroundColor: '#000' }}>
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        
        // Custom Weather Points/Markers
        htmlElementsData={sampleMarkers}
        htmlElement={(d) => {
          const marker = d as WeatherMarker;
          const el = document.createElement('div');
          el.innerHTML = `
            <div style="
              color: white; 
              background: rgba(0,0,0,0.7); 
              padding: 4px 8px; 
              border-radius: 6px; 
              border: 1px solid #48bb78;
              font-family: sans-serif;
              font-size: 12px;
              pointer-events: auto;
              cursor: pointer;
            ">
              <b>${marker.city}</b>: ${marker.temp}°C
            </div>
          `;
          el.onclick = () => alert(`Selected ${marker.city}`);
          return el;
        }}
      />
    </div>
  );
}