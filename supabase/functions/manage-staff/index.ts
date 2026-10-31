// Owner-only account management. The app cannot create users or change
// passwords itself because that needs the service key, which only exists
// here on the server. Every call is checked: the caller must be a signed-in
// owner (public.is_owner()).
//
// POST body: { action: "create" | "set_password" | "set_active", ... }
//   create        { email, password, full_name }
//   set_password  { user_id, password }
//   set_active    { user_id, active }   (deactivated users cannot sign in again)

import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });

  const { data: isOwner, error: ownerError } = await caller.rpc("is_owner");
  if (ownerError || isOwner !== true) return json({ error: "forbidden" }, 403);
  const { data: me } = await caller.auth.getUser();

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_request" }, 400);
  }

  const password = String(body.password ?? "");

  switch (body.action) {
    case "create": {
      const email = String(body.email ?? "").trim().toLowerCase();
      const fullName = String(body.full_name ?? "").trim();
      if (!EMAIL.test(email)) return json({ error: "invalid_email" }, 400);
      if (password.length < 8) return json({ error: "weak_password" }, 400);
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: fullName ? { full_name: fullName } : {},
      });
      if (error) {
        const exists = error.code === "email_exists" || /already|registered/i.test(error.message);
        return json({ error: exists ? "email_exists" : "create_failed" }, exists ? 409 : 400);
      }
      return json({ id: data.user.id });
    }

    case "set_password": {
      const userId = String(body.user_id ?? "");
      if (!userId) return json({ error: "invalid_request" }, 400);
      if (password.length < 8) return json({ error: "weak_password" }, 400);
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) return json({ error: "update_failed" }, 400);
      return json({ ok: true });
    }

    case "set_active": {
      const userId = String(body.user_id ?? "");
      const active = body.active === true;
      if (!userId) return json({ error: "invalid_request" }, 400);
      if (userId === me.user?.id) return json({ error: "self_action" }, 400);
      const { data: target } = await admin
        .from("profiles").select("role").eq("id", userId).single();
      if (!target) return json({ error: "not_found" }, 404);
      // Demote an owner first (set_user_role) before deactivating them.
      if (!active && target.role === "owner") return json({ error: "target_is_owner" }, 400);
      const { error } = await admin.auth.admin.updateUserById(userId, {
        ban_duration: active ? "none" : "876000h",
      });
      if (error) return json({ error: "update_failed" }, 400);
      await admin.from("profiles").update({ active }).eq("id", userId);
      return json({ ok: true });
    }

    default:
      return json({ error: "invalid_request" }, 400);
  }
});
