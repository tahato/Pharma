import { errorKey, errorText } from "@/services/errors";

describe("errorKey", () => {
  test.each([
    [{ message: "insufficient_stock" }, "errInsufficientStock"],
    [{ message: "expiry_required" }, "errExpiryRequired"],
    [{ message: "product_not_found" }, "errProductNotFound"],
    [{ message: "forbidden" }, "errForbidden"],
    [{ message: "permission denied for table x", code: "42501" }, "errForbidden"],
    [{ message: "duplicate key", code: "23505" }, "errBarcodeTaken"],
    [{ message: "email_exists" }, "errEmailExists"],
    [{ message: "invalid_email" }, "errInvalidEmail"],
    [{ message: "weak_password" }, "errWeakPassword"],
    [{ message: "self_action" }, "errSelfAction"],
    [{ message: "target_is_owner" }, "errTargetOwner"],
    [{ message: "last_owner" }, "errLastOwner"],
    [{ message: "Invalid login credentials" }, "errInvalidLogin"],
    [{ message: "Network request failed" }, "errNetwork"],
    [{ message: "Failed to send a request to the Edge Function" }, "errNetwork"],
    [{ name: "AuthRetryableFetchError", message: "x" }, "errNetwork"],
    [{ message: "something unexpected" }, "errGeneric"],
    [undefined, "errGeneric"],
  ])("%j -> %s", (error, key) => {
    expect(errorKey(error)).toBe(key);
  });
});

describe("errorText", () => {
  const t = (key, vars) => (vars ? `${key}:${vars.name}` : key);
  test("names the product when stock is short", () => {
    expect(errorText(t, { message: "insufficient_stock", details: "Doliprane" })).toBe(
      "errInsufficientStockFor:Doliprane",
    );
  });
  test("falls back to the plain message without a product name", () => {
    expect(errorText(t, { message: "insufficient_stock" })).toBe("errInsufficientStock");
  });
});
