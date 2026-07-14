/**
 * @file OAuthConsent.tsx — Consent screen for the SoloSuccess Academy MCP OAuth server.
 * Mounted at /.lovable/oauth/consent. Users are redirected here by the Supabase
 * authorization server when an external MCP client (Claude, ChatGPT, etc.) requests
 * access to their account. The user approves or denies and is redirected back to
 * the client's redirect URI.
 */
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";
import { PageMeta } from "@/components/layout/PageMeta";

// Narrow local typing for the beta supabase.auth.oauth namespace
type AuthorizationDetails = {
  client?: { name?: string; client_id?: string; redirect_uris?: string[] };
  redirect_url?: string;
  redirect_to?: string;
  scope?: string;
  scopes?: string[];
};

type OauthNs = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
};

function getOauthNs() {
  // The oauth namespace is beta; access it via a typed wrapper.
  return (supabase.auth as unknown as { oauth: OauthNs }).oauth;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id in the request URL.");
        return;
      }

      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        // Preserve the FULL consent URL so auth returns the user here.
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      setUserEmail(sess.session.user?.email ?? null);

      try {
        const { data, error } = await getOauthNs().getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) {
          setError(error.message);
          return;
        }
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    try {
      const ns = getOauthNs();
      const { data, error } = approve
        ? await ns.approveAuthorization(authorizationId)
        : await ns.denyAuthorization(authorizationId);
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setError("No redirect URL was returned by the authorization server.");
        setBusy(false);
        return;
      }
      window.location.href = target;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  const clientName = details?.client?.name ?? "the requesting app";
  const scopes = details?.scopes ?? (details?.scope ? details.scope.split(/\s+/).filter(Boolean) : []);

  return (
    <main className="flex min-h-screen items-center justify-center p-4 cyber-bg">
      <PageMeta title="Authorize access" description="Authorize an external app to connect to your SoloSuccess Academy account." path="/.lovable/oauth/consent" noIndex />
      <div className="cyber-grid absolute inset-0" />
      <Card className="glass-card relative z-10 w-full max-w-md p-8 border-primary/30">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 border border-primary/30">
          <ShieldCheck className="h-7 w-7 text-primary" />
        </div>

        {error ? (
          <>
            <h1 className="text-xl font-display font-bold mb-2 text-center">Could not load this authorization request</h1>
            <p className="text-sm text-muted-foreground text-center">{error}</p>
          </>
        ) : !details ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading authorization…</p>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-display font-bold mb-2 text-center neon-text">
              Connect {clientName} to SoloSuccess Academy
            </h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {clientName} will be able to call SoloSuccess Academy's enabled tools while you are signed in.
            </p>

            <div className="rounded-md border border-primary/20 bg-muted/30 p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Signed in as</span>
                <span className="font-medium">{userEmail ?? "—"}</span>
              </div>
              {details.client?.client_id && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Client ID</span>
                  <span className="font-mono text-xs truncate" title={details.client.client_id}>
                    {details.client.client_id}
                  </span>
                </div>
              )}
              {scopes.length > 0 && (
                <div>
                  <div className="text-muted-foreground mb-1">Requested permissions</div>
                  <ul className="list-disc list-inside space-y-0.5">
                    {scopes.map((s) => (
                      <li key={s} className="text-xs">
                        {s === "openid" || s === "email" || s === "profile"
                          ? `Share your basic ${s === "openid" ? "identity" : s}`
                          : `Additional permission: ${s}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground mb-6 text-center">
              This does not bypass SoloSuccess Academy's own permissions or database policies.
            </p>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>
                Cancel connection
              </Button>
              <Button variant="neon" className="flex-1" disabled={busy} onClick={() => decide(true)}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
              </Button>
            </div>
          </>
        )}
      </Card>
    </main>
  );
}