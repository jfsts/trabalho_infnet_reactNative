import React, { useState } from "react";
import { Platform, StatusBar, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useLocalSearchParams, router as Router } from "expo-router";
import {
  Container,
  ScrollContainer,
  Header,
  Title,
  Form,
  Label,
  Input,
  ErrorContainer,
  ErrorIcon,
  ErrorText,
  ButtonContainer,
  Button,
  ButtonText,
  ButtonIcon,
  LoadingIndicator,
} from "./styles";

export default function Cadastro() {
  const router = useRouter();
  const { latitude, longitude } = useLocalSearchParams();
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navegarParaInicio = (params = {}) => {
    Router.replace({
      pathname: "/",
      params: {
        refresh: Date.now().toString(),
        ...params,
      },
    });
  };

  const validarCoordenadas = () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return false;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return false;
    }

    return true;
  };

  const salvarLocal = async () => {
    try {
      setError("");

      if (!nome.trim()) {
        setError("Por favor, insira um nome para o local.");
        return;
      }

      if (!validarCoordenadas()) {
        setError("Coordenadas inválidas.");
        return;
      }

      setLoading(true);

      const novoLocal = {
        id: Date.now().toString(),
        nome: nome.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        dataCriacao: new Date().toISOString(),
      };

      const jsonValue = await AsyncStorage.getItem("@coordenadas");
      const coordenadasSalvas = jsonValue ? JSON.parse(jsonValue) : [];
      coordenadasSalvas.push(novoLocal);

      await AsyncStorage.setItem(
        "@coordenadas",
        JSON.stringify(coordenadasSalvas)
      );

      Alert.alert(
        "Sucesso",
        "Local salvo com sucesso!",
        [
          {
            text: "OK",
            onPress: () => {
              navegarParaInicio({
                newLatitude: latitude,
                newLongitude: longitude,
              });
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      setError("Não foi possível salvar o local. Tente novamente.");
      console.error("Erro ao salvar:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = () => {
    Alert.alert(
      "Cancelar Cadastro",
      "Deseja realmente cancelar o cadastro?",
      [
        {
          text: "Não",
          style: "cancel",
        },
        {
          text: "Sim",
          onPress: () => {
            navegarParaInicio();
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <Container behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />
      <ScrollContainer>
        <Header>
          <Title>Cadastrar Local</Title>
        </Header>

        {error ? (
          <ErrorContainer>
            <ErrorIcon name="error" size={20} />
            <ErrorText>{error}</ErrorText>
          </ErrorContainer>
        ) : null}

        <Form>
          <Label>Nome do Local:</Label>
          <Input
            placeholder="Insira o nome do local"
            value={nome}
            onChangeText={(text) => {
              setError("");
              setNome(text);
            }}
            autoFocus
            autoCapitalize="words"
            maxLength={50}
          />

          <Label>Latitude:</Label>
          <Input value={latitude} editable={false} />

          <Label>Longitude:</Label>
          <Input value={longitude} editable={false} />

          <ButtonContainer>
            <Button
              variant="cancel"
              onPress={handleCancelar}
              disabled={loading}
            >
              <ButtonText variant="cancel">Cancelar</ButtonText>
            </Button>

            <Button onPress={salvarLocal} disabled={loading}>
              {loading ? (
                <LoadingIndicator />
              ) : (
                <>
                  <ButtonIcon name="save" size={20} />
                  <ButtonText>Salvar</ButtonText>
                </>
              )}
            </Button>
          </ButtonContainer>
        </Form>
      </ScrollContainer>
    </Container>
  );
}
