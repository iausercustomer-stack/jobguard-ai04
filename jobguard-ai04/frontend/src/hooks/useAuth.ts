import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { AuthUser } from '../types';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session?.user && session.access_token) {
          setUser({
            id: session.user.id,
            email: session.user.email || 'user@authenticated',
            accessToken: session.access_token,
          });
        }
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && session.access_token) {
        setUser({
          id: session.user.id,
          email: session.user.email || 'user@authenticated',
          accessToken: session.access_token,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    if (!supabase) {
      setAuthError(
        'Supabase authentication is not configured in frontend environment variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).'
      );
      return false;
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setAuthError(error.message);
      return false;
    }
    if (data.session?.user) {
      setUser({
        id: data.session.user.id,
        email: data.session.user.email || email.trim(),
        accessToken: data.session.access_token,
      });
    }
    return true;
  };

  const signUp = async (
    email: string,
    password: string
  ): Promise<{ ok: boolean; message?: string }> => {
    setAuthError(null);
    if (!supabase) {
      setAuthError(
        'Supabase authentication is not configured in frontend environment variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).'
      );
      return { ok: false };
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) {
      setAuthError(error.message);
      return { ok: false };
    }
    if (data.session?.user) {
      setUser({
        id: data.session.user.id,
        email: data.session.user.email || email.trim(),
        accessToken: data.session.access_token,
      });
      return { ok: true, message: 'Account created and signed in.' };
    }
    return {
      ok: true,
      message:
        'Sign-up submitted! Please check your email inbox for a confirmation link if email verification is enabled on your Supabase project.',
    };
  };

  const signOut = async (): Promise<void> => {
    setAuthError(null);
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  return {
    user,
    loading,
    authError,
    setAuthError,
    signIn,
    signUp,
    signOut,
    isSupabaseConfigured,
  };
}
