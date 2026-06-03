import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Callout, Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface Event {
  id: string;
  title: string;
  location: string;
  sport: string;
  latitude: number;
  longitude: number;
  gender?: string;
}

interface EventMapProps {
  events: Event[];
  userLatitude: number;
  userLongitude: number;
}

function getPinColor(gender?: string) {
  if (gender === 'male') return '#185FA5';
  if (gender === 'female') return '#E24B4A';
  return '#1D9E75';
}

function getGenderLabel(gender?: string) {
  if (gender === 'male') return '♂️ Male';
  if (gender === 'female') return '♀️ Female';
  return '⚥ Mixed';
}

export default function EventMap({ events, userLatitude, userLongitude }: EventMapProps) {
  const mapRef = useRef<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

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
        onPress={() => setSelectedEvent(null)}
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
            pinColor={getPinColor(e.gender)}
            onPress={() => {
              if (Platform.OS === 'android') {
                setSelectedEvent(e);
              }
            }}
            onCalloutPress={() => router.push({ pathname: '/event-details', params: { id: e.id } } as any)}
          >
            {Platform.OS === 'ios' && (
              <Callout tooltip={true}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{e.title}</Text>
                  <Text style={styles.calloutSport}>{e.sport}</Text>
                  <Text style={[styles.calloutGender, { color: getPinColor(e.gender) }]}>
                    {getGenderLabel(e.gender)}
                  </Text>
                  <Text style={styles.calloutLocation} numberOfLines={2}>{e.location}</Text>
                  <View style={[styles.calloutBtn, { backgroundColor: getPinColor(e.gender) }]}>
                    <Text style={styles.calloutBtnText}>View details</Text>
                  </View>
                </View>
              </Callout>
            )}
          </Marker>
        ))}
      </MapView>

      {/* Android Bottom Sheet */}
      {Platform.OS === 'android' && selectedEvent && (
        <View style={styles.bottomSheet}>
          <Text style={styles.calloutTitle}>{selectedEvent.title}</Text>
          <Text style={styles.calloutSport}>{selectedEvent.sport}</Text>
          <Text style={[styles.calloutGender, { color: getPinColor(selectedEvent.gender) }]}>
            {getGenderLabel(selectedEvent.gender)}
          </Text>
          <Text style={styles.calloutLocation} numberOfLines={2}>{selectedEvent.location}</Text>
          <TouchableOpacity
            style={[styles.calloutBtn, { backgroundColor: getPinColor(selectedEvent.gender) }]}
            onPress={() => router.push({ pathname: '/event-details', params: { id: selectedEvent.id } } as any)}
          >
            <Text style={styles.calloutBtnText}>View details</Text>
          </TouchableOpacity>
        </View>
      )}
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
  bottomSheet: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  calloutTitle: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  calloutSport: { fontSize: 12, color: '#1D9E75', fontWeight: '500', marginBottom: 2 },
  calloutGender: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  calloutLocation: { fontSize: 12, color: '#888', marginBottom: 10 },
  calloutBtn: { padding: 8, borderRadius: 8, alignItems: 'center' },
  calloutBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
});