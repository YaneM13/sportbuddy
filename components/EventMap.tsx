import { router } from 'expo-router';
import { useRef } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Callout, Circle, Marker } from 'react-native-maps';

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
  const mapRef = useRef<any>(null);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? 'google' : undefined}
        initialRegion={{
          latitude: userLatitude,
          longitude: userLongitude,
          latitudeDelta: 0.3,
          longitudeDelta: 0.3,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        <Circle
          center={{ latitude: userLatitude, longitude: userLongitude }}
          radius={20000}
          strokeColor="#1D9E75"
          fillColor="rgba(29, 158, 117, 0.1)"
        />
        {events.filter(e => e.latitude && e.longitude).map(e => (
          <Marker
            key={e.id}
            coordinate={{ latitude: e.latitude, longitude: e.longitude }}
            title={e.title}
            description={`${e.sport} · ${e.location}`}
          >
            <Callout onPress={() => router.push({ pathname: '/event-details', params: { id: e.id } } as any)}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{e.title}</Text>
                <Text style={styles.calloutSport}>{e.sport}</Text>
                <Text style={styles.calloutLocation}>{e.location}</Text>
                <TouchableOpacity style={styles.calloutBtn}>
                  <Text style={styles.calloutBtnText}>View details</Text>
                </TouchableOpacity>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  map: { flex: 1 },
  callout: { width: 180, padding: 8 },
  calloutTitle: { fontSize: 14, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  calloutSport: { fontSize: 12, color: '#1D9E75', marginBottom: 2 },
  calloutLocation: { fontSize: 12, color: '#888', marginBottom: 8 },
  calloutBtn: { backgroundColor: '#1D9E75', padding: 6, borderRadius: 8, alignItems: 'center' },
  calloutBtnText: { color: '#fff', fontSize: 12, fontWeight: '500' },
});