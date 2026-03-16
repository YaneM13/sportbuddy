import { router } from 'expo-router';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface Event {
  id: string;
  title: string;
  location: string;
  sport: string;
  latitude: number;
  longitude: number;
}

interface EventMapProps {
  events: Event[];
  userLatitude: number;
  userLongitude: number;
}

export default function EventMap({ events, userLatitude, userLongitude }: EventMapProps) {
  const webViewRef = useRef<any>(null);

  const markers = events
    .filter(e => e.latitude && e.longitude)
    .map(e => `
      var marker_${e.id.replace(/-/g, '_')} = L.marker([${e.latitude}, ${e.longitude}]).addTo(map);
      marker_${e.id.replace(/-/g, '_')}.bindPopup("<b>${e.title}</b><br>${e.sport}<br>${e.location}<br><button onclick='window.ReactNativeWebView.postMessage(\"${e.id}\")' style='margin-top:6px;padding:6px 12px;background:#1D9E75;color:white;border:none;border-radius:8px;cursor:pointer;'>View details</button>");
    `)
    .join('\n');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { width: 100%; height: 100vh; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${userLatitude}, ${userLongitude}], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        L.circle([${userLatitude}, ${userLongitude}], {
          color: '#1D9E75',
          fillColor: '#1D9E75',
          fillOpacity: 0.1,
          radius: 20000
        }).addTo(map);
        L.marker([${userLatitude}, ${userLongitude}], {
          icon: L.divIcon({
            html: '<div style="background:#1D9E75;width:14px;height:14px;border-radius:50%;border:2px solid white;"></div>',
            iconSize: [14, 14],
            className: ''
          })
        }).addTo(map).bindPopup("You are here");
        ${markers}
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.map}
        scrollEnabled={false}
        onMessage={(event) => {
          const eventId = event.nativeEvent.data;
          if (eventId) {
            router.push({ pathname: '/event-details', params: { id: eventId } } as any);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  map: {
    flex: 1,
  },
});