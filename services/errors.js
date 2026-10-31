// Maps Supabase / Postgres errors to translation keys.
// Database functions raise short codes as the error message (see CLAUDE.md).
export function errorKey(error) {
  const message = error?.message ?? "";
  if (
    error?.name === "AuthRetryableFetchError" ||
    /network request failed|failed to fetch|fetch failed|timed out/i.test(message)
  ) {
    return "errNetwork";
  }
  if (/invalid login credentials/i.test(message)) return "errInvalidLogin";
  if (message === "insufficient_stock") return "errInsufficientStock";
  if (message === "expiry_required") return "errExpiryRequired";
  if (message === "product_not_found") return "errProductNotFound";
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
