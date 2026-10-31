import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, Text, View } from "react-native";
import Badge from "@/components/Badge";
import BottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import TextField from "@/components/TextField";
import { colors, font, spacing } from "@/constants/theme";
import { errorText } from "@/services/errors";
import { setActive, setPassword, setRole } from "@/services/team";

// Owner actions on one team member. `isSelf` hides everything risky.
export default function MemberSheet({ member, isSelf, onClose }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [resetting, setResetting] = useState(false);
  const [password, setPasswordValue] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    setResetting(false);
    setPasswordValue("");
    setError(null);
  }, [member?.id]);

  const done = () => {
    queryClient.invalidateQueries({ queryKey: ["team"] });
    onClose();
  };
  const onError = (e) => setError(errorText(t, e));

  const role = useMutation({
    mutationFn: (next) => setRole(member.id, next),
    onSuccess: done,
    onError,
  });
  const active = useMutation({
    mutationFn: (next) => setActive(member.id, next),
    onSuccess: done,
    onError,
  });
  const reset = useMutation({
    mutationFn: () => setPassword(member.id, password),
    onSuccess: onClose,
    onError,
  });

  if (!member) return <BottomSheet visible={false} onClose={onClose} />;

  const isOwner = member.role === "owner";
  const confirm = (title, body, action) =>
    Alert.alert(title, body, [
      { text: t("cancel"), style: "cancel" },
      { text: t("confirm"), onPress: action },
    ]);

  return (
    <BottomSheet visible onClose={onClose}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{member.full_name || member.email}</Text>
          <Text style={styles.muted}>{member.email}</Text>
        </View>
        <Badge label={t(isOwner ? "owner" : "staff")} />
      </View>

      {isSelf ? (
        <Text style={styles.muted}>{t("yourAccount")}</Text>
      ) : (
        <>
          {resetting ? (
            <>
              <TextField
                label={t("newPassword")}
                value={password}
                onChangeText={setPasswordValue}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.muted}>{t("passwordHint")}</Text>
              <Button
                title={t("confirm")}
                loading={reset.isPending}
                onPress={() => {
                  if (password.length < 8) return setError(t("errWeakPassword"));
                  setError(null);
                  reset.mutate();
                }}
              />
            </>
          ) : (
            <Button
              title={t("resetPassword")}
              variant="secondary"
              onPress={() => setResetting(true)}
            />
          )}

          <Button
            title={t(isOwner ? "makeStaff" : "makeOwner")}
            variant="secondary"
            loading={role.isPending}
            onPress={() =>
              confirm(t("confirmRoleTitle"), t(isOwner ? "makeStaff" : "makeOwner"), () =>
                role.mutate(isOwner ? "staff" : "owner"),
              )
            }
          />

          {!isOwner &&
            (member.active ? (
              <Button
                title={t("deactivate")}
                variant="danger"
                loading={active.isPending}
                onPress={() =>
                  confirm(t("confirmDeactivateTitle"), t("confirmDeactivateBody"), () =>
                    active.mutate(false),
                  )
                }
              />
            ) : (
              <Button
                title={t("reactivate")}
                loading={active.isPending}
                onPress={() => active.mutate(true)}
              />
            ))}
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title={t("close")} variant="secondary" onPress={onClose} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  title: { fontSize: font.title, fontWeight: "500", color: colors.text },
  muted: { fontSize: font.small, color: colors.textSecondary },
  error: { color: colors.danger, fontSize: font.small },
});
