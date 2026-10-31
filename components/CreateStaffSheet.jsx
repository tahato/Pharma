import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text } from "react-native";
import BottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import TextField from "@/components/TextField";
import { colors, font, spacing } from "@/constants/theme";
import { errorText } from "@/services/errors";
import { createStaff } from "@/services/team";

export default function CreateStaffSheet({ visible, onClose }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setFullName("");
      setEmail("");
      setPassword("");
      setError(null);
    }
  }, [visible]);

  const create = useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      onClose();
    },
    onError: (e) => setError(errorText(t, e)),
  });

  const submit = () => {
    if (!fullName.trim()) return setError(t("errRequired"));
    if (!email.trim()) return setError(t("errInvalidEmail"));
    if (password.length < 8) return setError(t("errWeakPassword"));
    setError(null);
    create.mutate({ fullName: fullName.trim(), email: email.trim(), password });
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>{t("addMember")}</Text>
      <TextField label={t("fullName")} value={fullName} onChangeText={setFullName} />
      <TextField
        label={t("emailLabel")}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextField
        label={t("psw")}
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={styles.hint}>{t("passwordHint")}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title={t("create")} onPress={submit} loading={create.isPending} />
      <Button title={t("cancel")} variant="secondary" onPress={onClose} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: font.title, fontWeight: "500", color: colors.text },
  hint: { fontSize: font.small, color: colors.textSecondary, marginTop: -spacing.sm },
  error: { color: colors.danger, fontSize: font.small },
});
