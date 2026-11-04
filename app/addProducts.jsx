import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Alert, StyleSheet, Text, View } from "react-native";
import BarcodeScanner from "@/components/BarcodeScanner";
import Button from "@/components/Button";
import ErrorState from "@/components/ErrorState";
import KeyboardScrollView from "@/components/KeyboardScrollView";
import LoadingState from "@/components/LoadingState";
import MonthYearPicker from "@/components/MonthYearPicker";
import ScreenHeader from "@/components/ScreenHeader";
import TextField from "@/components/TextField";
import { colors, font, radius, spacing } from "@/constants/theme";
import { errorText } from "@/services/errors";
import { invalidateStock } from "@/services/invalidate";
import {
  archiveProduct,
  createProduct,
  fetchProduct,
  productImageUrl,
  updateProduct,
} from "@/services/products";
import { formatExpiry, localDateString } from "@/tools/stock";

const isNumber = (v) => v !== undefined && v.trim() !== "" && !isNaN(Number(v)) && Number(v) >= 0;
const isInteger = (v) => isNumber(v) && Number.isInteger(Number(v));

// Creates a product, or edits one when opened with ?id= (owner only).
// Stock quantities are not edited here: use Ajouter / Déstocker on the product.
export default function AddProducts() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams();
  const editing = !!id;
  const insets = useSafeAreaInsets();

  const [image, setImage] = useState();
  const [form, setForm] = useState({ minStock: "5" });
  const [errors, setErrors] = useState({});
  const [scanning, setScanning] = useState(false);
  const [pickingDate, setPickingDate] = useState(false);
  const [filled, setFilled] = useState(false);

  const existing = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
    enabled: editing,
  });

  useEffect(() => {
    const p = existing.data;
    if (p && !filled) {
      setForm({
        barCode: p.barcode ?? "",
        name: p.name,
        classe: p.classe ?? "",
        htPrice: String(Number(p.price_ht)),
        ppa: String(Number(p.price_ppa)),
        minStock: String(p.min_stock),
      });
      setFilled(true);
    }
  }, [existing.data, filled]);

  const update = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const save = useMutation({
    mutationFn: ({ values, imageUri }) =>
      editing
        ? updateProduct(id, values, {
            imageUri,
            currentImagePath: existing.data?.image_path ?? null,
          })
        : createProduct(values, imageUri),
    onSuccess: () => {
      invalidateStock(queryClient);
      router.back();
    },
    onError: (e) => setErrors({ form: errorText(t, e) }),
  });

  const remove = useMutation({
    mutationFn: () => archiveProduct(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["product", id] });
      invalidateStock(queryClient);
      router.dismiss(2); // back to the stock list
    },
    onError: (e) => setErrors({ form: errorText(t, e) }),
  });

  const confirmDelete = () =>
    Alert.alert(t("deleteConfirmTitle"), t("deleteConfirmBody"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("delete"), style: "destructive", onPress: () => remove.mutate() },
    ]);

  const textField = (key, label, props) => (
    <TextField
      label={t(label)}
      value={form[key] ?? ""}
      onChangeText={(v) => update(key, v)}
      error={errors[key]}
      {...props}
    />
  );

  const validate = () => {
    const e = {};
    const qty = !editing && form.qt?.trim() ? Number(form.qt) : 0;
    if (!form.name?.trim()) e.name = t("errRequired");
    if (!editing && form.qt?.trim() && !isInteger(form.qt)) e.qt = t("errNumber");
    if (!isNumber(form.htPrice)) e.htPrice = t("errNumber");
    if (!isNumber(form.ppa)) e.ppa = t("errNumber");
    if (!isInteger(form.minStock)) e.minStock = t("errNumber");
    if (qty > 0) {
      if (!form.expiry) e.expiry = t("errRequired");
      else if (form.expiry < localDateString()) e.expiry = t("errPastDate");
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (validate()) save.mutate({ values: form, imageUri: image });
  };

  const pickImage = async (fromCamera) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert(t(fromCamera ? "cameraPermission" : "galleryPermission"));
      return;
    }
    const options = {
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    };
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const chooseImageSource = () => {
    Alert.alert(t("addPhoto"), undefined, [
      { text: t("takePhoto"), onPress: () => pickImage(true) },
      { text: t("chooseGallery"), onPress: () => pickImage(false) },
      { text: t("cancel"), style: "cancel" },
    ]);
  };

  const shownImage = image ?? productImageUrl(existing.data?.image_path);

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={t(editing ? "editProduct" : "newProduct")}
        backIcon="close"
        onBack={() => router.back()}
      />
      {editing && existing.isPending && <LoadingState />}
      {editing && existing.isError && (
        <ErrorState error={existing.error} onRetry={existing.refetch} />
      )}
      {(!editing || filled) && (
        <KeyboardScrollView
          contentContainerStyle={[styles.content, { paddingBottom: spacing.lg + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.photoRow}>
            <View style={styles.photo}>
              {shownImage ? (
                <Image source={{ uri: shownImage }} style={styles.photoImage} />
              ) : (
                <MaterialCommunityIcons name="camera-outline" size={26} color={colors.primary} />
              )}
            </View>
            <Button
              title={t("addPhoto")}
              variant="secondary"
              onPress={chooseImageSource}
              style={{ flex: 1 }}
            />
          </View>

          {textField("barCode", "barcode", {
            icon: "barcode-scan",
            onIconPress: () => setScanning(true),
          })}
          {textField("name", "name")}
          {editing ? (
            textField("classe", "class")
          ) : (
            <>
              <View style={styles.pair}>
                {textField("classe", "class", { style: { flex: 1 } })}
                {textField("qt", "quantity", { style: { flex: 1 }, keyboardType: "numeric" })}
              </View>
              <TextField
                label={t("expiryDate")}
                icon="calendar-month-outline"
                placeholder={t("expiryPlaceholder")}
                value={form.expiry ? formatExpiry(form.expiry) : ""}
                onPress={() => setPickingDate(true)}
                error={errors.expiry}
              />
            </>
          )}
          <View style={styles.pair}>
            {textField("htPrice", "priceHt", { style: { flex: 1 }, keyboardType: "numeric" })}
            {textField("ppa", "ppa", { style: { flex: 1 }, keyboardType: "numeric" })}
          </View>
          {textField("minStock", "minStock", { keyboardType: "numeric" })}

          {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}
          <Button
            title={t("save")}
            onPress={submit}
            loading={save.isPending}
            style={styles.save}
          />
          {editing && (
            <Button
              title={t("deleteProduct")}
              variant="danger"
              onPress={confirmDelete}
              loading={remove.isPending}
            />
          )}
        </KeyboardScrollView>
      )}

      <BarcodeScanner
        visible={scanning}
        onClose={() => setScanning(false)}
        onScanned={(code) => {
          update("barCode", code);
          setScanning(false);
        }}
      />
      <MonthYearPicker
        visible={pickingDate}
        value={form.expiry}
        onChange={(date) => update("expiry", date)}
        onClose={() => setPickingDate(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  photoRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  photo: {
    width: 64,
    height: 64,
    borderRadius: radius.card,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photoImage: { width: "100%", height: "100%" },
  pair: { flexDirection: "row", gap: spacing.md },
  formError: { color: colors.danger, fontSize: font.small },
  save: { marginTop: spacing.sm },
});
