// Maps Supabase / Postgres errors to translation keys.
// Database functions raise short codes as the error message (see CLAUDE.md).
export function errorKey(error) {
  const message = error?.message ?? "";
  if (
    error?.name === "AuthRetryableFetchError" ||
    /network request failed|failed to fetch|fetch failed|timed out|failed to send a request/i.test(message)
  ) {
    return "errNetwork";
  }
  if (/invalid login credentials/i.test(message)) return "errInvalidLogin";
  if (message === "insufficient_stock") return "errInsufficientStock";
  if (message === "expiry_required") return "errExpiryRequired";
  if (message === "product_not_found") return "errProductNotFound";
  if (message === "email_exists") return "errEmailExists";
  if (message === "invalid_email") return "errInvalidEmail";
  if (message === "weak_password") return "errWeakPassword";
  if (message === "self_action") return "errSelfAction";
  if (message === "target_is_owner") return "errTargetOwner";
  if (message === "last_owner") return "errLastOwner";
  if (message === "forbidden" || error?.code === "42501") return "errForbidden";
  if (error?.code === "23505") return "errBarcodeTaken";
  return "errGeneric";
}

export function errorText(t, error) {
  const key = errorKey(error);
  if (key === "errInsufficientStock" && error?.details) {
    return t("errInsufficientStockFor", { name: error.details });
  }
  return t(key);
}
