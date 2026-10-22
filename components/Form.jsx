import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Button from "@/components/Button";
import TextField from "@/components/TextField";
import { colors, font, spacing } from "@/constants/theme";

export default function Form({ screen }) {
  const { t } = useTranslation();
  const isRegister = screen === "register";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Real authentication is wired in the Supabase auth phase.
  const handleSubmit = () => {};

  const eye = showPassword ? "eye-off-outline" : "eye-outline";

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.top}>
          <View style={styles.logo}>
            <MaterialCommunityIcons name="pill" size={30} color={colors.onPrimary} />
          </View>
          <Text style={styles.brand}>Pharmacie</Text>
        </View>
        <View style={styles.form}>
          <Text style={styles.welcome}>{t("welcome")}</Text>
          <TextField
            leftIcon="account-outline"
            placeholder={t("username")}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <TextField
            leftIcon="lock-outline"
            icon={eye}
            onIconPress={() => setShowPassword(!showPassword)}
            placeholder={t("psw")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          {isRegister && (
            <TextField
              leftIcon="lock-outline"
              icon={eye}
              onIconPress={() => setShowPassword(!showPassword)}
              placeholder={t("Cpsw")}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
          )}
          <Button
            title={isRegister ? t("register") : t("login")}
            onPress={handleSubmit}
            style={styles.submit}
          />
          <Text
            style={styles.link}
            onPress={() => router.replace(isRegister ? "login" : "register")}
          >
            {isRegister ? t("haveAccount") : t("noAccount")}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  scroll: { flexGrow: 1 },
  top: {
    backgroundColor: colors.primaryTint,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { fontSize: 16, fontWeight: "500", color: colors.primaryDark },
  form: { padding: spacing.xl, gap: spacing.md },
  welcome: { fontSize: font.title, fontWeight: "500", color: colors.text },
  submit: { marginTop: spacing.sm },
  link: {
    textAlign: "center",
    color: colors.primaryDark,
    fontSize: font.small,
    padding: spacing.sm,
  },
});
