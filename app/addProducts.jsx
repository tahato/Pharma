import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, Text, View } from "react-native";
import BarcodeScanner from "@/components/BarcodeScanner";
import Button from "@/components/Button";
import KeyboardScrollView from "@/components/KeyboardScrollView";
import MonthYearPicker from "@/components/MonthYearPicker";
import ScreenHeader from "@/components/ScreenHeader";
import TextField from "@/components/TextField";
import { colors, font, radius, spacing } from "@/constants/theme";
import { errorText } from "@/services/errors";
import { invalidateStock } from "@/services/invalidate";
import { createProduct } from "@/services/products";
import { formatExpiry, localDateString } from "@/tools/stock";

const isNumber = (v) => v !== undefined && v.trim() !== "" && !isNaN(Number(v)) && Number(v) >= 0;
const isInteger = (v) => isNumber(v) && Number.isInteger(Number(v));

export default function AddProducts() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [image, setImage] = useState();
  const [form, setForm] = useState({ minStock: "5" });
  const [errors, setErrors] = useState({});
  const [scanning, setScanning] = useState(false);
  const [pickingDate, setPickingDate] = useState(false);

  const update = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const mutation = useMutation({
    mutationFn: ({ values, imageUri }) => createProduct(values, imageUri),
    onSuccess: () => {
      invalidateStock(queryClient);
      router.back();
    },
    onError: (e) => setErrors({ form: errorText(t, e) }),
  });

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
    const qty = form.qt?.trim() ? Number(form.qt) : 0;
    if (!form.name?.trim()) e.name = t("errRequired");
    if (form.qt?.trim() && !isInteger(form.qt)) e.qt = t("errNumber");
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

  const save = () => {
    if (!validate()) return;
    mutation.mutate({ values: form, imageUri: image });
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

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={t("newProduct")}
        backIcon="close"
        onBack={() => router.back()}
      />
      <KeyboardScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.photoRow}>
          <View style={styles.photo}>
            {image ? (
              <Image source={{ uri: image }} style={styles.photoImage} />
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
        <View style={styles.pair}>
          {textField("htPrice", "priceHt", { style: { flex: 1 }, keyboardType: "numeric" })}
          {textField("ppa", "ppa", { style: { flex: 1 }, keyboardType: "numeric" })}
        </View>
        {textField("minStock", "minStock", { keyboardType: "numeric" })}

        {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}
        <Button
          title={t("save")}
          onPress={save}
          loading={mutation.isPending}
          style={styles.save}
        />
      </KeyboardScrollView>

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
