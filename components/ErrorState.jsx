import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import Button from "@/components/Button";
import { colors, font, spacing } from "@/constants/theme";
import { errorText } from "@/services/errors";

export default function ErrorState({ error, onRetry }) {
  const { t } = useTranslation();
  return (
    <View style={styles.box}>
      <MaterialCommunityIcons name="wifi-off" size={40} color={colors.textSecondary} />
      <Text style={styles.title}>{t("loadError")}</Text>
      <Text style={styles.body}>{errorText(t, error)}</Text>
      {onRetry && <Button title={t("retry")} variant="secondary" onPress={onRetry} />}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", gap: spacing.sm, marginTop: spacing.xl, padding: spacing.lg },
  title: { fontSize: font.title, fontWeight: "500", color: colors.text },
  body: { fontSize: font.small, color: colors.textSecondary, textAlign: "center" },
});
