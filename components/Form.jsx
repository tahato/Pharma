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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "@/components/Button";
import TextField from "@/components/TextField";
import { colors, font, hairline, radius, spacing } from "@/constants/theme";

export default function Form({ screen }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.xl * 2, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <MaterialCommunityIcons name="pill" size={30} color={colors.onPrimary} />
          </View>
          <Text style={styles.brand}>Pharmacie</Text>
        </View>

        <Text style={styles.title}>{t("appTitle")}</Text>
        <Text style={styles.subtitle}>
          {t(isRegister ? "registerSubtitle" : "loginSubtitle")}
        </Text>

        <View style={styles.card}>
          <View style={styles.group}>
            <Text style={styles.label}>{t("emailLabel")}</Text>
            <TextField
              leftIcon="email-outline"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>{t("psw")}</Text>
            <TextField
              leftIcon="lock-outline"
              icon={eye}
              onIconPress={() => setShowPassword(!showPassword)}
              placeholder={t("pswPlaceholder")}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
          </View>

          {isRegister && (
            <View style={styles.group}>
              <Text style={styles.label}>{t("Cpsw")}</Text>
              <TextField
                leftIcon="lock-outline"
                icon={eye}
                onIconPress={() => setShowPassword(!showPassword)}
                placeholder={t("pswPlaceholder")}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>
          )}

          <Button
            title={isRegister ? t("register") : t("login")}
            onPress={handleSubmit}
          />
          {!isRegister && <Text style={styles.link}>{t("forgotPassword")}</Text>}
        </View>

        <Text
          style={styles.switch}
          onPress={() => router.replace(isRegister ? "login" : "register")}
        >
          {isRegister ? t("haveAccount") : t("noAccount")}
        </Text>
        <Text style={styles.footer}>{t("footer")}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl, alignItems: "center" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { fontSize: 28, fontWeight: "500", color: colors.text },
  title: {
    marginTop: spacing.xl * 1.5,
    fontSize: 24,
    fontWeight: "500",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: font.title,
    color: colors.textSecondary,
    textAlign: "center",
  },
  card: {
    alignSelf: "stretch",
    marginTop: spacing.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: hairline,
    borderRadius: radius.sheet,
  },
  group: { gap: spacing.sm },
  label: { fontSize: font.body, fontWeight: "500", color: colors.text },
  link: {
    textAlign: "center",
    color: colors.primaryDark,
    fontSize: font.body,
    fontWeight: "500",
  },
  switch: {
    marginTop: spacing.lg,
    color: colors.primaryDark,
    fontSize: font.small,
    padding: spacing.sm,
  },
  footer: {
    marginTop: "auto",
    paddingTop: spacing.xl,
    color: colors.textSecondary,
    fontSize: font.small,
  },
});
