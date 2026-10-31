import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { randomUUID } from "expo-crypto";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import BarcodeScanner from "@/components/BarcodeScanner";
import Button from "@/components/Button";
import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import KeyboardScrollView from "@/components/KeyboardScrollView";
import ScreenHeader from "@/components/ScreenHeader";
import SearchBar from "@/components/SearchBar";
import Stepper from "@/components/Stepper";
import { colors, font, hairline, radius, spacing } from "@/constants/theme";
import useDebounce from "@/lib/useDebounce";
import { errorText } from "@/services/errors";
import { invalidateSales } from "@/services/invalidate";
import { fetchProductByBarcode, searchProducts } from "@/services/products";
import { createSale } from "@/services/sales";
import { formatDA } from "@/tools/stock";

export default function Vente() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]); // [{ product, qty }]
  const [confirming, setConfirming] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [saleError, setSaleError] = useState(null);
  // One id per cart content: retrying the same sale after a network error can
  // never record it twice. Any change to the cart starts a new id.
  const saleId = useRef(null);

  const debounced = useDebounce(query.trim());
  const search = useQuery({
    queryKey: ["productSearch", debounced],
    queryFn: () => searchProducts(debounced),
    enabled: debounced.length > 0,
  });
  const results = debounced ? (search.data ?? []) : [];

  const updateCart = (next) => {
    saleId.current = null;
    setCart(next);
  };

  const addToCart = (product) => {
    if (product.qty <= 0) {
      Alert.alert(product.name, t("outOfStock"));
      return;
    }
    const existing = cart.find((l) => l.product.id === product.id);
    updateCart(
      existing
        ? cart.map((l) =>
            l.product.id === product.id
              ? { ...l, qty: Math.min(l.qty + 1, product.qty) }
              : l,
          )
        : [...cart, { product, qty: 1 }],
    );
    setQuery("");
  };

  const handleScan = async (code) => {
    setScanning(false);
    try {
      const product = await fetchProductByBarcode(code);
      if (product) addToCart(product);
      else Alert.alert(t("productNotFound"), code);
    } catch (e) {
      Alert.alert(t("loadError"), errorText(t, e));
    }
  };

  // Setting the quantity to 0 removes the line.
  const setQty = (productId, qty) =>
    updateCart(
      qty <= 0
        ? cart.filter((l) => l.product.id !== productId)
        : cart.map((l) => (l.product.id === productId ? { ...l, qty } : l)),
    );

  const count = cart.reduce((sum, l) => sum + l.qty, 0);
  const total = cart.reduce((sum, l) => sum + l.qty * Number(l.product.price_ppa), 0);

  const sale = useMutation({
    mutationFn: () => {
      saleId.current ??= randomUUID();
      return createSale(
        cart.map((l) => ({ productId: l.product.id, qty: l.qty })),
        saleId.current,
      );
    },
    onSuccess: () => {
      invalidateSales(queryClient);
      saleId.current = null;
      setCart([]);
      setConfirming(false);
      Alert.alert(t("saleSaved"), formatDA(total));
    },
    onError: (e) => {
      setSaleError(errorText(t, e));
      // Stock may have changed since the products were loaded.
      invalidateSales(queryClient);
    },
  });

  const openConfirm = () => {
    setSaleError(null);
    setConfirming(true);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t("sales")} />
      <KeyboardScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t("addProductSearch")}
          onScan={() => setScanning(true)}
        />
        {results.map((p) => (
          <Pressable key={p.id} style={styles.result} onPress={() => addToCart(p)}>
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.price}>{formatDA(p.price_ppa)}</Text>
          </Pressable>
        ))}

        {cart.length === 0 && (
          <EmptyState
            icon="cart-outline"
            title={t("emptyCart")}
            body={t("emptyCartBody")}
          />
        )}

        {cart.map((line) => (
          <ReanimatedSwipeable
            key={line.product.id}
            overshootRight={false}
            renderRightActions={() => (
              <Pressable
                style={styles.remove}
                onPress={() => setQty(line.product.id, 0)}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.onPrimary} />
                <Text style={styles.removeText}>{t("delete")}</Text>
              </Pressable>
            )}
          >
            <Card style={styles.line}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{line.product.name}</Text>
                <Text style={styles.price}>{formatDA(line.product.price_ppa)}</Text>
              </View>
              <Stepper
                value={line.qty}
                onChange={(v) => setQty(line.product.id, Math.min(v, line.product.qty))}
              />
            </Card>
          </ReanimatedSwipeable>
        ))}
      </KeyboardScrollView>

      {cart.length > 0 && (
        <View style={styles.bottom}>
          <View style={styles.totalRow}>
            <Text style={styles.price}>{t("items", { count })}</Text>
            <Text style={styles.total}>{formatDA(total)}</Text>
          </View>
          <Button title={t("checkout")} onPress={openConfirm} />
        </View>
      )}

      <BarcodeScanner
        visible={scanning}
        onClose={() => setScanning(false)}
        onScanned={handleScan}
      />

      <Modal
        transparent
        visible={confirming}
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setConfirming(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setConfirming(false)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{t("confirmSale")}</Text>
          {cart.map((l) => (
            <View key={l.product.id} style={styles.sheetRow}>
              <Text style={styles.name}>
                {l.product.name} x{l.qty}
              </Text>
              <Text style={styles.name}>{formatDA(l.qty * Number(l.product.price_ppa))}</Text>
            </View>
          ))}
          <View style={styles.sheetRow}>
            <Text style={styles.sheetTotal}>{t("total")}</Text>
            <Text style={styles.sheetTotal}>{formatDA(total)}</Text>
          </View>
          {saleError ? <Text style={styles.error}>{saleError}</Text> : null}
          <Button
            title={t("confirm")}
            loading={sale.isPending}
            onPress={() => {
              setSaleError(null);
              sale.mutate();
            }}
          />
          <Button
            title={t("cancel")}
            variant="secondary"
            onPress={() => setConfirming(false)}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.sm },
  result: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md,
    backgroundColor: colors.primaryTint,
    borderRadius: radius.input,
  },
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  remove: {
    width: 80,
    marginLeft: spacing.sm,
    backgroundColor: colors.danger,
    borderRadius: radius.card,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  removeText: { color: colors.onPrimary, fontSize: font.caption },
  name: { fontSize: font.body, fontWeight: "500", color: colors.text },
  price: { fontSize: font.small, color: colors.textSecondary },
  bottom: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: hairline,
    padding: spacing.md,
    gap: spacing.sm,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  total: { fontSize: 18, fontWeight: "500", color: colors.text },
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.inputBorder,
    alignSelf: "center",
    marginBottom: spacing.sm,
  },
  sheetTitle: { fontSize: font.title, fontWeight: "500", color: colors.text },
  sheetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  sheetTotal: { fontSize: 14, fontWeight: "500", color: colors.text },
  error: { color: colors.danger, fontSize: font.small },
});
