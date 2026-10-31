import { supabase } from "@/lib/supabase";
import { EXPIRY_ALERT_DAYS, localDateString } from "@/tools/stock";

export const PAGE_SIZE = 30;

function soonDate() {
  const d = new Date();
  d.setDate(d.getDate() + EXPIRY_ALERT_DAYS);
  return localDateString(d);
}

// Characters that would break PostgREST's or() filter syntax.
const sanitize = (text) => text.replace(/[%,()*\\]/g, " ").trim();

// One page of the stock list. filter: "all" | "low" | "expiring".
export async function fetchProductPage({
  query = "",
  filter = "all",
  page = 0,
  pageSize = PAGE_SIZE,
}) {
  let req = supabase
    .from("product_stock")
    .select("*")
    .order("name")
    .order("id")
    .range(page * pageSize, page * pageSize + pageSize - 1);

  const text = sanitize(query);
  if (text) req = req.or(`name.ilike.%${text}%,barcode.ilike.%${text}%`);
  if (filter === "low") req = req.eq("is_low", true);
  if (filter === "expiring") req = req.lte("earliest_expiry", soonDate());

  const { data, error } = await req;
  if (error) throw error;
  return data;
}

export function searchProducts(query, limit = 5) {
  return fetchProductPage({ query, pageSize: limit });
}

export async function fetchProduct(id) {
  const [product, batches] = await Promise.all([
    supabase.from("product_stock").select("*").eq("id", id).single(),
    supabase
      .from("batches")
      .select("id, quantity, expiry_date")
      .eq("product_id", id)
      .gt("quantity", 0)
      .order("expiry_date"),
  ]);
  if (product.error) throw product.error;
  if (batches.error) throw batches.error;
  return { ...product.data, batches: batches.data };
}

export async function fetchProductByBarcode(code) {
  const { data, error } = await supabase
    .from("product_stock")
    .select("*")
    .eq("barcode", code)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function productImageUrl(path) {
  if (!path) return null;
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

async function uploadProductImage(uri) {
  const extension = (uri.split(".").pop() ?? "jpg").toLowerCase().split("?")[0];
  const contentType = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension === "jpg" ? "jpg" : extension}`;
  const body = await (await fetch(uri)).arrayBuffer();
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, body, { contentType });
  if (error) throw error;
  return path;
}

// Creates the product and its first batch in one database transaction.
export async function createProduct(values, imageUri) {
  const imagePath = imageUri ? await uploadProductImage(imageUri) : null;
  const { data, error } = await supabase.rpc("create_product", {
    p_name: values.name,
    p_barcode: values.barCode || null,
    p_classe: values.classe || null,
    p_price_ht: Number(values.htPrice),
    p_price_ppa: Number(values.ppa),
    p_min_stock: Number(values.minStock || 5),
    p_image_path: imagePath,
    p_qty: Number(values.qt || 0),
    p_expiry: values.expiry || null,
  });
  if (error) throw error;
  return data;
}

// Owner only. imageUri: a newly picked photo (or undefined to keep the current one).
export async function updateProduct(id, values, { imageUri, currentImagePath }) {
  const imagePath = imageUri ? await uploadProductImage(imageUri) : currentImagePath;
  const { error } = await supabase.rpc("update_product", {
    p_id: id,
    p_name: values.name,
    p_barcode: values.barCode || null,
    p_classe: values.classe || null,
    p_price_ht: Number(values.htPrice),
    p_price_ppa: Number(values.ppa),
    p_min_stock: Number(values.minStock || 5),
    p_image_path: imagePath ?? null,
  });
  if (error) throw error;
  // Best effort: the old photo is no longer referenced.
  if (imageUri && currentImagePath) {
    await supabase.storage.from("product-images").remove([currentImagePath]);
  }
}

// Owner only. The product is hidden everywhere; past sales keep their history.
export async function archiveProduct(id) {
  const { error } = await supabase.rpc("archive_product", { p_id: id });
  if (error) throw error;
}

// delta > 0 adds a batch (expiry required); delta < 0 removes, earliest expiry first.
export async function adjustStock({ productId, delta, reason, expiry }) {
  const { error } = await supabase.rpc("adjust_stock", {
    p_product_id: productId,
    p_delta: delta,
    p_reason: reason,
    p_expiry: expiry ?? null,
  });
  if (error) throw error;
}
