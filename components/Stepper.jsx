import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, font, hairline, radius, spacing } from "@/constants/theme";

export default function Stepper({ value, onChange }) {
  return (
    <View style={styles.box}>
      <Pressable onPress={() => onChange(value - 1)} hitSlop={8} style={styles.btn}>
        <MaterialCommunityIcons name="minus" size={18} color={colors.primaryDark} />
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable onPress={() => onChange(value + 1)} hitSlop={8} style={styles.btn}>
        <MaterialCommunityIcons name="plus" size={18} color={colors.primaryDark} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: colors.inputBorder,
    borderWidth: hairline,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  btn: {
    width: 36,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    minWidth: 24,
    textAlign: "center",
    fontSize: font.body,
    fontWeight: "500",
    color: colors.text,
    paddingHorizontal: spacing.xs,
  },
});
