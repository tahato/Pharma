import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Badge from "@/components/Badge";
import Card from "@/components/Card";
import CreateStaffSheet from "@/components/CreateStaffSheet";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import MemberSheet from "@/components/MemberSheet";
import ScreenHeader from "@/components/ScreenHeader";
import { colors, font, spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { fetchTeam } from "@/services/team";

const initials = (name) =>
  name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

export default function Team() {
  const { t } = useTranslation();
  const { isOwner, session } = useAuth();
  const insets = useSafeAreaInsets();
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);
  const { data, isPending, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["team"],
    queryFn: fetchTeam,
    enabled: isOwner,
  });

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t("team")} onBack={() => router.back()} />
      {!isOwner ? (
        <EmptyState icon="lock-outline" title={t("ownersOnly")} />
      ) : (
        <>
          <FlatList
            data={data ?? []}
            keyExtractor={(m) => m.id}
            contentContainerStyle={[styles.list, { paddingBottom: 96 + insets.bottom }]}
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            refreshing={isRefetching}
            onRefresh={refetch}
            ListEmptyComponent={
              isPending ? (
                <LoadingState />
              ) : isError ? (
                <ErrorState error={error} onRetry={refetch} />
              ) : null
            }
            renderItem={({ item }) => (
              <Card style={styles.row} onPress={() => setSelected(item)}>
                <View style={styles.avatar}>
                  <Text style={styles.initials}>
                    {initials(item.full_name || item.email || "?")}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.full_name || item.email}</Text>
                  <Text style={styles.muted}>{item.email}</Text>
                </View>
                <View style={styles.badges}>
                  <Badge label={t(item.role === "owner" ? "owner" : "staff")} />
                  {!item.active && <Badge label={t("inactive")} tone="danger" />}
                </View>
              </Card>
            )}
          />
          <Pressable style={[styles.fab, { bottom: spacing.lg + insets.bottom }]} onPress={() => setCreating(true)}>
            <MaterialCommunityIcons name="plus" size={28} color={colors.onPrimary} />
          </Pressable>
          <CreateStaffSheet visible={creating} onClose={() => setCreating(false)} />
          <MemberSheet
            member={selected}
            isSelf={selected?.id === session?.user.id}
            onClose={() => setSelected(null)}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: 96 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 60 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { color: colors.primaryDark, fontWeight: "500", fontSize: font.small },
  name: { fontSize: font.body, fontWeight: "500", color: colors.text },
  muted: { fontSize: font.small, color: colors.textSecondary },
  badges: { alignItems: "flex-end", gap: 2 },
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
