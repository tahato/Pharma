import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Card from "@/components/Card";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import ScreenHeader from "@/components/ScreenHeader";
import { colors, font, hairline, spacing } from "@/constants/theme";
import { fetchSale } from "@/services/sales";
import { formatDA } from "@/tools/stock";

export default function SaleDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams();
  const { data: sale, isPending, isError, error, refetch } = useQuery({
    queryKey: ["sale", id],
    queryFn: () => fetchSale(id),
  });

  // A sale can span several batches of the same product: show one line per product.
  const lines = [];
  for (const item of sale?.sale_items ?? []) {
    const name = item.products?.name ?? "";
    const existing = lines.find((l) => l.name === name && l.unitPrice === item.unit_price);
    if (existing) existing.quantity += item.quantity;
    else lines.push({ name, quantity: item.quantity, unitPrice: item.unit_price });
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={sale ? t("saleNumber", { number: String(sale.number).padStart(4, "0") }) : t("saleDetail")}
        subtitle={
          sale
            ? new Date(sale.created_at).toLocaleString(i18n.language, {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : undefined
        }
        onBack={() => router.back()}
      />
      {isPending && <LoadingState />}
      {isError && <ErrorState error={error} onRetry={refetch} />}
      {sale && (
        <ScrollView contentContainerStyle={styles.content}>
          <Card>
            {lines.map((l, i) => (
              <View key={`${l.name}-${i}`} style={styles.line}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{l.name}</Text>
                  <Text style={styles.muted}>
                    {l.quantity} x {formatDA(l.unitPrice)}
                  </Text>
                </View>
                <Text style={styles.name}>{formatDA(l.quantity * Number(l.unitPrice))}</Text>
              </View>
            ))}
            <View style={[styles.line, { borderBottomWidth: 0 }]}>
              <Text style={styles.total}>{t("total")}</Text>
              <Text style={styles.total}>{formatDA(sale.total)}</Text>
            </View>
          </Card>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  line: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomColor: colors.border,
    borderBottomWidth: hairline,
  },
  name: { fontSize: font.body, fontWeight: "500", color: colors.text },
  muted: { fontSize: font.small, color: colors.textSecondary },
  total: { flex: 1, fontSize: font.title, fontWeight: "500", color: colors.text },
});
