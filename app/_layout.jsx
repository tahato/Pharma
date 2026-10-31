import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";

import "@/tools/i18next";
import { colors } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";

export const unstable_settings = {
  anchor: "(tabs)",
};

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

// Route guard: signed-out users only see (auth); signed-in users only see the app.
function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="addProducts" />
        <Stack.Screen name="medicins" />
        <Stack.Screen name="saleDetail" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="team" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <KeyboardProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider value={theme}>
              <RootNavigator />
              <StatusBar style="light" />
            </ThemeProvider>
          </GestureHandlerRootView>
        </KeyboardProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
