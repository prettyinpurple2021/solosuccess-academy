/**
 * @file useAuth.ts — Authentication Hook
 * 
 * Central authentication hook that manages the entire auth lifecycle:
 * - Session state (logged in/out, loading)
 * - User profile data from the `profiles` table
 * - Sign up, sign in, sign out, password reset
 * - Profile updates
 * - Session timeout (auto-logout after 30 min inactivity)
 * 
 * HOW AUTH WORKS IN THIS APP:
 * 1. Supabase handles auth (email/password with email verification)
 * 2. On sign up, a database trigger auto-creates a `profiles` row
 * 3. This hook listens for auth state changes and fetches the profile
 * 4. Components use `useAuth()` to check `isAuthenticated` and get `user`
 * 
 * SESSION TIMEOUT:
 * - After 30 minutes of no mouse/keyboard/touch activity, the user
 *   is automatically signed out for security
 * - A warning toast appears 1 minute before forced logout
 * - Any user interaction resets the timer
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/** Shape of the authentication state. */
export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/** User profile data from the `profiles` database table. */
export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

// ──────────────────────────────────────────────
// SESSION TIMEOUT CONFIGURATION
// ──────────────────────────────────────────────
/** Timeout duration: 30 minutes of inactivity (in ms) */
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

/** Warning before timeout: show toast 1 minute before logout */
const SESSION_WARNING_MS = SESSION_TIMEOUT_MS - 60 * 1000;

/** Events that count as "user activity" and reset the timer */
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const;

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });
  
  const [profile, setProfile] = useState<Profile | null>(null);

  // Refs for session timeout timers
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasWarnedRef = useRef(false);

  /** Fetch user profile from the `profiles` table. */
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, []);

  /** Force sign out (used by session timeout). */
  const forceSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during forced sign out:', error);
    }
  }, []);

  /**
   * Reset the inactivity timer.
   * Called on every user interaction (mouse, keyboard, touch, scroll).
   */
  const resetInactivityTimer = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    hasWarnedRef.current = false;

    // Only set timers if user is authenticated
    if (!authState.isAuthenticated) return;

    // Set warning timer (fires 1 min before logout)
    warningRef.current = setTimeout(() => {
      if (!hasWarnedRef.current) {
        hasWarnedRef.current = true;
        // Dispatch a custom event that the Toaster can pick up
        window.dispatchEvent(new CustomEvent('session-timeout-warning'));
      }
    }, SESSION_WARNING_MS);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      forceSignOut();
    }, SESSION_TIMEOUT_MS);
  }, [authState.isAuthenticated, forceSignOut]);

  // Set up activity listeners for session timeout
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    // Start the inactivity timer
    resetInactivityTimer();

    // Listen for user activity
    const handleActivity = () => resetInactivityTimer();
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true });
    }

    return () => {
      // Clean up listeners and timers
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity);
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [authState.isAuthenticated, resetInactivityTimer]);

  useEffect(() => {
    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState({
          user: session?.user ?? null,
          session,
          isLoading: false,
          isAuthenticated: !!session?.user,
        });

        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
          // Fire welcome email on first verified sign-in. The lifecycle
          // ledger's UNIQUE (user_id, course_id, kind) constraint makes
          // this safe to call repeatedly — only the first one wins.
          if (event === 'SIGNED_IN') {
            setTimeout(() => sendWelcomeEmailOnce(session.user), 0);
          }
        } else {
          setProfile(null);
        }
      }
    );

    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState({
        user: session?.user ?? null,
        session,
        isLoading: false,
        isAuthenticated: !!session?.user,
      });

      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  /** Create a new account with email and password. */
  const signUp = async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName },
      },
    });

    if (error) throw error;
    return data;
  };

  /** Sign in with existing email and password. */
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  /** Sign out the current user. */
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  /** Update the user's profile in the `profiles` table. */
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!authState.user) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', authState.user.id)
      .select()
      .single();

    if (error) throw error;
    setProfile(data);
    return data;
  };

  /** Send a password reset email. */
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  };

  return {
    ...authState,
    profile,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    refetchProfile: () => authState.user && fetchProfile(authState.user.id),
  };
}
