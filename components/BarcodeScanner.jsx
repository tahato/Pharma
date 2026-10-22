import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Button from "@/components/Button";
import { font, radius, spacing } from "@/constants/theme";

// Full-screen scanner. Calls onScanned(code) once per opening; the parent closes it.
export default function BarcodeScanner({ visible, onScanned, onClose }) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const handled = useRef(false);

  useEffect(() => {
    if (!visible) return;
    handled.current = false;
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [visible, permission, requestPermission]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        {permission?.granted ? (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              barcodeScannerSettings={{
                barcodeTypes: ["ean13", "ean8", "upc_a", "code128"],
              }}
              onBarcodeScanned={({ data }) => {
                if (handled.current) return;
                handled.current = true;
                onScanned(data);
              }}
            />
            <View style={styles.frame} pointerEvents="none" />
            <Text style={styles.hint}>{t("scanHint")}</Text>
          </>
        ) : (
          <View style={styles.denied}>
            <Text style={styles.deniedText}>{t("cameraPermission")}</Text>
            <Button
              title={t("openSettings")}
              variant="secondary"
              onPress={() => Linking.openSettings()}
            />
          </View>
        )}
        <Pressable style={styles.close} onPress={onClose} hitSlop={12}>
          <MaterialCommunityIcons name="close" size={26} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },
  close: { position: "absolute", top: 48, right: spacing.lg },
  frame: {
    position: "absolute",
    top: "30%",
    alignSelf: "center",
    width: 260,
    height: 160,
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: radius.card,
  },
  hint: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    color: "#fff",
    fontSize: font.body,
  },
  denied: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    padding: spacing.xl,
  },
  deniedText: { color: "#fff", fontSize: font.body, textAlign: "center" },
});
