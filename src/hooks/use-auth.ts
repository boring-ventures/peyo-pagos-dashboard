import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign in with email and password
   * @param email User's email
   * @param hashedPassword Password that has been hashed client-side
   */
  const signIn = async (email: string, hashedPassword: string) => {
    // The password has already been hashed client-side
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: hashedPassword,
    });

    if (error) throw error;

    if (data?.session) {
      setSession(data.session);
      setUser(data.session.user);
      await supabase.auth.setSession(data.session);
      return data.session;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
    router.push("/");
  };

  return {
    user,
    session,
    loading,
    signIn,
    signOut,
  };
}
