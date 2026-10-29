import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import "@/tools/i18next";
import { colors } from "@/constants/theme";
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

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
    <KeyboardProvider>
    <GestureHandlerRootView style={{ flex: 1 }}>
    <ThemeProvider value={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="addProducts" />
        <Stack.Screen name="medicins" />
        <Stack.Screen name="settings" />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
    </GestureHandlerRootView>
    </KeyboardProvider>
    </QueryClientProvider>
  );
}
