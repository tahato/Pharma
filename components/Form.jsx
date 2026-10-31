import { MaterialCommunityIcons } from "@expo/vector-icons";
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

// Sign-in form. Accounts are created by the owner (public sign-ups are off).
export default function Form() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError(t("loginAlert"));
      return;
    }
    setLoading(true);
    setError(null);
    const { error: signInError } = await signIn(email.trim(), password);
    setLoading(false);
    // On success the route guard moves the app to the tabs by itself.
    if (signInError) setError(t(errorKey(signInError)));
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
        <Text style={styles.subtitle}>{t("loginSubtitle")}</Text>

        <View style={styles.card}>
          {error ? (
            <View style={styles.banner}>
              <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.danger} />
              <Text style={styles.bannerText}>{error}</Text>
            </View>
          ) : null}

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
            <TextField
              leftIcon="lock-outline"
              icon={showPassword ? "eye-off-outline" : "eye-outline"}
              onIconPress={() => setShowPassword(!showPassword)}
              placeholder={t("pswPlaceholder")}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
          </View>

          <Button title={t("login")} onPress={handleSubmit} loading={loading} />
          <Text
            style={styles.link}
            onPress={() => Alert.alert(t("forgotPassword"), t("forgotPasswordHelp"))}
          >
            {t("forgotPassword")}
          </Text>
        </View>

        <Text style={styles.help}>{t("noAccountHelp")}</Text>
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
  bannerText: { flex: 1, color: colors.danger, fontSize: font.body },
  group: { gap: spacing.sm },
  label: { fontSize: font.body, fontWeight: "500", color: colors.text },
  link: {
    textAlign: "center",
    color: colors.primaryDark,
    fontSize: font.body,
    fontWeight: "500",
  },
  help: {
    marginTop: spacing.lg,
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: font.small,
  },
  footer: {
    marginTop: "auto",
    paddingTop: spacing.xl,
    color: colors.textSecondary,
    fontSize: font.small,
  },
});
