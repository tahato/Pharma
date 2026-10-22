import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors, font, spacing } from "@/constants/theme";

export default function EmptyState({ icon = "magnify", title, body }) {
  return (
    <View style={styles.box}>
      <MaterialCommunityIcons name={icon} size={40} color={colors.textSecondary} />
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", gap: spacing.sm, marginTop: spacing.xl },
  title: { fontSize: font.title, fontWeight: "500", color: colors.text },
  body: { fontSize: font.small, color: colors.textSecondary, textAlign: "center" },
});
