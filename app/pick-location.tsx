import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function PickLocationScreen() {
  const [userLocation, setUserLocation] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const mapRef = useRef<any>(null);

  useEffect(() => { fetchLocation(); }, []);

  async function fetchLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation(loc.coords);
    }
    setLoading(false);
  }

  async function reverseGeocode(lat: number, lon: number) {
    setGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'SportBuddy/1.0' } }
      );
      const data = await response.json();
      setSelectedAddress(data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    } catch (e) {
      setSelectedAddress(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    }
    setGeocoding(false);
  }

  function handleMapPress(e: any) {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    reverseGeocode(latitude, longitude);
  }

  async function handleConfirm() {
    if (!selectedLocation) return;
    await AsyncStorage.setItem('pickedLocation', JSON.stringify({
      lat: selectedLocation.latitude,
      lon: selectedLocation.longitude,
      address: selectedAddress,
    }));
    router.back();
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#1D9E75" /></View>;
  }

  const defaultRegion = {
    latitude: userLocation?.latitude ?? 41.9981,
    longitude: userLocation?.longitude ?? 21.4254,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Pick location</Text>
        <Text style={styles.subtitle}>Tap on the map to set event location</Text>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? 'google' : undefined}
        initialRegion={defaultRegion}
        showsUserLocation={true}
        onPress={handleMapPress}
      >
        {selectedLocation && (
          <Marker coordinate={selectedLocation} pinColor="#1D9E75" />
        )}
      </MapView>

      {selectedLocation && (
        <View style={styles.footer}>
          <Text style={styles.addressLabel}>Selected location:</Text>
          <Text style={styles.addressText} numberOfLines={2}>
            {geocoding ? 'Getting address...' : selectedAddress}
          </Text>
          <TouchableOpacity
            style={[styles.confirmBtn, geocoding && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={geocoding}
          >
            <Text style={styles.confirmBtnText}>✅ Confirm location</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { padding: 24, paddingTop: 60, borderBottomWidth: 0.5, borderBottomColor: '#e0e0e0' },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 17, color: '#1D9E75', fontWeight: '500' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888' },
  map: { flex: 1 },
  footer: { padding: 16, borderTopWidth: 0.5, borderTopColor: '#e0e0e0', backgroundColor: '#fff' },
  addressLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  addressText: { fontSize: 14, color: '#1a1a1a', marginBottom: 12 },
  confirmBtn: { backgroundColor: '#1D9E75', padding: 14, borderRadius: 12, alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: '#ccc' },
  confirmBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});