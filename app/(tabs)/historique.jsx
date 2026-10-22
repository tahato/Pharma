import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, StyleSheet, Text, View } from "react-native";
import Card from "@/components/Card";
import Chip from "@/components/Chip";
import ScreenHeader from "@/components/ScreenHeader";
import { colors, font, spacing } from "@/constants/theme";
import { sales } from "@/data/mock";
import { formatDA } from "@/tools/stock";

const PERIODS = [
  { key: "today", label: "periodToday", days: 0 },
  { key: "week", label: "period7", days: 7 },
  { key: "month", label: "periodMonth", days: 30 },
];

export default function Historique() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState("today");

  const { days } = PERIODS.find((p) => p.key === period);
  const data = sales.filter((s) => s.daysAgo <= days);
  const total = data.reduce((sum, s) => sum + s.total, 0);

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t("history")} />
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.chips}>
              {PERIODS.map((p) => (
                <Chip
                  key={p.key}
                  label={t(p.label)}
                  selected={period === p.key}
                  onPress={() => setPeriod(p.key)}
                />
              ))}
            </View>
            <Text style={styles.summary}>
              {t("salesCount", { count: data.length })} · {formatDA(total)}
            </Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>{t("noSales")}</Text>}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <View style={styles.icon}>
              <MaterialCommunityIcons
                name="receipt-text-outline"
                size={18}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{t("saleNumber", { number: item.id.padStart(4, "0") })}</Text>
              <Text style={styles.muted}>
                {item.time} · {t("items", { count: item.itemCount })}
              </Text>
            </View>
            <Text style={styles.name}>{formatDA(item.total)}</Text>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg },
  header: { gap: spacing.md, marginBottom: spacing.md },
  chips: { flexDirection: "row", gap: spacing.sm },
  summary: { fontSize: font.small, color: colors.textSecondary },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 56,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: font.body, fontWeight: "500", color: colors.text },
  muted: { fontSize: font.small, color: colors.textSecondary },
  empty: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: font.body,
    marginTop: spacing.xl,
  },
});
