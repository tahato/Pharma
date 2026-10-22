import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, font, hairline, radius, spacing } from "@/constants/theme";

// onPress turns the field into a read-only button (e.g. opens a picker).
export default function TextField({
  label,
  icon,
  onIconPress,
  leftIcon,
  error,
  onPress,
  style,
  ...inputProps
}) {
  const Field = onPress ? Pressable : View;
  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Field
        onPress={onPress}
        style={[styles.field, error && { borderColor: colors.danger }]}
      >
        {leftIcon && (
          <MaterialCommunityIcons
            name={leftIcon}
            size={18}
            color={colors.textSecondary}
          />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textSecondary}
          editable={!onPress}
          pointerEvents={onPress ? "none" : "auto"}
          {...inputProps}
        />
        {icon && (
          <Pressable onPress={onIconPress} hitSlop={10} disabled={!onIconPress}>
            <MaterialCommunityIcons
              name={icon}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </Field>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 4 },
  label: { color: colors.textSecondary, fontSize: font.small },
  field: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderColor: colors.inputBorder,
    borderWidth: hairline,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: font.body,
    paddingVertical: 0,
  },
  error: { color: colors.danger, fontSize: font.small },
});
