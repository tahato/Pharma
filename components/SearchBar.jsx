import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import TextField from "@/components/TextField";
import { colors, radius } from "@/constants/theme";

// onScan: when provided, shows a barcode-scan button next to the field.
export default function SearchBar({ value, onChangeText, placeholder, onScan }) {
  return (
    <View style={styles.row}>
      <TextField
        style={{ flex: 1 }}
        leftIcon="magnify"
        icon={value ? "close-circle" : undefined}
        onIconPress={() => onChangeText("")}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        autoCapitalize="none"
      />
      {onScan && (
        <Pressable style={styles.scan} onPress={onScan}>
          <MaterialCommunityIcons
            name="barcode-scan"
            size={22}
            color={colors.onPrimary}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  scan: {
    width: 44,
    height: 44,
    borderRadius: radius.input,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
