/**
 * @file useMfa.ts — Two-Factor Authentication (TOTP) Hook
 *
 * Wraps Supabase's MFA APIs for TOTP (time-based one-time passwords)
 * via authenticator apps like Google Authenticator, Authy, 1Password.
 *
 * FLOW:
 * 1. enroll()       — start enrollment, returns QR + secret to display
 * 2. verify()       — confirm with a 6-digit code from the app
 * 3. listFactors()  — show enrolled factors in settings
 * 4. unenroll()     — remove a factor
 * 5. challenge() + verifyChallenge() — used at sign-in for AAL2 step-up
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MfaFactor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: 'verified' | 'unverified';
  created_at: string;
}

export function useMfa() {
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aal, setAal] = useState<{
    currentLevel: string | null;
    nextLevel: string | null;
  }>({ currentLevel: null, nextLevel: null });

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [{ data: f }, { data: a }] = await Promise.all([
        supabase.auth.mfa.listFactors(),
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      ]);
      setFactors((f?.totp ?? []) as MfaFactor[]);
      setAal({
        currentLevel: a?.currentLevel ?? null,
        nextLevel: a?.nextLevel ?? null,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Begin TOTP enrollment — returns { factorId, qr, secret } to render. */
  const enroll = useCallback(async (friendlyName = 'Authenticator App') => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `${friendlyName} ${Date.now()}`,
    });
    if (error) throw error;
    return {
      factorId: data.id,
      qr: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
    };
  }, []);

  /** Verify a 6-digit code to finish enrollment. */
  const verifyEnrollment = useCallback(async (factorId: string, code: string) => {
    const { data: chal, error: chalErr } = await supabase.auth.mfa.challenge({ factorId });
    if (chalErr) throw chalErr;
    const { error: verErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: chal.id,
      code,
    });
    if (verErr) throw verErr;
    await refresh();
  }, [refresh]);

  /** Remove an enrolled factor. */
  const unenroll = useCallback(async (factorId: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) throw error;
    await refresh();
  }, [refresh]);

  /** At sign-in: create a challenge for an existing factor. */
  const challenge = useCallback(async (factorId: string) => {
    const { data, error } = await supabase.auth.mfa.challenge({ factorId });
    if (error) throw error;
    return data.id;
  }, []);

  /** Verify a sign-in challenge with the user's current TOTP code. */
  const verifyChallenge = useCallback(
    async (factorId: string, challengeId: string, code: string) => {
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });
      if (error) throw error;
      await refresh();
    },
    [refresh],
  );

  /** Generate fresh recovery codes (returns plaintext once). */
  const generateRecoveryCodes = useCallback(async (): Promise<string[]> => {
    const { data, error } = await supabase.rpc('generate_mfa_recovery_codes');
    if (error) throw error;
    return (data as { codes: string[] })?.codes ?? [];
  }, []);

  /** Consume a recovery code (used during recovery flows). */
  const consumeRecoveryCode = useCallback(async (code: string) => {
    const { data, error } = await supabase.rpc('consume_mfa_recovery_code', { _code: code });
    if (error) throw error;
    return data as boolean;
  }, []);

  /**
   * Confirm a recovery code and return rich metadata about the acceptance,
   * so the UI can display *which* code was used (masked) and how many
   * codes the user has remaining.
   */
  const confirmRecoveryCode = useCallback(
    async (
      code: string,
    ): Promise<
      | { accepted: false }
      | { accepted: true; masked: string; usedAt: string; remaining: number }
    > => {
      const { data, error } = await supabase.rpc('confirm_mfa_recovery_code', { _code: code });
      if (error) throw error;
      const payload = data as {
        accepted: boolean;
        masked?: string;
        used_at?: string;
        remaining?: number;
      };
      if (!payload?.accepted) return { accepted: false };
      return {
        accepted: true,
        masked: payload.masked ?? '••••••-••••',
        usedAt: payload.used_at ?? new Date().toISOString(),
        remaining: payload.remaining ?? 0,
      };
    },
    [],
  );

  return {
    factors,
    isLoading,
    aal,
    hasMfa: factors.some((f) => f.status === 'verified'),
    needsMfaChallenge: aal.currentLevel === 'aal1' && aal.nextLevel === 'aal2',
    refresh,
    enroll,
    verifyEnrollment,
    unenroll,
    challenge,
    verifyChallenge,
    generateRecoveryCodes,
    consumeRecoveryCode,
    confirmRecoveryCode,
  };
}