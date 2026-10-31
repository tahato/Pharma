import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, font, hairline, radius, spacing } from "@/constants/theme";

const pad = (n) => String(n).padStart(2, "0");

// Picks a month and year. onChange receives the last day of that month as
// "YYYY-MM-DD" (the format of the database `date` columns).
export default function MonthYearPicker({ visible, value, onChange, onClose }) {
  const { i18n } = useTranslation();
  const now = new Date();
  const selected = value ? new Date(`${value}T12:00:00`) : null;
  const [year, setYear] = useState((selected ?? now).getFullYear());

  const monthLabel = (m) =>
    new Date(2000, m, 1).toLocaleDateString(i18n.language, { month: "short" });
  const isPast = (m) =>
    year < now.getFullYear() ||
    (year === now.getFullYear() && m < now.getMonth());

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.yearRow}>
          <Pressable
            onPress={() => setYear((y) => Math.max(now.getFullYear(), y - 1))}
            hitSlop={12}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.primaryDark} />
          </Pressable>
          <Text style={styles.year}>{year}</Text>
          <Pressable onPress={() => setYear((y) => y + 1)} hitSlop={12}>
            <MaterialCommunityIcons name="chevron-right" size={28} color={colors.primaryDark} />
          </Pressable>
        </View>
        <View style={styles.grid}>
          {Array.from({ length: 12 }, (_, m) => {
            const active =
              selected &&
              selected.getFullYear() === year &&
              selected.getMonth() === m;
            const past = isPast(m);
            return (
              <Pressable
                key={m}
                disabled={past}
                style={[styles.month, active && styles.monthActive]}
                onPress={() => {
                  const lastDay = new Date(year, m + 1, 0).getDate();
                  onChange(`${year}-${pad(m + 1)}-${pad(lastDay)}`);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.monthText,
                    past && { color: colors.inputBorder },
                    active && { color: colors.onPrimary },
                  ]}
                >
                  {monthLabel(m)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.inputBorder,
    alignSelf: "center",
  },
  yearRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  year: { fontSize: font.title, fontWeight: "500", color: colors.text },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  month: {
    width: "23%",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.input,
    borderColor: colors.border,
    borderWidth: hairline,
  },
  monthActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  monthText: { fontSize: font.body, color: colors.text },
});
