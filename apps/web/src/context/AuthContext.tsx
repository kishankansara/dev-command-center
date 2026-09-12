'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null } | void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null; data: unknown }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // If Supabase is not configured (mock/local mode), use local secure session simulation
    if (!isSupabaseConfigured) {
      const storedDevSession = typeof window !== 'undefined' ? localStorage.getItem('dev_command_center_session') : null;
      if (storedDevSession) {
        try {
          const parsedUser = JSON.parse(storedDevSession) as User;
          setUser(parsedUser);
        } catch {
          localStorage.removeItem('dev_command_center_session');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
      return;
    }

    // Initialize real Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured) {
      const devGoogleUser = {
        id: 'user-google-dev',
        email: 'developer@commandcenter.io',
        app_metadata: { provider: 'google' },
        user_metadata: { full_name: 'Lead Developer (Dev Mode)' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;
      if (typeof window !== 'undefined') {
        localStorage.setItem('dev_command_center_session', JSON.stringify(devGoogleUser));
      }
      setUser(devGoogleUser);
      return;
    }
    let origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    if (origin.includes('0.0.0.0')) {
      origin = origin.replace('0.0.0.0', 'localhost');
    }
    const redirectUrl = `${origin}/auth/callback`;
    console.log('[OAuth] Initiating Google sign-in with redirectTo:', redirectUrl);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    if (error) {
      console.error('[OAuth] signInWithOAuth error:', error);
      return { error: new Error(error.message) };
    }
    if (data?.url && typeof window !== 'undefined') {
      window.location.href = data.url;
    }
    return { error: null };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      if (password.length < 6) {
        return { error: new Error('Password must be at least 6 characters') };
      }
      const devEmailUser = {
        id: (email.toLowerCase() === 'developer@devcommandcenter.local' || email.toLowerCase() === 'developer@commandcenter.io')
          ? 'user-primary-dev'
          : `user-${email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: email.toLowerCase(),
        app_metadata: { provider: 'email' },
        user_metadata: { full_name: email.split('@')[0] },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;
      if (typeof window !== 'undefined') {
        localStorage.setItem('dev_command_center_session', JSON.stringify(devEmailUser));
      }
      setUser(devEmailUser);
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      if (password.length < 6) {
        return { error: new Error('Password must be at least 6 characters'), data: null };
      }
      const devEmailUser = {
        id: (email.toLowerCase() === 'developer@devcommandcenter.local' || email.toLowerCase() === 'developer@commandcenter.io')
          ? 'user-primary-dev'
          : `user-${email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: email.toLowerCase(),
        app_metadata: { provider: 'email' },
        user_metadata: { full_name: email.split('@')[0] },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;
      if (typeof window !== 'undefined') {
        localStorage.setItem('dev_command_center_session', JSON.stringify(devEmailUser));
      }
      setUser(devEmailUser);
      return { error: null, data: devEmailUser };
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
    return { error: error ? new Error(error.message) : null, data };
  }, []);

  const signOut = useCallback(async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dev_command_center_session');
    }
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
