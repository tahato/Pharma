import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Button from "@/components/Button";
import Chip from "@/components/Chip";
import KeyboardScrollView from "@/components/KeyboardScrollView";
import MonthYearPicker from "@/components/MonthYearPicker";
import TextField from "@/components/TextField";
import { colors, font, radius, spacing } from "@/constants/theme";
import { errorText } from "@/services/errors";
import { invalidateStock } from "@/services/invalidate";
import { adjustStock } from "@/services/products";
import { formatExpiry } from "@/tools/stock";

// mode: "add" (new batch, needs an expiry) or "remove" (earliest expiry first).
export default function StockAdjustSheet({ visible, mode, product, onClose }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [qty, setQty] = useState("");
  const [expiry, setExpiry] = useState(null);
  const [reason, setReason] = useState("adjustment");
  const [error, setError] = useState(null);
  const [pickingDate, setPickingDate] = useState(false);

  useEffect(() => {
    if (visible) {
      setQty("");
      setExpiry(null);
      setReason("adjustment");
      setError(null);
    }
  }, [visible]);

  const mutation = useMutation({
    mutationFn: adjustStock,
    onSuccess: () => {
      invalidateStock(queryClient);
      onClose();
    },
    onError: (e) => setError(errorText(t, e)),
  });

  const submit = () => {
    const n = Number(qty);
    if (!Number.isInteger(n) || n <= 0) return setError(t("errNumber"));
    if (mode === "add" && !expiry) return setError(t("errExpiryRequired"));
    setError(null);
    mutation.mutate({
      productId: product.id,
      delta: mode === "add" ? n : -n,
      reason: mode === "add" ? "purchase" : reason,
      expiry: mode === "add" ? expiry : null,
    });
  };

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
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <Text style={styles.title}>
              {t(mode === "add" ? "addStockTitle" : "removeStockTitle")}
            </Text>
            <Text style={styles.product}>{product?.name}</Text>

            <TextField
              label={t("quantity")}
              value={qty}
              onChangeText={setQty}
              keyboardType="numeric"
            />
            {mode === "add" ? (
              <TextField
                label={t("expiryDate")}
                icon="calendar-month-outline"
                placeholder={t("expiryPlaceholder")}
                value={expiry ? formatExpiry(expiry) : ""}
                onPress={() => setPickingDate(true)}
              />
            ) : (
              <View style={styles.chips}>
                <Chip
                  label={t("reasonAdjustment")}
                  selected={reason === "adjustment"}
                  onPress={() => setReason("adjustment")}
                />
                <Chip
                  label={t("reasonExpired")}
                  selected={reason === "expired"}
                  onPress={() => setReason("expired")}
                />
              </View>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              title={t("confirm")}
              onPress={submit}
              loading={mutation.isPending}
            />
            <Button title={t("cancel")} variant="secondary" onPress={onClose} />
          </KeyboardScrollView>
        </View>
      </View>
      <MonthYearPicker
        visible={pickingDate}
        value={expiry}
        onChange={setExpiry}
        onClose={() => setPickingDate(false)}
      />
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
  title: { fontSize: font.title, fontWeight: "500", color: colors.text },
  product: { fontSize: font.body, color: colors.textSecondary, marginTop: -spacing.sm },
  chips: { flexDirection: "row", gap: spacing.sm },
  error: { color: colors.danger, fontSize: font.small },
});
