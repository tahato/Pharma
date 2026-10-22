export const EXPIRY_ALERT_DAYS = 30;

export function stockStatus(product) {
  if (product.qty <= 0) return "out";
  if (product.qty <= product.minStock) return "low";
  return "ok";
}

export function daysUntil(iso) {
  return Math.round((new Date(iso) - new Date()) / 86400000);
}

export function nextExpiry(product) {
  const dates = product.batches.map((b) => b.expiry).sort();
  return dates[0];
}

export function isExpiringSoon(product, days = EXPIRY_ALERT_DAYS) {
  return product.batches.some((b) => daysUntil(b.expiry) <= days);
}

export function formatExpiry(iso) {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function formatDA(amount) {
  return `${Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ")} DA`;
}
