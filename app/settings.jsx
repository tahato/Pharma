import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Badge from "@/components/Badge";
import BottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import Card from "@/components/Card";
import ScreenHeader from "@/components/ScreenHeader";
import TextField from "@/components/TextField";
import { colors, font, hairline, spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings";
import { errorText } from "@/services/errors";
import { invalidateStock } from "@/services/invalidate";
import { updateExpiryDays } from "@/services/settings";

function Row({ icon, label, value, onPress, chevron, last }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.row, last && { borderBottomWidth: 0 }]}
    >
      <MaterialCommunityIcons name={icon} size={20} color={colors.textSecondary} />
      <Text style={styles.label}>{label}</Text>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {chevron && (
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
      )}
    </Pressable>
  );
}

function ExpiryDaysSheet({ visible, current, onClose }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [days, setDays] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setDays(String(current));
      setError(null);
    }
  }, [visible, current]);

  const save = useMutation({
    mutationFn: updateExpiryDays,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      invalidateStock(queryClient);
      onClose();
    },
    onError: (e) => setError(errorText(t, e)),
  });

  const submit = () => {
    const n = Number(days);
    if (!Number.isInteger(n) || n < 1 || n > 365) return setError(t("errDaysRange"));
    setError(null);
    save.mutate(n);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.sheetTitle}>{t("expiryAlert")}</Text>
      <TextField
        label={t("expiryDays")}
        value={days}
        onChangeText={setDays}
        keyboardType="numeric"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title={t("save")} onPress={submit} loading={save.isPending} />
      <Button title={t("cancel")} variant="secondary" onPress={onClose} />
    </BottomSheet>
  );
}

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { profile, isOwner, session, signOut } = useAuth();
  const { expiryDays } = useSettings();
  const insets = useSafeAreaInsets();
  const [signingOut, setSigningOut] = useState(false);
  const [editingDays, setEditingDays] = useState(false);

  const name = profile?.full_name || session?.user.email || "";
  const initials = name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const toggleLanguage = () =>
    i18n.changeLanguage(i18n.language === "fr" ? "en" : "fr");

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut(); // the route guard then returns to the sign-in screen
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t("settings")} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: spacing.lg + insets.bottom }]}>
        <Card style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <View style={{ gap: 2 }}>
            <Text style={styles.name}>{name}</Text>
            <Badge label={t(isOwner ? "owner" : "staff")} />
          </View>
        </Card>

        <Card style={{ paddingVertical: 0 }}>
          <Row
            icon="translate"
            label={t("language")}
            value={t("languageName")}
            onPress={toggleLanguage}
          />
          {isOwner && (
            <Row
              icon="account-group-outline"
              label={t("team")}
              chevron
              onPress={() => router.push("/team")}
            />
          )}
          <Row
            icon="bell-outline"
            label={t("expiryAlert")}
            value={t("daysValue", { count: expiryDays })}
            chevron={isOwner}
            onPress={isOwner ? () => setEditingDays(true) : undefined}
          />
          <Row icon="alert-outline" label={t("lowStockThreshold")} value={t("perProduct")} last />
        </Card>

        <Button
          title={t("logout")}
          variant="danger"
          loading={signingOut}
          onPress={handleSignOut}
        />
      </ScrollView>
      <ExpiryDaysSheet
        visible={editingDays}
        current={expiryDays}
        onClose={() => setEditingDays(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { color: colors.onPrimary, fontWeight: "500", fontSize: font.title },
  name: { fontSize: font.title, fontWeight: "500", color: colors.text },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 48,
    borderBottomColor: colors.border,
    borderBottomWidth: hairline,
  },
  label: { flex: 1, fontSize: font.body, color: colors.text },
  value: { fontSize: font.body, color: colors.textSecondary },
  sheetTitle: { fontSize: font.title, fontWeight: "500", color: colors.text },
  error: { color: colors.danger, fontSize: font.small },
});
