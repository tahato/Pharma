import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, StyleSheet, Text, View } from "react-native";
import Card from "@/components/Card";
import Chip from "@/components/Chip";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import ScreenHeader from "@/components/ScreenHeader";
import { colors, font, spacing } from "@/constants/theme";
import { fetchSales, SALES_LIST_LIMIT } from "@/services/sales";
import { formatDA } from "@/tools/stock";

const PERIODS = [
  { key: "today", label: "periodToday", days: 0 },
  { key: "week", label: "period7", days: 6 },
  { key: "month", label: "periodMonth", days: 29 },
];

export default function Historique() {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState("today");
  const { days } = PERIODS.find((p) => p.key === period);

  const { data, isPending, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["sales", period],
    queryFn: () => fetchSales(days),
  });
  const sales = data?.sales ?? [];

  const when = (iso) => {
    const d = new Date(iso);
    const time = d.toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" });
    if (days === 0) return time;
    return `${d.toLocaleDateString(i18n.language, { day: "numeric", month: "short" })} ${time}`;
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t("history")} />
      <FlatList
        data={sales}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        refreshing={isRefetching}
        onRefresh={refetch}
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
            {data && (
              <Text style={styles.summary}>
                {t("salesCount", { count: data.summary.count })} · {formatDA(data.summary.total)}
              </Text>
            )}
            {data && data.summary.count > SALES_LIST_LIMIT && (
              <Text style={styles.summary}>{t("latestOnly", { count: SALES_LIST_LIMIT })}</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          isPending ? (
            <LoadingState />
          ) : isError ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : (
            <EmptyState icon="receipt-text-outline" title={t("noSales")} />
          )
        }
        renderItem={({ item }) => (
          <Card
            style={styles.row}
            onPress={() => router.push({ pathname: "/saleDetail", params: { id: item.id } })}
          >
            <View style={styles.icon}>
              <MaterialCommunityIcons
                name="receipt-text-outline"
                size={18}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {t("saleNumber", { number: String(item.number).padStart(4, "0") })}
              </Text>
              <Text style={styles.muted}>
                {when(item.created_at)} · {t("items", { count: item.itemCount })}
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
});
