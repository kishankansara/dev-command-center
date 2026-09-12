'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Terminal, Shield, Mail, Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { isSupabaseConfigured } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const { toast } = useToast();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientOrigin, setClientOrigin] = useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setClientOrigin(window.location.origin);
    }
  }, []);

  // If already logged in or if tokens exist in URL hash fragment, redirect to dashboard
  React.useEffect(() => {
    if (!isLoading && user) {
      router.replace('/');
      return;
    }

    // If OAuth returned tokens in the URL hash fragment (#access_token=...)
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      // Supabase client automatically parses hash tokens; give it a moment to fire onAuthStateChange
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        import('@/lib/supabaseClient').then(({ supabase }) => {
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          }).then(({ data, error }) => {
            if (!error && data.session) {
              window.history.replaceState(null, '', window.location.pathname);
              router.replace('/');
            }
          });
        });
      }
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast('Please provide both email and password', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        const { error } = await signUpWithEmail(email, password);
        if (error) {
          toast(error.message, 'error');
        } else {
          toast('Account authenticated!', 'success');
          router.push('/');
        }
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          toast(error.message, 'error');
        } else {
          toast('Successfully signed in!', 'success');
          router.push('/');
        }
      }
    } catch {
      toast('Authentication failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      if (result?.error) {
        toast(result.error.message, 'error');
        return;
      }
      if (!isSupabaseConfigured) {
        toast('Signed in via Dev Google OAuth!', 'success');
        router.push('/');
      }
    } catch (err: any) {
      toast(err?.message || 'Google authentication failed', 'error');
    }
  };

  const handleQuickTestLogin = async () => {
    console.log('[QuickTestLogin] Button clicked');
    setIsSubmitting(true);
    const testEmail = 'test1@gmail.com';
    // Supabase Auth enforces minimum 6 characters for passwords by default
    const testPassword = '123456';
    try {
      toast('Authenticating test developer...', 'info');
      
      // First attempt direct sign-in
      const { error: signInErr } = await signInWithEmail(testEmail, testPassword);
      if (!signInErr) {
        toast('Logged in as Test Developer! Entering dashboard...', 'success');
        router.replace('/');
        return;
      }

      console.warn('[QuickLogin] Sign-in failed:', signInErr.message, '- Attempting auto registration...');

      // If sign-in failed, attempt sign-up
      const { error: signUpErr, data: signUpData } = await signUpWithEmail(testEmail, testPassword);
      if (!signUpErr) {
        toast('Test developer provisioned! Entering dashboard...', 'success');
        router.replace('/');
        return;
      }

      const detailedMsg = `Sign-in: ${signInErr.message}\nSign-up: ${signUpErr.message}`;
      console.error('[QuickLogin] Failed:', detailedMsg);
      toast(`Login Error: ${signInErr.message}`, 'error');
      if (typeof window !== 'undefined') {
        window.alert(`Authentication Details:\n${detailedMsg}`);
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to authenticate test developer';
      console.error('[QuickLogin] Exception:', err);
      toast(msg, 'error');
      if (typeof window !== 'undefined') {
        window.alert(`Exception: ${msg}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-command-950">
      <div className="w-full max-w-md bg-command-900 border border-command-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Top Gradient Stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-1">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              DevCommand<span className="text-emerald-400">Center</span>
            </h1>
            <p className="text-xs text-slate-400">
              Multi-Tenant Context & Zero-Knowledge Vault
            </p>
            {clientOrigin && (
              <p className="text-[10px] font-mono text-emerald-400/80 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                Callback Host: {clientOrigin}/auth/callback
              </p>
            )}
          </div>

          {!isSupabaseConfigured && (
            <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Local development mode active. Click any action to enter dashboard.</span>
            </div>
          )}

          {/* 1-Click Instant Test Developer Login (No OAuth / Zero Redirects) */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleQuickTestLogin}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/25 border border-emerald-400/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <Shield className="w-4 h-4 text-emerald-100" />
            <span>⚡ Sign in as Test Developer</span>
          </button>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-command-850 hover:bg-command-800 border border-command-border text-sm font-medium text-slate-200 shadow-sm transition-all hover:border-command-border-active"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-command-border w-full" />
            <span className="bg-command-900 px-3 text-[11px] font-mono text-slate-500 uppercase">
              Or email
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@domain.com"
                  className="w-full pl-9 pr-3 py-2 bg-command-950 border border-command-border rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-command-950 border border-command-border rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-700/20 disabled:opacity-50 transition-all mt-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : isSignUp ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Toggle Sign In / Sign Up */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Create one"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-command-950 border-t border-command-border text-center">
          <p className="text-[11px] font-mono text-slate-500">
            Strict Supabase RLS isolation enforced per auth.uid()
          </p>
        </div>
      </div>
    </div>
  );
}
