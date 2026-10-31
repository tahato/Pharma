import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Badge from "@/components/Badge";
import Card from "@/components/Card";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import ScreenHeader from "@/components/ScreenHeader";
import { colors, font, spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { fetchDashboard } from "@/services/dashboard";
import { formatDA, formatExpiry, isExpiringSoon } from "@/tools/stock";

const OVERLAP = 28;

export default function Home() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const { data, isPending, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  const date = new Date().toLocaleDateString(i18n.language, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const openStock = (filter) =>
    router.navigate({ pathname: "/stock", params: { filter } });

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={t("greeting", { name: profile?.full_name ?? "" })}
        subtitle={date.charAt(0).toUpperCase() + date.slice(1)}
        overlap={OVERLAP}
        right={
          <Pressable onPress={() => router.push("/settings")} hitSlop={10}>
            <MaterialCommunityIcons
              name="account-circle"
              size={28}
              color={colors.onPrimary}
            />
          </Pressable>
        }
      />
      <ScrollView
        style={{ marginTop: -OVERLAP }}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {isPending && <LoadingState />}
        {isError && <ErrorState error={error} onRetry={refetch} />}
        {data && (
          <>
            <Card style={styles.summary}>
              <Text style={styles.muted}>{t("todaySales")}</Text>
              <Text style={styles.total}>{formatDA(data.todayTotal)}</Text>
              <Text style={styles.muted}>
                {t("salesCount", { count: data.todayCount })}
              </Text>
            </Card>

            <View style={styles.counters}>
              <Card style={styles.counter} onPress={() => openStock("low")}>
                <Badge label={String(data.lowCount)} tone="warning" />
                <Text style={styles.muted}>{t("lowStockLabel")}</Text>
              </Card>
              <Card style={styles.counter} onPress={() => openStock("expiring")}>
                <Badge label={String(data.expiringCount)} tone="danger" />
                <Text style={styles.muted}>{t("expiringSoon")}</Text>
              </Card>
            </View>

            <Text style={styles.section}>{t("watchList")}</Text>
            {data.watch.length === 0 && (
              <Text style={styles.muted}>{t("nothingToWatch")}</Text>
            )}
            {data.watch.map((p) => (
              <Card
                key={p.id}
                style={styles.watchRow}
                onPress={() => router.push({ pathname: "/medicins", params: { id: p.id } })}
              >
                <Text style={styles.name}>{p.name}</Text>
                {isExpiringSoon(p) ? (
                  <Badge
                    label={t("expiresOn", { date: formatExpiry(p.earliest_expiry) })}
                    tone="danger"
                  />
                ) : (
                  <Badge label={t("remaining", { count: p.qty })} tone="warning" />
                )}
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  summary: { padding: spacing.lg, gap: 2 },
  total: { fontSize: font.display, fontWeight: "500", color: colors.text },
  muted: { fontSize: font.small, color: colors.textSecondary },
  counters: { flexDirection: "row", gap: spacing.md },
  counter: { flex: 1, gap: spacing.xs, paddingVertical: spacing.md },
  section: { fontSize: font.title, fontWeight: "500", color: colors.text },
  watchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
  },
  name: { fontSize: font.body, color: colors.text },
});
