import { StyleSheet, Text, View } from "react-native";
import { colors, font, hairline, spacing } from "@/constants/theme";

export default function DetailField({ label, info }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.info}>{info}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomColor: colors.border,
    borderBottomWidth: hairline,
  },
  label: { fontSize: font.body, color: colors.textSecondary },
  info: { fontSize: font.body, color: colors.text },
});
