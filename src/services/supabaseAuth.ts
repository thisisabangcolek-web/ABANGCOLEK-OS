/**
 * Supabase Authentication Service & Hook for ABANGCOLEK-OS
 * Project Ref: bktksvhcgszaoqkdyhil
 */

import { useState, useEffect, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export interface SupabaseAuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
  signInWithOtp: (email: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  quickStaffSignIn: (role?: 'hq_admin' | 'stockist_kt' | 'crew_toppen') => Promise<void>;
}

export function useSupabaseAuth(): SupabaseAuthState {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      if (error) {
        setError(error.message);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    }).catch(err => {
      if (!mounted) return;
      setError(err?.message || 'Error fetching Supabase session');
      setLoading(false);
    });

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (!mounted) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
        setError(null);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      setUser(data.user);
      setSession(data.session);
    }
    setLoading(false);
    return { user: data.user, error };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else {
      setUser(data.user);
      setSession(data.session);
    }
    setLoading(false);
    return { user: data.user, error };
  }, []);

  const signInWithOtp = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setError(error.message);
    setLoading(false);
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError(error.message);
    } else {
      setUser(null);
      setSession(null);
    }
    setLoading(false);
    return { error };
  }, []);

  /**
   * Fast Staff session simulation for instant testing of Abang Colek roles
   */
  const quickStaffSignIn = useCallback(async (role: 'hq_admin' | 'stockist_kt' | 'crew_toppen' = 'hq_admin') => {
    setLoading(true);
    const mockEmail = role === 'hq_admin' 
      ? 'thisisabangcolek@gmail.com' 
      : role === 'stockist_kt' 
      ? 'stokis.terengganu@abangcolek.my' 
      : 'kru.toppen@abangcolek.my';

    // Try signing in with default password, or create an active operational session object
    const { data: _data, error } = await supabase.auth.signInWithPassword({
      email: mockEmail,
      password: 'AbangColekOSPassword2026!'
    });

    if (error) {
      // If user not registered yet in Auth schema, set local mock session with user email
      setUser({
        id: `usr_${role}_001`,
        app_metadata: { provider: 'email', role },
        user_metadata: { 
          full_name: role === 'hq_admin' ? 'Abang Colek HQ Master' : role === 'stockist_kt' ? 'Kak Mas (Stokis KT)' : 'Kru Gerai Toppen',
          role 
        },
        aud: 'authenticated',
        email: mockEmail,
        created_at: new Date().toISOString()
      } as any);
    }
    setLoading(false);
  }, []);

  return {
    user,
    session,
    loading,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithOtp,
    signOut,
    quickStaffSignIn
  };
}
