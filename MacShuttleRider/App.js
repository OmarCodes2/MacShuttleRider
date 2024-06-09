import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, StatusBar } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Callout } from 'react-native-maps';

const LOCKED_REGION = {
  latitude: 43.26252182610375,
  longitude: -79.92393298074603,
  latitudeDelta: 0.021165080277782522,
  longitudeDelta: 0.01742396503686905,
};

const MIN_LATITUDE_DELTA = 0.0005;
const MAX_LATITUDE_DELTA = 0.021165080277782522;

const calculateLongitudeDelta = (latitudeDelta) => latitudeDelta * (LOCKED_REGION.longitudeDelta / LOCKED_REGION.latitudeDelta);

export default function App() {
  const [region, setRegion] = useState(LOCKED_REGION);
  const [etas, setEtas] = useState({ stop1: "Loading...", stop2: "Loading..." });
  const [busPosition, setBusPosition] = useState({ latitude: 43.262670, longitude: -79.916121 });

  useEffect(() => {
    const ws = new WebSocket(process.env.EXPO_PUBLIC_WEBSOCKET_ENDPOINT);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setEtas(data.etas);
      setBusPosition(data.busPosition);
    };

    ws.onerror = (error) => {
      console.log("WebSocket Error: ", error);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleRegionChangeComplete = (newRegion) => {
    let latitude = newRegion.latitude;
    let longitude = newRegion.longitude;
    let latitudeDelta = newRegion.latitudeDelta;
    let longitudeDelta = newRegion.longitudeDelta;

    // Ensure the zoom level is within the set bounds
    if (latitudeDelta < MIN_LATITUDE_DELTA) {
      latitudeDelta = MIN_LATITUDE_DELTA;
    } else if (latitudeDelta > MAX_LATITUDE_DELTA) {
      latitudeDelta = MAX_LATITUDE_DELTA;
    }

    longitudeDelta = calculateLongitudeDelta(latitudeDelta);

    // Ensure the map stays within the locked region
    const maxLatitude = LOCKED_REGION.latitude + (LOCKED_REGION.latitudeDelta / 2);
    const minLatitude = LOCKED_REGION.latitude - (LOCKED_REGION.latitudeDelta / 2);
    const maxLongitude = LOCKED_REGION.longitude + (LOCKED_REGION.longitudeDelta / 2);
    const minLongitude = LOCKED_REGION.longitude - (LOCKED_REGION.longitudeDelta / 2);

    if (latitude < minLatitude) {
      latitude = minLatitude;
    } else if (latitude > maxLatitude) {
      latitude = maxLatitude;
    }

    if (longitude < minLongitude) {
      longitude = minLongitude;
    } else if (longitude > maxLongitude) {
      longitude = maxLongitude;
    }

    setRegion({
      latitude,
      longitude,
      latitudeDelta,
      longitudeDelta,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerText}>Mac Shuttle</Text>
      </View>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        <Marker coordinate={{ latitude: 43.2601414, longitude: -79.9219256 }}>
          <Callout>
            <Text>{etas.stop1}</Text>
          </Callout>
        </Marker>
        <Marker coordinate={{ latitude: 43.2632088, longitude: -79.9166429 }}>
          <Callout>
            <Text>{etas.stop2}</Text>
          </Callout>
        </Marker>
        <Marker coordinate={{ latitude: busPosition.latitude, longitude: busPosition.longitude }}>
          <Callout>
            <Text>Bus Position</Text>
          </Callout>
        </Marker>
      </MapView>
      <View style={styles.footer}>
        <Text style={styles.footerText}>© McMaster University 2024</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: 'rgb(122, 0, 60)',
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  map: {
    flex: 1,
  },
  footer: {
    backgroundColor: 'rgb(253, 191, 87)',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: '#fff',
    fontSize: 16,
  },
});
