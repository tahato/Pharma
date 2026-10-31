import { MaterialCommunityIcons } from "@expo/vector-icons";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import BarcodeScanner from "@/components/BarcodeScanner";
import Chip from "@/components/Chip";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import ProductRow from "@/components/ProductRow";
import ScreenHeader from "@/components/ScreenHeader";
import SearchBar from "@/components/SearchBar";
import { colors, spacing } from "@/constants/theme";
import useDebounce from "@/lib/useDebounce";
import { fetchProductPage, PAGE_SIZE } from "@/services/products";

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
  const [scanning, setScanning] = useState(false);
  const debounced = useDebounce(query);

  useEffect(() => {
    if (params.filter) setFilter(params.filter);
  }, [params.filter]);

  const list = useInfiniteQuery({
    queryKey: ["products", { query: debounced, filter }],
    queryFn: ({ pageParam }) =>
      fetchProductPage({ query: debounced, filter, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.length === PAGE_SIZE ? all.length : undefined),
    placeholderData: keepPreviousData,
  });
  const products = list.data?.pages.flat() ?? [];

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t("stock")} />
      <FlatList
        data={products}
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
        refreshing={list.isRefetching && !list.isFetchingNextPage}
        onRefresh={list.refetch}
        onEndReached={() => {
          if (list.hasNextPage && !list.isFetchingNextPage) list.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View style={styles.header}>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder={t("searchProduct")}
              onScan={() => setScanning(true)}
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
        ListEmptyComponent={
          list.isPending ? (
            <LoadingState />
          ) : list.isError ? (
            <ErrorState error={list.error} onRetry={list.refetch} />
          ) : (
            <EmptyState title={t("noResults")} />
          )
        }
        ListFooterComponent={
          list.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : null
        }
      />
      <BarcodeScanner
        visible={scanning}
        onClose={() => setScanning(false)}
        onScanned={(code) => {
          setQuery(code);
          setScanning(false);
        }}
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
