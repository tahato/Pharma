import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import BarcodeScanner from "@/components/BarcodeScanner";
import Button from "@/components/Button";
import MonthYearPicker from "@/components/MonthYearPicker";
import ScreenHeader from "@/components/ScreenHeader";
import TextField from "@/components/TextField";
import { colors, radius, spacing } from "@/constants/theme";
import { formatExpiry } from "@/tools/stock";

const isNumber = (v) => v !== undefined && v.trim() !== "" && !isNaN(Number(v)) && Number(v) >= 0;

export default function AddProducts() {
  const { t } = useTranslation();
  const [image, setImage] = useState();
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [scanning, setScanning] = useState(false);
  const [pickingDate, setPickingDate] = useState(false);

  const update = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

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
    if (!form.name?.trim()) e.name = t("errRequired");
    if (!isNumber(form.qt) || !Number.isInteger(Number(form.qt))) e.qt = t("errNumber");
    if (!isNumber(form.htPrice)) e.htPrice = t("errNumber");
    if (!isNumber(form.ppa)) e.ppa = t("errNumber");
    if (!form.expiry) e.expiry = t("errRequired");
    else if (new Date(form.expiry) < new Date()) e.expiry = t("errPastDate");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Persistence comes with the Supabase phase; for now a valid form just closes.
  const save = () => {
    if (validate()) router.back();
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
      quality: 1,
    };
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri);
      const fileName = uri.split("/").pop();
      const destPath = `${FileSystem.documentDirectory}${fileName}`;
      try {
        await FileSystem.copyAsync({ from: uri, to: destPath });
      } catch (error) {
        console.error("Error saving image:", error);
      }
    }
  };

  const chooseImageSource = () => {
    Alert.alert(t("addPhoto"), undefined, [
      { text: t("takePhoto"), onPress: () => pickImage(true) },
      { text: t("chooseGallery"), onPress: () => pickImage(false) },
      { text: t("cancel"), style: "cancel" },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenHeader
        title={t("newProduct")}
        backIcon="close"
        onBack={() => router.back()}
      />
      <ScrollView
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

        <Button title={t("save")} onPress={save} style={styles.save} />
      </ScrollView>

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
        onChange={(iso) => update("expiry", iso)}
        onClose={() => setPickingDate(false)}
      />
    </KeyboardAvoidingView>
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
  save: { marginTop: spacing.sm },
});
