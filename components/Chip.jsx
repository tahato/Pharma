import { Pressable, StyleSheet, Text } from "react-native";
import { colors, font, hairline, spacing } from "@/constants/theme";

export default function Chip({ label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.selected]}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderColor: colors.inputBorder,
    borderWidth: hairline,
  },
  selected: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primaryTint,
  },
  text: { color: colors.textSecondary, fontSize: font.small },
  textSelected: { color: colors.primaryDark, fontWeight: "500" },
});
