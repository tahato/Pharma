import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, font, spacing } from "@/constants/theme";

// overlap: extra bottom padding so a card below can slide up over the header.
export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  backIcon = "arrow-left",
  right,
  overlap = 0,
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + spacing.md,
          paddingBottom: spacing.md + overlap,
        },
      ]}
    >
      <View style={styles.row}>
        {onBack && (
          <Pressable onPress={onBack} hitSlop={12}>
            <MaterialCommunityIcons
              name={backIcon}
              size={22}
              color={colors.onPrimary}
            />
          </Pressable>
        )}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {right}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 32,
  },
  title: {
    flex: 1,
    color: colors.onPrimary,
    fontSize: font.title,
    fontWeight: "500",
  },
  subtitle: {
    color: colors.onPrimary,
    opacity: 0.85,
    fontSize: font.caption,
    marginTop: 2,
  },
});
