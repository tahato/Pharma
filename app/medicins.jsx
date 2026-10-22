import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import Card from "@/components/Card";
import DetailField from "@/components/DetailField";
import ScreenHeader from "@/components/ScreenHeader";
import { colors, font, hairline, radius, spacing } from "@/constants/theme";
import { findProduct } from "@/data/mock";
import {
  daysUntil,
  EXPIRY_ALERT_DAYS,
  formatDA,
  formatExpiry,
  stockStatus,
} from "@/tools/stock";

const STATUS = {
  ok: { tone: "success", label: "inStock" },
  low: { tone: "warning", label: "lowStock" },
  out: { tone: "danger", label: "outOfStock" },
};

export default function Medicins() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const product = findProduct(id);
  const status = STATUS[stockStatus(product)];

  return (
    <View style={styles.screen}>
      <ScreenHeader title={product.name} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.photo}>
          <MaterialCommunityIcons name="pill" size={44} color={colors.primary} />
        </View>
        <View style={styles.qtyRow}>
          <Text style={styles.qty}>{t("boxes", { count: product.qty })}</Text>
          <Badge label={t(status.label)} tone={status.tone} />
        </View>

        <Card>
          <DetailField label={t("class")} info={product.classe} />
          <DetailField label={t("priceHt")} info={formatDA(product.priceHt)} />
          <DetailField label={t("ppa")} info={formatDA(product.ppa)} />
          <DetailField label={t("barcode")} info={product.barcode} />
        </Card>

        <Text style={styles.section}>{t("batches")}</Text>
        {product.batches.map((b) => (
          <Card key={b.expiry} style={styles.batch}>
            <Text style={styles.body}>{t("boxes", { count: b.qty })}</Text>
            <Badge
              label={t("expiresOn", { date: formatExpiry(b.expiry) })}
              tone={daysUntil(b.expiry) <= EXPIRY_ALERT_DAYS ? "danger" : "success"}
            />
          </Card>
        ))}
      </ScrollView>

      <View style={styles.actions}>
        <Button title={t("add")} style={{ flex: 1 }} />
        <Button title={t("unstock")} variant="secondary" style={{ flex: 1 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  photo: {
    height: 110,
    borderRadius: radius.card,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  qty: { fontSize: font.title, fontWeight: "500", color: colors.text },
  section: { fontSize: font.title, fontWeight: "500", color: colors.text },
  batch: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 44,
  },
  body: { fontSize: font.body, color: colors.text },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: hairline,
  },
});
