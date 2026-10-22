import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Chip from "@/components/Chip";
import ProductRow from "@/components/ProductRow";
import ScreenHeader from "@/components/ScreenHeader";
import SearchBar from "@/components/SearchBar";
import { colors, font, spacing } from "@/constants/theme";
import { products } from "@/data/mock";
import { isExpiringSoon, stockStatus } from "@/tools/stock";

const FILTERS = [
  { key: "all", label: "filterAll" },
  { key: "low", label: "filterLow" },
  { key: "expiring", label: "filterExpiring" },
];

export default function Stock() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (params.filter) setFilter(params.filter);
  }, [params.filter]);

  const q = query.trim().toLowerCase();
  const data = products.filter((p) => {
    if (filter === "low" && stockStatus(p) === "ok") return false;
    if (filter === "expiring" && !isExpiringSoon(p)) return false;
    return !q || p.name.toLowerCase().includes(q) || p.barcode.includes(q);
  });

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t("stock")} />
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductRow
            product={item}
            onPress={() =>
              router.push({ pathname: "/medicins", params: { id: item.id } })
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder={t("searchProduct")}
            />
            <View style={styles.chips}>
              {FILTERS.map((f) => (
                <Chip
                  key={f.key}
                  label={t(f.label)}
                  selected={filter === f.key}
                  onPress={() => setFilter(f.key)}
                />
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>{t("noResults")}</Text>}
      />
      <Pressable style={styles.fab} onPress={() => router.push("/addProducts")}>
        <MaterialCommunityIcons name="plus" size={28} color={colors.onPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: 96 },
  header: { gap: spacing.md, marginBottom: spacing.md },
  chips: { flexDirection: "row", gap: spacing.sm },
  empty: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: font.body,
    marginTop: spacing.xl,
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
});
