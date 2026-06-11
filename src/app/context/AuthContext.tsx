import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signUp: (
    fullName: string,
    email: string,
    password: string,
  ) => Promise<{
    success: boolean;
    requiresConfirmation?: boolean;
    error?: string;
  }>;
  sendPasswordReset: (
    email: string,
  ) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<{ success: boolean; error?: string }>;
  updateUserName: (
    fullName: string,
  ) => Promise<{ success: boolean; error?: string }>;
  updateUserEmail: (
    newEmail: string,
    currentPassword: string,
  ) => Promise<{ success: boolean; error?: string }>;
  updateUserMetadata: (
    metadata: Record<string, unknown>,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
  signInWithEmail: async () => ({ success: false }),
  signInWithGoogle: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  sendPasswordReset: async () => ({ success: false }),
  updatePassword: async () => ({ success: false }),
  updateUserName: async () => ({ success: false }),
  updateUserEmail: async () => ({ success: false }),
  updateUserMetadata: async () => ({ success: false }),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const lastLoggedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (!error) {
        setSession(data.session);
      }
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setLoading(false);

      if (
        event === "SIGNED_IN" &&
        nextSession?.access_token &&
        lastLoggedTokenRef.current !== nextSession.access_token
      ) {
        console.log("JWT token:", nextSession.access_token);
        lastLoggedTokenRef.current = nextSession.access_token;
      }

      if (event === "SIGNED_OUT") {
        lastLoggedTokenRef.current = null;
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.session) {
      return { success: false, error: error?.message ?? "Unable to sign in." };
    }

    return { success: true };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const signUp = async (fullName: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      requiresConfirmation: !data.session,
    };
  };

  const sendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    // Reauthenticate user with current password first
    const user = session?.user;
    if (!user?.email) {
      return { success: false, error: "User not authenticated" };
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      return { success: false, error: "Current password is incorrect" };
    }

    // Now update to new password
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const updateUserName = async (fullName: string) => {
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName.trim(),
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const updateUserEmail = async (newEmail: string, currentPassword: string) => {
    // Verify current password first
    const user = session?.user;
    if (!user?.email) {
      return { success: false, error: "User not authenticated" };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      return { success: false, error: "Current password is incorrect" };
    }

    // Update email
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const updateUserMetadata = async (metadata: Record<string, unknown>) => {
    const { error } = await supabase.auth.updateUser({
      data: metadata,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value = useMemo(
    () => ({
      session,
      loading,
      signInWithEmail,
      signInWithGoogle,
      signUp,
      sendPasswordReset,
      updatePassword,
      updateUserName,
      updateUserEmail,
      updateUserMetadata,
      logout,
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
