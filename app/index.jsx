import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Text,
  StatusBar,
} from "react-native";
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import CustomButton from "../components/CustomButton";

export default function MapaInicial() {
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [savedCoordinates, setSavedCoordinates] = useState([]);
  const [defaultLocation] = useState({
    latitude: -23.55052,
    longitude: -46.633308,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [currentRegion, setCurrentRegion] = useState(defaultLocation);
  const router = useRouter();
  const mapRef = useRef(null);
  const params = useLocalSearchParams();

  const carregarCoordenadas = useCallback(async () => {
    try {
      const jsonValue = await AsyncStorage.getItem("@coordenadas");
      if (jsonValue) {
        const coordenadas = JSON.parse(jsonValue).map((coord) => ({
          ...coord,
          id: coord.id || Math.random().toString(),
          latitude: Number(coord.latitude),
          longitude: Number(coord.longitude),
        }));
        console.log("Coordenadas carregadas:", coordenadas);
        setSavedCoordinates(coordenadas);
      }
    } catch (error) {
      console.error("Erro ao carregar coordenadas:", error);
    }
  }, []);

  const obterLocalizacao = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return defaultLocation;
      }

      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    } catch (error) {
      console.error("Erro ao obter localização:", error);
      return defaultLocation;
    }
  }, [defaultLocation]);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        await carregarCoordenadas();
        const location = await obterLocalizacao();
        setCurrentRegion(location);
      } catch (error) {
        console.error("Erro na inicialização:", error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const refresh = async () => {
        await carregarCoordenadas();

        if (params?.newLatitude && params?.newLongitude) {
          const newRegion = {
            latitude: Number(params.newLatitude),
            longitude: Number(params.newLongitude),
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setCurrentRegion(newRegion);
          mapRef.current?.animateToRegion(newRegion, 1000);
        }
      };

      refresh();
    }, [params?.newLatitude, params?.newLongitude])
  );

  const handleMapPress = useCallback((event) => {
    const { coordinate } = event.nativeEvent;
    console.log("Mapa clicado:", coordinate);
    setSelectedLocation(coordinate);
  }, []);

  const handleCadastrarPonto = useCallback(() => {
    if (selectedLocation) {
      router.push({
        pathname: "/cadastro",
        params: {
          latitude: selectedLocation.latitude.toString(),
          longitude: selectedLocation.longitude.toString(),
        },
      });
    } else {
      Alert.alert(
        "Selecione um Local",
        "Por favor, toque no mapa para selecionar um local antes de cadastrar."
      );
    }
  }, [selectedLocation, router]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Carregando mapa...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6200ee" />

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={currentRegion}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton
      >
        {savedCoordinates.map((coord) => (
          <Marker
            key={coord.id}
            coordinate={{
              latitude: coord.latitude,
              longitude: coord.longitude,
            }}
            title={coord.nome}
            description={`Lat: ${coord.latitude.toFixed(
              6
            )}, Lng: ${coord.longitude.toFixed(6)}`}
            pinColor="red"
          />
        ))}

        {selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            pinColor="green"
            title="Local Selecionado"
          >
            <Callout onPress={handleCadastrarPonto}>
              <View style={styles.callout}>
                <Text style={styles.calloutText}>Cadastrar Ponto</Text>
              </View>
            </Callout>
          </Marker>
        )}
      </MapView>

      <View style={styles.buttonsContainer}>
        <CustomButton
          title="Cadastrar Ponto Selecionado"
          onPress={handleCadastrarPonto}
          color="#6200ee"
          iconName="add-location"
          disabled={!selectedLocation}
        />
        <CustomButton
          title="Cadastrar Localização Atual"
          onPress={() => {
            if (currentRegion) {
              router.push({
                pathname: "/cadastro",
                params: {
                  latitude: currentRegion.latitude.toString(),
                  longitude: currentRegion.longitude.toString(),
                },
              });
            }
          }}
          color="#03dac6"
          iconName="my-location"
        />
        <CustomButton
          title="Ver Lista de Coordenadas"
          onPress={() => router.push("/lista")}
          color="#03dac6"
          iconName="list"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
  buttonsContainer: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: "column",
    justifyContent: "space-between",
    height: 200,
  },
  callout: {
    padding: 10,
    minWidth: 120,
  },
  calloutText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6200ee",
    textAlign: "center",
  },
});
