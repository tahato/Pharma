import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { fetchSettings } from "@/services/settings";
import { EXPIRY_ALERT_DAYS } from "@/tools/stock";

// Shared settings (set by the owner). Falls back to the default until loaded.
export function useSettings() {
  const { session } = useAuth();
  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    enabled: !!session,
    staleTime: 5 * 60 * 1000,
  });
  return { expiryDays: data?.expiryDays ?? EXPIRY_ALERT_DAYS };
}
