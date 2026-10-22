import { StyleSheet, Text, View } from "react-native";
import { colors, font } from "@/constants/theme";

const TONES = {
  primary: [colors.primaryTint, colors.primaryDark],
  success: [colors.successBg, colors.success],
  warning: [colors.warningBg, colors.warning],
  danger: [colors.dangerBg, colors.danger],
};

export default function Badge({ label, tone = "primary" }) {
  const [backgroundColor, color] = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    fontSize: font.caption,
  },
});
