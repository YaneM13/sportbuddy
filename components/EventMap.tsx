import { router } from 'expo-router';
import { useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

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
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: userLatitude,
          longitude: userLongitude,
          latitudeDelta: 0.3,
          longitudeDelta: 0.3,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
        moveOnMarkerPress={false}
        toolbarEnabled={false}
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
            tracksViewChanges={false}
          >
            <Callout
              tooltip={true}
              onPress={() => router.push({ pathname: '/event-details', params: { id: e.id } } as any)}
            >
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{e.title}</Text>
                <Text style={styles.calloutSport}>{e.sport}</Text>
                <Text style={styles.calloutLocation} numberOfLines={2}>{e.location}</Text>
                <View style={styles.calloutBtn}>
                  <Text style={styles.calloutBtnText}>View details</Text>
                </View>
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
  callout: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  calloutTitle: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  calloutSport: { fontSize: 12, color: '#1D9E75', fontWeight: '500', marginBottom: 4 },
  calloutLocation: { fontSize: 12, color: '#888', marginBottom: 10 },
  calloutBtn: { backgroundColor: '#1D9E75', padding: 8, borderRadius: 8, alignItems: 'center' },
  calloutBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
});