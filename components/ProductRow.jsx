import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import Badge from "@/components/Badge";
import Card from "@/components/Card";
import { colors, font, spacing } from "@/constants/theme";
import { formatDA, stockStatus } from "@/tools/stock";

const STATUS = {
  ok: { tone: "success", label: "inStock" },
  low: { tone: "warning", label: "lowStock" },
  out: { tone: "danger", label: "outOfStock" },
};

export default function ProductRow({ product, onPress }) {
  const { t } = useTranslation();
  const status = STATUS[stockStatus(product)];

  return (
    <Card onPress={onPress} style={styles.row}>
      <View style={styles.thumb}>
        <MaterialCommunityIcons name="pill" size={20} color={colors.primary} />
      </View>
      <View style={styles.main}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{formatDA(product.ppa)}</Text>
      </View>
      <View style={styles.side}>
        <Text style={styles.qty}>{product.qty}</Text>
        <Badge label={t(status.label)} tone={status.tone} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 56,
  },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  main: { flex: 1 },
  name: { fontSize: font.body, fontWeight: "500", color: colors.text },
  price: { fontSize: font.small, color: colors.textSecondary },
  side: { alignItems: "flex-end", gap: 2 },
  qty: { fontSize: font.body, fontWeight: "500", color: colors.text },
});
