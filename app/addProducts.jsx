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
import Button from "@/components/Button";
import ScreenHeader from "@/components/ScreenHeader";
import TextField from "@/components/TextField";
import { colors, radius, spacing } from "@/constants/theme";

export default function AddProducts() {
  const { t } = useTranslation();
  const [image, setImage] = useState();
  const [form, setForm] = useState({});

  const field = (key, label, extra = {}) => (
    <TextField
      label={t(label)}
      value={form[key] ?? ""}
      onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
      style={extra.half ? { flex: 1 } : undefined}
      {...extra.props}
    />
  );

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

        {field("barCode", "barcode", { props: { icon: "barcode-scan" } })}
        {field("name", "name")}
        <View style={styles.pair}>
          {field("classe", "class", { half: true })}
          {field("qt", "quantity", { half: true, props: { keyboardType: "numeric" } })}
        </View>
        {field("expiry", "expiryDate", {
          props: { icon: "calendar-month-outline", placeholder: t("expiryPlaceholder") },
        })}
        <View style={styles.pair}>
          {field("htPrice", "priceHt", { half: true, props: { keyboardType: "numeric" } })}
          {field("ppa", "ppa", { half: true, props: { keyboardType: "numeric" } })}
        </View>

        <Button title={t("save")} style={styles.save} />
      </ScrollView>
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
