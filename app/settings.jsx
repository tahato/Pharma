import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import Card from "@/components/Card";
import ScreenHeader from "@/components/ScreenHeader";
import { colors, font, hairline, spacing } from "@/constants/theme";
import { user } from "@/data/mock";
import { EXPIRY_ALERT_DAYS } from "@/tools/stock";

function Row({ icon, label, value, onPress, last }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.row, last && { borderBottomWidth: 0 }]}
    >
      <MaterialCommunityIcons name={icon} size={20} color={colors.textSecondary} />
      <Text style={styles.label}>{label}</Text>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {!value && (
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
      )}
    </Pressable>
  );
}

export default function Settings() {
  const { t, i18n } = useTranslation();
  const isOwner = user.role === "owner";
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("");

  const toggleLanguage = () =>
    i18n.changeLanguage(i18n.language === "fr" ? "en" : "fr");

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t("settings")} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <View style={{ gap: 2 }}>
            <Text style={styles.name}>{user.name}</Text>
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
          {isOwner && <Row icon="account-group-outline" label={t("team")} />}
          <Row
            icon="bell-outline"
            label={t("expiryAlert")}
            value={t("daysValue", { count: EXPIRY_ALERT_DAYS })}
          />
          <Row
            icon="alert-outline"
            label={t("lowStockThreshold")}
            value="5"
            last
          />
        </Card>

        <Button
          title={t("logout")}
          variant="danger"
          onPress={() => router.replace("/(auth)/login")}
        />
      </ScrollView>
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
});
