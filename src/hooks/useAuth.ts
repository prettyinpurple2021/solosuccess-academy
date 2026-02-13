/**
 * @file useAuth.ts — Authentication Hook
 * 
 * Central authentication hook that manages the entire auth lifecycle:
 * - Session state (logged in/out, loading)
 * - User profile data from the `profiles` table
 * - Sign up, sign in, sign out, password reset
 * - Profile updates
 * 
 * HOW AUTH WORKS IN THIS APP:
 * 1. Supabase handles auth (email/password with email verification)
 * 2. On sign up, a database trigger auto-creates a `profiles` row
 * 3. This hook listens for auth state changes and fetches the profile
 * 4. Components use `useAuth()` to check `isAuthenticated` and get `user`
 * 
 * IMPORTANT PATTERNS:
 * - `onAuthStateChange` fires on login, logout, and token refresh
 * - `getSession()` is called once on mount to restore existing sessions
 * - Profile fetch uses setTimeout(0) to avoid race conditions with auth state
 * 
 * PRODUCTION TODO:
 * - Add OAuth providers (Google, GitHub) for social login
 * - Implement session timeout / forced logout for security
 * - Add rate limiting on the client side for auth attempts
 * - Consider using React Context instead of calling useAuth() in many places
 *   (currently each call creates its own state — wasteful)
 */
import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Shape of the authentication state.
 * `isLoading` is true during initial session check — used to show loading spinners.
 */
export interface AuthState {
  user: User | null;          // Supabase auth user (contains email, id, metadata)
  session: Session | null;    // Contains access_token, refresh_token
  isLoading: boolean;         // True during initial auth check
  isAuthenticated: boolean;   // Shorthand for !!session?.user
}

/**
 * User profile data from the `profiles` database table.
 * This is separate from the auth user — it stores display preferences.
 * 
 * NOTE: The DB also has `email_notifications`, `course_updates`, and
 * `discussion_replies` columns not reflected here. Consider adding them
 * if you need notification preferences in the UI.
 */
export interface Profile {
  id: string;                 // Same as auth.users.id (1:1 relationship)
  display_name: string | null;
  avatar_url: string | null;  // URL in Supabase Storage 'avatars' bucket
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export function useAuth() {
  // Auth state: tracks whether user is logged in and loading status
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,        // Start as loading — will flip to false after session check
    isAuthenticated: false,
  });
  
  // Profile state: user's display info from the profiles table
  const [profile, setProfile] = useState<Profile | null>(null);

  /**
   * Fetch the user's profile from the `profiles` table.
   * Uses `maybeSingle()` instead of `single()` because the profile
   * might not exist yet (e.g., if the DB trigger hasn't run yet).
   */
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

  useEffect(() => {
    // ── Step 1: Subscribe to auth state changes ──
    // This fires on login, logout, token refresh, and password recovery.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState({
          user: session?.user ?? null,
          session,
          isLoading: false,
          isAuthenticated: !!session?.user,
        });

        if (session?.user) {
          // setTimeout(0) avoids a Supabase race condition where
          // the profile query might fire before the session is fully ready
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
        }
      }
    );

    // ── Step 2: Check for existing session on mount ──
    // If the user refreshed the page, their session is in localStorage.
    // This restores it without requiring re-login.
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

    // Cleanup: unsubscribe from auth changes when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  /**
   * Create a new account with email and password.
   * 
   * @param email - User's email address
   * @param password - Must meet Supabase password requirements
   * @param displayName - Optional display name (stored in auth metadata)
   * 
   * NOTE: Email verification is required by default. The user will
   * receive a confirmation email and must click the link before they
   * can sign in. Set `emailRedirectTo` to your production URL.
   */
  const signUp = async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          display_name: displayName,  // Stored in auth.users.raw_user_meta_data
        },
      },
    });

    if (error) throw error;
    return data;
  };

  /**
   * Sign in with existing email and password.
   * Throws an error if credentials are wrong or email is not verified.
   */
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  /** Sign out the current user. Clears session from localStorage. */
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  /**
   * Update the user's profile in the `profiles` table.
   * Only updates the fields you pass in (partial update).
   * 
   * @param updates - Partial profile fields to update
   * @returns The updated profile data
   */
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

  /**
   * Send a password reset email.
   * The user will receive a link that redirects to /reset-password.
   * 
   * PRODUCTION TODO: Create the /reset-password page to handle the
   * password update flow (currently this route doesn't exist).
   */
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  };

  return {
    ...authState,             // user, session, isLoading, isAuthenticated
    profile,                  // User's display profile
    signUp,                   // Create new account
    signIn,                   // Login with email/password
    signOut,                  // Logout
    updateProfile,            // Update profile fields
    resetPassword,            // Send password reset email
    refetchProfile: () => authState.user && fetchProfile(authState.user.id),
  };
}
