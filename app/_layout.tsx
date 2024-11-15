// app/_layout.jsx
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function Layout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#6200ee" },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 18,
          },
          headerShadowVisible: true,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Mapa de Pontos",
            headerLeft: () => null,
          }}
        />
        <Stack.Screen
          name="cadastro/index"
          options={{
            title: "Cadastrar Coordenada",
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="lista/index"
          options={{
            title: "Lista de Coordenadas",
            presentation: "card",
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
