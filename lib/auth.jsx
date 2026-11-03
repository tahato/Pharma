import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext(null);

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) queryClient.clear();
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  const profile = useQuery({
    queryKey: ["profile", session?.user.id],
    queryFn: () => fetchProfile(session.user.id),
    enabled: !!session,
  });

  const value = {
    session,
    loading,
    profile: profile.data ?? null,
    isOwner: profile.data?.role === "owner",
    signIn: (email, password) =>
      supabase.auth.signInWithPassword({ email, password }),
    // The database trigger makes the first account the owner and later ones active staff.
    signUp: (email, password, fullName) =>
      supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } }),
    signOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
