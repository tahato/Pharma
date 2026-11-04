import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import KeyboardScrollView from "@/components/KeyboardScrollView";
import { colors, radius, spacing } from "@/constants/theme";

// Modal sheet anchored to the bottom. Its content scrolls above the keyboard.
// Edge-to-edge flags are required by the keyboard library on Android.
export default function BottomSheet({ visible, onClose, children }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <KeyboardScrollView
            contentContainerStyle={[styles.content, { paddingBottom: spacing.xl + insets.bottom }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {children}
          </KeyboardScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    maxHeight: "85%",
    paddingTop: spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.inputBorder,
    alignSelf: "center",
  },
  content: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
});
