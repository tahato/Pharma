import { supabase } from "@/lib/supabase";
import { fetchSalesSummary } from "@/services/sales";
import { EXPIRY_ALERT_DAYS, localDateString } from "@/tools/stock";

export async function fetchDashboard(expiryDays = EXPIRY_ALERT_DAYS) {
  const soon = new Date();
  soon.setDate(soon.getDate() + expiryDays);
  const soonDate = localDateString(soon);

  const [sales, low, expiring, watch] = await Promise.all([
    fetchSalesSummary(0),
    supabase.from("product_stock").select("id", { count: "exact", head: true }).eq("is_low", true),
    supabase
      .from("product_stock")
      .select("id", { count: "exact", head: true })
      .lte("earliest_expiry", soonDate),
    supabase
      .from("product_stock")
      .select("*")
      .or(`is_low.eq.true,earliest_expiry.lte.${soonDate}`)
      .order("name")
      .limit(5),
  ]);
  for (const r of [low, expiring, watch]) if (r.error) throw r.error;

  return {
    todayTotal: sales.total,
    todayCount: sales.count,
    lowCount: low.count ?? 0,
    expiringCount: expiring.count ?? 0,
    watch: watch.data,
  };
}
