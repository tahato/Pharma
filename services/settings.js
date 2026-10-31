import { supabase } from "@/lib/supabase";

export async function fetchSettings() {
  const { data, error } = await supabase
    .from("app_settings")
    .select("expiry_alert_days")
    .single();
  if (error) throw error;
  return { expiryDays: data.expiry_alert_days };
}

// Owner only (staff updates match no row).
export async function updateExpiryDays(days) {
  const { data, error } = await supabase
    .from("app_settings")
    .update({ expiry_alert_days: days })
    .eq("id", true)
    .select();
  if (error) throw error;
  if (data.length === 0) {
    throw Object.assign(new Error("forbidden"), { code: "42501" });
  }
}
