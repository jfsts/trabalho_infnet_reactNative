import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

export default function ListaPontos({ isTabletView = false }) {
  const [pontos, setPontos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const carregarPontos = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem("@coordenadas");
      const pontosCarregados = jsonValue ? JSON.parse(jsonValue) : [];
      pontosCarregados.sort((a, b) => {
        return new Date(b.dataCriacao || 0) - new Date(a.dataCriacao || 0);
      });
      setPontos(pontosCarregados);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar os pontos salvos.");
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarPontos();
    }, [])
  );

  const handleDeletarPonto = (id, nome) => {
    Alert.alert(
      "Confirmar Exclusão",
      `Deseja realmente excluir o ponto "${nome}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const pontosAtualizados = pontos.filter(
                (ponto) => ponto.id !== id
              );
              await AsyncStorage.setItem(
                "@coordenadas",
                JSON.stringify(pontosAtualizados)
              );
              setPontos(pontosAtualizados);
              Alert.alert("Sucesso", "Ponto excluído com sucesso!");
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir o ponto.");
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const navegarParaPonto = (latitude, longitude) => {
    if (isTabletView) {
      // Se estiver no modo tablet, apenas atualiza os parâmetros
      router.setParams({
        newLatitude: latitude.toString(),
        newLongitude: longitude.toString(),
        refresh: Date.now().toString(),
      });
    } else {
      // Se estiver no modo mobile, navega para o mapa
      router.replace({
        pathname: "/",
        params: {
          newLatitude: latitude.toString(),
          newLongitude: longitude.toString(),
          refresh: Date.now().toString(),
        },
      });
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => navegarParaPonto(item.latitude, item.longitude)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.nomePonto}>{item.nome}</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeletarPonto(item.id, item.nome)}
          >
            <MaterialIcons name="delete" size={24} color="#dc3545" />
          </TouchableOpacity>
        </View>

        <View style={styles.coordenadasContainer}>
          <View style={styles.coordenadaItem}>
            <MaterialIcons name="location-on" size={16} color="#6200ee" />
            <Text style={styles.coordenadaLabel}>Latitude: </Text>
            <Text style={styles.coordenadaValor}>
              {item.latitude.toFixed(6)}
            </Text>
          </View>

          <View style={styles.coordenadaItem}>
            <MaterialIcons name="location-on" size={16} color="#6200ee" />
            <Text style={styles.coordenadaLabel}>Longitude: </Text>
            <Text style={styles.coordenadaValor}>
              {item.longitude.toFixed(6)}
            </Text>
          </View>
        </View>

        {item.dataCriacao && (
          <Text style={styles.dataCriacao}>
            Criado em: {new Date(item.dataCriacao).toLocaleDateString()}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="location-off" size={48} color="#ccc" />
      <Text style={styles.emptyText}>Nenhum ponto cadastrado</Text>
      {!isTabletView && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="add-location" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Adicionar Ponto</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  const ListHeader = !isTabletView
    ? () => (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pontos Salvos</Text>
          <Text style={styles.pontosCount}>
            {pontos.length} {pontos.length === 1 ? "ponto" : "pontos"}
          </Text>
        </View>
      )
    : null;

  const content = (
    <FlatList
      data={pontos}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={ListEmptyComponent}
      ListHeaderComponent={ListHeader}
      contentContainerStyle={[
        styles.listContent,
        isTabletView && styles.tabletListContent,
      ]}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        carregarPontos();
      }}
    />
  );

  if (isTabletView) {
    return (
      <View style={styles.tabletContainer}>
        <View style={styles.tabletHeader}>
          <Text style={styles.tabletHeaderTitle}>Lista de Pontos</Text>
          <Text style={styles.pontosCount}>
            {pontos.length} {pontos.length === 1 ? "ponto" : "pontos"}
          </Text>
        </View>
        {content}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  tabletContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  tabletHeader: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tabletHeaderTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  tabletListContent: {
    paddingTop: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 16,
    flex: 1,
  },
  pontosCount: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  nomePonto: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  deleteButton: {
    padding: 8,
  },
  coordenadasContainer: {
    marginTop: 8,
  },
  coordenadaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  coordenadaLabel: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  coordenadaValor: {
    fontSize: 14,
    color: "#333",
  },
  dataCriacao: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6200ee",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
