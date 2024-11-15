import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Text,
  StatusBar,
  Animated,
} from "react-native";
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ScreenOrientation from "expo-screen-orientation";
import CustomButton from "../components/CustomButton";
import { useDevice } from "../hooks/useDevice";
import ListaPontos from "./lista";

export default function MapaInicial() {
  const { isTablet } = useDevice();
  const [showList, setShowList] = useState(false);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [savedCoordinates, setSavedCoordinates] = useState([]);
  const [isRotating, setIsRotating] = useState(false);
  const router = useRouter();
  const mapRef = useRef(null);
  const params = useLocalSearchParams();
  const listAnimation = useRef(new Animated.Value(0)).current;

  // Função para carregar coordenadas
  const carregarCoordenadas = useCallback(async () => {
    try {
      const jsonValue = await AsyncStorage.getItem("@coordenadas");
      if (jsonValue) {
        const coordenadasSalvas = JSON.parse(jsonValue).map((coord) => ({
          ...coord,
          latitude: Number(coord.latitude),
          longitude: Number(coord.longitude),
        }));
        console.log("Coordenadas carregadas:", coordenadasSalvas);
        setSavedCoordinates(coordenadasSalvas);
      }
    } catch (error) {
      console.error("Erro ao carregar coordenadas:", error);
      Alert.alert("Erro", "Não foi possível carregar os pontos salvos.");
    }
  }, []);

  // Função para obter localização
  const obterLocalizacao = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissão Negada",
          "Permissão para acessar localização foi negada."
        );
        return {
          latitude: -23.55052,
          longitude: -46.633308,
        };
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      return location.coords;
    } catch (error) {
      console.error("Erro ao obter localização:", error);
      return {
        latitude: -23.55052,
        longitude: -46.633308,
      };
    }
  };

  // Handler atualizado para navegação da lista com rotação controlada
  const handleNavigateToList = useCallback(async () => {
    if (isTablet) {
      if (!showList) {
        setIsRotating(true);
        try {
          // Primeiro força a rotação para paisagem
          await ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.LANDSCAPE
          );

          // Pequeno delay para garantir que a rotação completou
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Ativa a lista e inicia a animação
          setShowList(true);
          Animated.timing(listAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        } catch (error) {
          console.error("Erro ao rotacionar a tela:", error);
          setShowList(true);
        } finally {
          setIsRotating(false);
        }
      } else {
        // Anima a saída da lista
        Animated.timing(listAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(async () => {
          setShowList(false);
          await ScreenOrientation.unlockAsync();
        });
      }
    } else {
      router.push("/lista");
    }
  }, [isTablet, showList, router, listAnimation]);

  // Effect para limpar orientação ao desmontar
  useEffect(() => {
    return () => {
      if (isTablet) {
        ScreenOrientation.unlockAsync();
      }
    };
  }, [isTablet]);

  // Carregamento inicial
  useEffect(() => {
    const inicializar = async () => {
      setLoading(true);
      try {
        const loc = await obterLocalizacao();
        setLocation(loc);
        await carregarCoordenadas();

        if (params?.newLatitude && params?.newLongitude) {
          const newRegion = {
            latitude: Number(params.newLatitude),
            longitude: Number(params.newLongitude),
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          };
          setTimeout(() => {
            mapRef.current?.animateToRegion(newRegion, 1000);
          }, 500);
        }
      } catch (error) {
        console.error("Erro na inicialização:", error);
      } finally {
        setLoading(false);
      }
    };

    inicializar();
  }, []);

  // Atualizar ao receber foco
  useFocusEffect(
    useCallback(() => {
      const atualizar = async () => {
        await carregarCoordenadas();

        if (params?.newLatitude && params?.newLongitude) {
          const newRegion = {
            latitude: Number(params.newLatitude),
            longitude: Number(params.newLongitude),
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          };
          mapRef.current?.animateToRegion(newRegion, 1000);
        }
      };

      atualizar();
    }, [params?.refresh])
  );

  // Handler para clique no mapa
  const handleMapPress = useCallback((event) => {
    const { coordinate } = event.nativeEvent;
    console.log("Mapa clicado:", coordinate);
    setSelectedLocation(coordinate);
  }, []);

  // Handler para cadastrar ponto
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

  if (loading || !location) {
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

      <View
        style={[
          styles.contentContainer,
          isTablet && showList && styles.tabletContainer,
        ]}
      >
        <View
          style={[
            styles.mapContainer,
            isTablet && showList && styles.tabletMapContainer,
          ]}
        >
          <MapView
            provider={PROVIDER_GOOGLE}
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            showsUserLocation
            showsMyLocationButton
            onPress={handleMapPress}
            moveOnMarkerPress={false}
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

          <View
            style={[
              styles.buttonsContainer,
              isTablet && showList && styles.tabletButtonsContainer,
            ]}
          >
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
                if (location) {
                  router.push({
                    pathname: "/cadastro",
                    params: {
                      latitude: location.latitude.toString(),
                      longitude: location.longitude.toString(),
                    },
                  });
                }
              }}
              color="#03dac6"
              iconName="my-location"
            />
            <CustomButton
              title={
                isTablet
                  ? showList
                    ? "Ocultar Lista"
                    : "Mostrar Lista"
                  : "Ver Lista"
              }
              onPress={handleNavigateToList}
              color="#03dac6"
              iconName={showList ? "close" : "list"}
            />
          </View>
        </View>

        {isTablet && showList && (
          <Animated.View
            style={[
              styles.tabletListContainer,
              {
                opacity: listAnimation,
                transform: [
                  {
                    translateX: listAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <ListaPontos isTabletView={true} />
          </Animated.View>
        )}
      </View>

      {isRotating && (
        <View style={styles.rotatingOverlay}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.rotatingText}>Girando tela...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  contentContainer: {
    flex: 1,
    flexDirection: "row",
  },
  mapContainer: {
    flex: 1,
  },
  tabletContainer: {
    flexDirection: "row",
  },
  tabletMapContainer: {
    flex: 0.6, // 60% da tela em modo paisagem
  },
  tabletListContainer: {
    flex: 0.4, // 40% da tela em modo paisagem
    borderLeftWidth: 1,
    borderLeftColor: "#ccc",
    backgroundColor: "#fff",
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
  tabletButtonsContainer: {
    right: 30, // Mais espaço na direita para tablet em modo paisagem
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
  rotatingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  rotatingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
  },
});
