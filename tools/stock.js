export const EXPIRY_ALERT_DAYS = 30;

// Date-only strings ("2027-03-31") are parsed at noon so time zones never shift the day.
const toDate = (iso) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);

const pad = (n) => String(n).padStart(2, "0");

// Local calendar date as "YYYY-MM-DD" (what the database `date` columns expect).
export function localDateString(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Works on rows of the product_stock view.
export function stockStatus(product) {
  if (product.qty <= 0) return "out";
  if (product.qty <= product.min_stock) return "low";
  return "ok";
}

export function daysUntil(iso) {
  return Math.round((toDate(iso) - new Date()) / 86400000);
}

// earliest_expiry includes batches that are already expired.
export function isExpiringSoon(product, days = EXPIRY_ALERT_DAYS) {
  return !!product.earliest_expiry && daysUntil(product.earliest_expiry) <= days;
}

export function formatExpiry(iso) {
  const d = toDate(iso);
  return `${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function formatDA(amount) {
  return `${Math.round(Number(amount))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ")} DA`;
}
