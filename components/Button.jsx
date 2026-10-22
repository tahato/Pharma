import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, font, hairline, radius, spacing } from "@/constants/theme";

// variants: primary (filled), secondary (outlined), danger (outlined red)
export default function Button({
  title,
  onPress,
  variant = "primary",
  icon,
  style,
}) {
  const textColor =
    variant === "primary"
      ? colors.onPrimary
      : variant === "danger"
        ? colors.danger
        : colors.primaryDark;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && {
          backgroundColor: pressed ? colors.primaryDark : colors.primary,
        },
        variant === "secondary" && {
          backgroundColor: pressed ? colors.primaryTint : colors.surface,
          borderColor: colors.primary,
          borderWidth: hairline,
        },
        variant === "danger" && {
          backgroundColor: colors.surface,
          borderColor: colors.danger,
          borderWidth: hairline,
        },
        style,
      ]}
    >
      {icon && <MaterialCommunityIcons name={icon} size={18} color={textColor} />}
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: radius.button,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  text: {
    fontSize: font.small,
    fontWeight: "500",
  },
});
