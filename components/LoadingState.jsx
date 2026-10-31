import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors, spacing } from "@/constants/theme";

export default function LoadingState() {
  return (
    <View style={styles.box}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", marginTop: spacing.xl * 2 },
});
