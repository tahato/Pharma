import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import Card from "@/components/Card";
import DetailField from "@/components/DetailField";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import ScreenHeader from "@/components/ScreenHeader";
import StockAdjustSheet from "@/components/StockAdjustSheet";
import { colors, font, hairline, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings";
import { fetchProduct, productImageUrl } from "@/services/products";
import {
  daysUntil,
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
  const { isOwner } = useAuth();
  const { expiryDays } = useSettings();
  const [sheet, setSheet] = useState(null); // "add" | "remove" | null
  const { data: product, isPending, isError, error, refetch } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
  });

  const status = product ? STATUS[stockStatus(product)] : null;
  const image = product ? productImageUrl(product.image_path) : null;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={product?.name ?? ""}
        onBack={() => router.back()}
        right={
          isOwner && product ? (
            <Pressable
              hitSlop={12}
              onPress={() => router.push({ pathname: "/addProducts", params: { id: product.id } })}
            >
              <MaterialCommunityIcons name="pencil-outline" size={22} color={colors.onPrimary} />
            </Pressable>
          ) : null
        }
      />
      {isPending && <LoadingState />}
      {isError && <ErrorState error={error} onRetry={refetch} />}
      {product && (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.photo}>
              {image ? (
                <Image source={{ uri: image }} style={styles.photoImage} contentFit="cover" />
              ) : (
                <MaterialCommunityIcons name="pill" size={44} color={colors.primary} />
              )}
            </View>
            <View style={styles.qtyRow}>
              <Text style={styles.qty}>{t("boxes", { count: product.qty })}</Text>
              <Badge label={t(status.label)} tone={status.tone} />
            </View>
            {product.expired_qty > 0 && (
              <Badge
                label={t("expiredStock", { count: product.expired_qty })}
                tone="danger"
              />
            )}

            <Card>
              <DetailField label={t("class")} info={product.classe || "-"} />
              <DetailField label={t("priceHt")} info={formatDA(product.price_ht)} />
              <DetailField label={t("ppa")} info={formatDA(product.price_ppa)} />
              <DetailField label={t("barcode")} info={product.barcode || "-"} />
              <DetailField label={t("minStock")} info={String(product.min_stock)} />
            </Card>

            <Text style={styles.section}>{t("batches")}</Text>
            {product.batches.length === 0 && (
              <Text style={styles.muted}>{t("noBatches")}</Text>
            )}
            {product.batches.map((b) => (
              <Card key={b.id} style={styles.batch}>
                <Text style={styles.body}>{t("boxes", { count: b.quantity })}</Text>
                <Badge
                  label={t("expiresOn", { date: formatExpiry(b.expiry_date) })}
                  tone={daysUntil(b.expiry_date) <= expiryDays ? "danger" : "success"}
                />
              </Card>
            ))}
          </ScrollView>

          <View style={styles.actions}>
            <Button title={t("add")} style={{ flex: 1 }} onPress={() => setSheet("add")} />
            <Button
              title={t("unstock")}
              variant="secondary"
              style={{ flex: 1 }}
              onPress={() => setSheet("remove")}
            />
          </View>
          <StockAdjustSheet
            visible={sheet !== null}
            mode={sheet ?? "add"}
            product={product}
            onClose={() => setSheet(null)}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  photo: {
    height: 130,
    borderRadius: radius.card,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photoImage: { width: "100%", height: "100%" },
  qtyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  qty: { fontSize: font.title, fontWeight: "500", color: colors.text },
  section: { fontSize: font.title, fontWeight: "500", color: colors.text },
  muted: { fontSize: font.small, color: colors.textSecondary },
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
