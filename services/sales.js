import { supabase } from "@/lib/supabase";

// items: [{ productId, qty }]. saleId makes a retry safe: the same id never
// creates a second sale.
export async function createSale(items, saleId) {
  const { data, error } = await supabase.rpc("create_sale", {
    p_items: items.map((i) => ({ product_id: i.productId, quantity: i.qty })),
    p_sale_id: saleId,
  });
  if (error) throw error;
  return data;
}

// days = 0 means today only; 6 = the last 7 days including today.
export async function fetchSales(days) {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - days);
  const { data, error } = await supabase
    .from("sales")
    .select("id, number, total, created_at, sale_items(quantity)")
    .gte("created_at", from.toISOString())
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data.map((s) => ({
    ...s,
    itemCount: s.sale_items.reduce((sum, i) => sum + i.quantity, 0),
  }));
}

export async function fetchSale(id) {
  const { data, error } = await supabase
    .from("sales")
    .select("id, number, total, created_at, sale_items(quantity, unit_price, products(name))")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}
