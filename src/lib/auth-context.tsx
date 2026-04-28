"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import { trackEvent } from "@/lib/analytics";
import { registerPushNotifications } from "@/lib/push-notifications";
import { isNative, openOAuthUrl, registerDeepLinkHandler } from "@/lib/native";

const NATIVE_OAUTH_REDIRECT = "app.dropfit.drop://auth/callback";

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_color: string;
  avatar_url: string | null;
  created_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: SupabaseUser | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, displayName: string, avatarColor: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithApple: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  deleteAccount: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) setProfile(data);
    return data;
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(() => {
          registerPushNotifications(session.user.id);
        }).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
          registerPushNotifications(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    const cleanupDeepLink = registerDeepLinkHandler(async (url) => {
      try {
        const parsed = new URL(url);
        const code = parsed.searchParams.get("code");
        const errorParam = parsed.searchParams.get("error_description") || parsed.searchParams.get("error");
        if (errorParam) {
          window.location.assign(`/auth?error=${encodeURIComponent(errorParam)}`);
          return;
        }
        if (!code) return;
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          window.location.assign(`/auth?error=${encodeURIComponent(error.message)}`);
        } else {
          window.location.assign("/");
        }
      } catch {
        // Ignore malformed deep links
      }
    });

    return () => {
      subscription.unsubscribe();
      cleanupDeepLink();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signUp = async (
    email: string,
    password: string,
    username: string,
    displayName: string,
    avatarColor: string
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: displayName,
          avatar_color: avatarColor,
        },
      },
    });
    if (error) return { error: error.message };
    trackEvent("user_signup", { username });
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };
    trackEvent("user_login");
    return { error: null };
  };

  const oauthSignIn = async (provider: "google" | "apple") => {
    if (isNative()) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: NATIVE_OAUTH_REDIRECT,
          skipBrowserRedirect: true,
        },
      });
      if (error) return { error: error.message };
      if (!data?.url) return { error: "Failed to start OAuth flow" };
      await openOAuthUrl(data.url);
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`,
      },
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signInWithGoogle = async () => {
    const result = await oauthSignIn("google");
    if (!result.error) trackEvent("user_login_google");
    return result;
  };

  const signInWithApple = async () => {
    const result = await oauthSignIn("apple");
    if (!result.error) trackEvent("user_login_apple");
    return result;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/reset`,
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const deleteAccount = async () => {
    if (!user) return { error: "Not signed in" };
    try {
      await supabase.from("workouts").delete().eq("user_id", user.id);
      await supabase.from("analytics_events").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("id", user.id);
      trackEvent("user_account_deleted");
      await supabase.auth.signOut();
      setProfile(null);
      return { error: null };
    } catch {
      return { error: "Failed to delete account. Please try again." };
    }
  };

  const signOut = async () => {
    trackEvent("user_logout");
    await supabase.auth.signOut();
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signInWithApple,
        resetPassword,
        deleteAccount,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
