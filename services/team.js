import { supabase } from "@/lib/supabase";

export async function fetchTeam() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, active")
    .order("role")
    .order("full_name");
  if (error) throw error;
  return data;
}

// Accounts are managed by the manage-staff edge function (owner only).
async function callManageStaff(body) {
  const { data, error } = await supabase.functions.invoke("manage-staff", { body });
  if (error) {
    // The function answers { error: "<code>" } with an HTTP error status.
    let code = error.message;
    try {
      code = (await error.context.json()).error ?? code;
    } catch {
      // network failure or non-JSON answer: keep the original message
    }
    throw new Error(code);
  }
  return data;
}

export const createStaff = ({ email, password, fullName }) =>
  callManageStaff({ action: "create", email, password, full_name: fullName });

export const setPassword = (userId, password) =>
  callManageStaff({ action: "set_password", user_id: userId, password });

export const setActive = (userId, active) =>
  callManageStaff({ action: "set_active", user_id: userId, active });

export async function setRole(userId, role) {
  const { error } = await supabase.rpc("set_user_role", {
    p_user_id: userId,
    p_role: role,
  });
  if (error) throw error;
}
