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

function periodStart(days) {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - days);
  return from.toISOString();
}

// Totals are computed by the database, so they are right even when there are
// more sales than the list below loads.
export async function fetchSalesSummary(days) {
  const { data, error } = await supabase
    .rpc("sales_summary", { p_from: periodStart(days) })
    .single();
  if (error) throw error;
  return { count: Number(data.sales_count), total: Number(data.total) };
}

export const SALES_LIST_LIMIT = 200;

// days = 0 means today only; 6 = the last 7 days including today.
// The list shows the latest SALES_LIST_LIMIT sales of the period.
export async function fetchSales(days) {
  const [summary, list] = await Promise.all([
    fetchSalesSummary(days),
    supabase
      .from("sales")
      .select("id, number, total, created_at, sale_items(quantity)")
      .gte("created_at", periodStart(days))
      .order("created_at", { ascending: false })
      .limit(SALES_LIST_LIMIT),
  ]);
  if (list.error) throw list.error;
  return {
    summary,
    sales: list.data.map((s) => ({
      ...s,
      itemCount: s.sale_items.reduce((sum, i) => sum + i.quantity, 0),
    })),
  };
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
