import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "@/components/Button";
import KeyboardScrollView from "@/components/KeyboardScrollView";
import TextField from "@/components/TextField";
import { colors, font, hairline, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { errorKey } from "@/services/errors";

// Sign-in and registration. The first account ever created becomes the owner
// (database trigger); every later account is an active employee.
export default function Form({ mode = "login" }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();
  const isRegister = mode === "register";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const validate = () => {
    if (!email.trim() || !password) return t("loginAlert");
    if (!isRegister) return null;
    if (!fullName.trim()) return t("errRequired");
    if (password.length < 8) return t("errWeakPassword");
    if (password !== confirmPassword) return t("errPasswordMismatch");
    return null;
  };

  const handleSubmit = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setLoading(true);
    setError(null);
    setNotice(null);
    const result = isRegister
      ? await signUp(email.trim(), password, fullName.trim())
      : await signIn(email.trim(), password);
    setLoading(false);
    if (result.error) {
      setError(t(errorKey(result.error)));
    } else if (isRegister && !result.data?.session) {
      // The project asks for e-mail confirmation: no session until it is done.
      setNotice(t("checkEmail"));
    }
    // With a session, the route guard moves the app to the tabs by itself.
  };

  const passwordProps = {
    leftIcon: "lock-outline",
    icon: showPassword ? "eye-off-outline" : "eye-outline",
    onIconPress: () => setShowPassword(!showPassword),
    placeholder: t("pswPlaceholder"),
    secureTextEntry: !showPassword,
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      {/* Fixed inset: the form scrolls below it, never under the status bar. */}
      <View style={{ height: insets.top }} />
      <KeyboardScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: spacing.xl * 2, paddingBottom: insets.bottom + spacing.xl },
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
          {error ? (
            <View style={styles.banner}>
              <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.danger} />
              <Text style={styles.bannerText}>{error}</Text>
            </View>
          ) : null}
          {notice ? (
            <View style={[styles.banner, styles.notice]}>
              <MaterialCommunityIcons name="email-check-outline" size={20} color={colors.primaryDark} />
              <Text style={[styles.bannerText, { color: colors.primaryDark }]}>{notice}</Text>
            </View>
          ) : null}

          {isRegister && (
            <View style={styles.group}>
              <Text style={styles.label}>{t("fullName")}</Text>
              <TextField
                leftIcon="account-outline"
                placeholder={t("fullName")}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          )}

          <View style={styles.group}>
            <Text style={styles.label}>{t("emailLabel")}</Text>
            <TextField
              leftIcon="email-outline"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>{t("psw")}</Text>
            <TextField {...passwordProps} value={password} onChangeText={setPassword} />
          </View>

          {isRegister && (
            <View style={styles.group}>
              <Text style={styles.label}>{t("Cpsw")}</Text>
              <TextField
                {...passwordProps}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          )}

          <Button
            title={t(isRegister ? "register" : "login")}
            onPress={handleSubmit}
            loading={loading}
          />
          {!isRegister && (
            <Text
              style={styles.link}
              onPress={() => Alert.alert(t("forgotPassword"), t("forgotPasswordHelp"))}
            >
              {t("forgotPassword")}
            </Text>
          )}
        </View>

        <Text
          style={styles.switch}
          onPress={() => router.replace(isRegister ? "/login" : "/register")}
        >
          {t(isRegister ? "haveAccount" : "noAccount")}
        </Text>
        <Text style={styles.footer}>{t("footer")}</Text>
      </KeyboardScrollView>
    </View>
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
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.input,
  },
  notice: { backgroundColor: colors.primaryTint },
  bannerText: { flex: 1, color: colors.danger, fontSize: font.body },
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
    textAlign: "center",
    color: colors.primaryDark,
    fontSize: font.body,
    fontWeight: "500",
    padding: spacing.sm,
  },
  footer: {
    marginTop: "auto",
    paddingTop: spacing.xl,
    color: colors.textSecondary,
    fontSize: font.small,
  },
});
