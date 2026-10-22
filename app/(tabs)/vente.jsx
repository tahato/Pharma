import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import BarcodeScanner from "@/components/BarcodeScanner";
import Button from "@/components/Button";
import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import ScreenHeader from "@/components/ScreenHeader";
import SearchBar from "@/components/SearchBar";
import Stepper from "@/components/Stepper";
import { colors, font, hairline, radius, spacing } from "@/constants/theme";
import { products } from "@/data/mock";
import { formatDA } from "@/tools/stock";

const byId = (id) => products.find((p) => p.id === id);

export default function Vente() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([
    { id: "1", qty: 2 },
    { id: "2", qty: 1 },
    { id: "4", qty: 3 },
  ]);
  const [confirming, setConfirming] = useState(false);
  const [scanning, setScanning] = useState(false);

  const q = query.trim().toLowerCase();
  const results = q
    ? products
        .filter((p) => p.name.toLowerCase().includes(q) || p.barcode.includes(q))
        .slice(0, 5)
    : [];

  const addToCart = (id) => {
    setCart((c) =>
      c.some((l) => l.id === id)
        ? c.map((l) => (l.id === id ? { ...l, qty: Math.min(l.qty + 1, byId(id).qty) } : l))
        : [...c, { id, qty: 1 }],
    );
    setQuery("");
  };

  const handleScan = (code) => {
    setScanning(false);
    const product = products.find((p) => p.barcode === code);
    if (!product) {
      Alert.alert(t("productNotFound"), code);
    } else if (product.qty <= 0) {
      Alert.alert(product.name, t("outOfStock"));
    } else {
      addToCart(product.id);
    }
  };

  // Setting the quantity to 0 removes the line.
  const setQty = (id, qty) =>
    setCart((c) =>
      qty <= 0
        ? c.filter((l) => l.id !== id)
        : c.map((l) => (l.id === id ? { ...l, qty } : l)),
    );

  const count = cart.reduce((sum, l) => sum + l.qty, 0);
  const total = cart.reduce((sum, l) => sum + l.qty * byId(l.id).ppa, 0);

  return (
    <View style={styles.screen}>
      <ScreenHeader title={t("sales")} />
      <ScrollView
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
          <Pressable key={p.id} style={styles.result} onPress={() => addToCart(p.id)}>
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.price}>{formatDA(p.ppa)}</Text>
          </Pressable>
        ))}

        {cart.length === 0 && (
          <EmptyState
            icon="cart-outline"
            title={t("emptyCart")}
            body={t("emptyCartBody")}
          />
        )}

        {cart.map((line) => {
          const p = byId(line.id);
          return (
            <ReanimatedSwipeable
              key={line.id}
              overshootRight={false}
              renderRightActions={() => (
                <Pressable
                  style={styles.remove}
                  onPress={() => setQty(line.id, 0)}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.onPrimary} />
                  <Text style={styles.removeText}>{t("delete")}</Text>
                </Pressable>
              )}
            >
              <Card style={styles.line}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{p.name}</Text>
                  <Text style={styles.price}>{formatDA(p.ppa)}</Text>
                </View>
                <Stepper
                  value={line.qty}
                  onChange={(v) => setQty(line.id, Math.min(v, p.qty))}
                />
              </Card>
            </ReanimatedSwipeable>
          );
        })}
      </ScrollView>

      {cart.length > 0 && (
        <View style={styles.bottom}>
          <View style={styles.totalRow}>
            <Text style={styles.price}>{t("items", { count })}</Text>
            <Text style={styles.total}>{formatDA(total)}</Text>
          </View>
          <Button title={t("checkout")} onPress={() => setConfirming(true)} />
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
        onRequestClose={() => setConfirming(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setConfirming(false)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{t("confirmSale")}</Text>
          {cart.map((l) => (
            <View key={l.id} style={styles.sheetRow}>
              <Text style={styles.name}>
                {byId(l.id).name} x{l.qty}
              </Text>
              <Text style={styles.name}>{formatDA(l.qty * byId(l.id).ppa)}</Text>
            </View>
          ))}
          <View style={styles.sheetRow}>
            <Text style={styles.sheetTotal}>{t("total")}</Text>
            <Text style={styles.sheetTotal}>{formatDA(total)}</Text>
          </View>
          <Button
            title={t("confirm")}
            onPress={() => {
              setCart([]);
              setConfirming(false);
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
});
