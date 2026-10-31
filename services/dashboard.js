import { supabase } from "@/lib/supabase";
import { EXPIRY_ALERT_DAYS, localDateString } from "@/tools/stock";

export async function fetchDashboard() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const soon = new Date();
  soon.setDate(soon.getDate() + EXPIRY_ALERT_DAYS);
  const soonDate = localDateString(soon);

  const [sales, low, expiring, watch] = await Promise.all([
    supabase.from("sales").select("total").gte("created_at", start.toISOString()),
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
  for (const r of [sales, low, expiring, watch]) if (r.error) throw r.error;

  return {
    todayTotal: sales.data.reduce((sum, s) => sum + Number(s.total), 0),
    todayCount: sales.data.length,
    lowCount: low.count ?? 0,
    expiringCount: expiring.count ?? 0,
    watch: watch.data,
  };
}
