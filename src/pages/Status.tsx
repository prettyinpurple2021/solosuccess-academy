/**
 * @file Status.tsx — Public health/status page.
 *
 * Shows:
 *  - Build version + last deploy time (injected by Vite at build time).
 *  - Basic reachability checks for public and admin routes.
 *  - Lovable Cloud (Supabase) reachability check.
 *
 * Public route — no auth required.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, Loader2, Activity, History, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageMeta } from "@/components/layout/PageMeta";
import { supabase } from "@/integrations/supabase/client";

type CheckState = "pending" | "pass" | "fail";

interface Check {
  id: string;
  label: string;
  group: "Public" | "Admin" | "Backend";
  state: CheckState;
  detail?: string;
  ms?: number;
}

interface DeployRow {
  version: string;
  deployed_at: string;
  status: string;
}

const INITIAL_CHECKS: Check[] = [
  { id: "route-home", label: "GET /", group: "Public", state: "pending" },
  { id: "route-courses", label: "GET /courses", group: "Public", state: "pending" },
  { id: "route-blog", label: "GET /blog", group: "Public", state: "pending" },
  { id: "route-help", label: "GET /help", group: "Public", state: "pending" },
  { id: "route-admin", label: "GET /admin", group: "Admin", state: "pending" },
  { id: "route-admin-analytics", label: "GET /admin/analytics", group: "Admin", state: "pending" },
  { id: "backend-auth", label: "Auth service reachable", group: "Backend", state: "pending" },
  { id: "backend-db", label: "Database reachable", group: "Backend", state: "pending" },
];

async function pingRoute(path: string): Promise<{ ok: boolean; ms: number; status?: number }> {
  const start = performance.now();
  try {
    const res = await fetch(path, { method: "GET", cache: "no-store" });
    return { ok: res.ok, ms: Math.round(performance.now() - start), status: res.status };
  } catch {
    return { ok: false, ms: Math.round(performance.now() - start) };
  }
}

const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h
const AUTO_REFRESH_STORAGE_KEY = "status:autoRefresh";

export default function Status() {
  const [checks, setChecks] = useState<Check[]>(INITIAL_CHECKS);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date>(() => new Date());
  const [nextCheckAt, setNextCheckAt] = useState<Date>(() => new Date(Date.now() + REFRESH_INTERVAL_MS));
  const [deploys, setDeploys] = useState<DeployRow[] | null>(null);
  const [deploysError, setDeploysError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(AUTO_REFRESH_STORAGE_KEY) !== "false";
  });
  const [isRunning, setIsRunning] = useState(false);
  const cancelRef = useRef(false);

  const buildVersion =
    typeof __BUILD_VERSION__ !== "undefined" ? __BUILD_VERSION__ : "unknown";
  const buildTime =
    typeof __BUILD_TIME__ !== "undefined" ? __BUILD_TIME__ : new Date().toISOString();

  // Record this build (no-op if already recorded) and load recent deploy history.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await supabase.rpc("record_deploy", {
          _version: buildVersion,
          _deployed_at: buildTime,
        });
      } catch {
        // Non-fatal — history query below will still run.
      }

      const { data, error } = await supabase
        .from("deploy_history")
        .select("version, deployed_at, status")
        .order("deployed_at", { ascending: false })
        .limit(5);

      if (cancelled) return;
      if (error) {
        setDeploysError(error.message);
        setDeploys([]);
      } else {
        setDeploys((data ?? []) as DeployRow[]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [buildVersion, buildTime]);

  const runAllChecks = useCallback(async () => {
    setIsRunning(true);
    // Reset every row to pending so the UI clearly indicates a re-run.
    setChecks((prev) => prev.map((c) => ({ ...c, state: "pending", ms: undefined, detail: undefined })));

    const update = (id: string, patch: Partial<Check>) => {
      if (cancelRef.current) return;
      setChecks((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    };

    const runRoute = async (id: string, path: string) => {
      const r = await pingRoute(path);
      update(id, {
        state: r.ok ? "pass" : "fail",
        ms: r.ms,
        detail: r.status ? `HTTP ${r.status}` : "Network error",
      });
    };

    const runBackend = async () => {
      const authStart = performance.now();
      try {
        const { error } = await supabase.auth.getSession();
        update("backend-auth", {
          state: error ? "fail" : "pass",
          ms: Math.round(performance.now() - authStart),
          detail: error ? error.message : "getSession OK",
        });
      } catch (e: any) {
        update("backend-auth", {
          state: "fail",
          ms: Math.round(performance.now() - authStart),
          detail: e?.message || "getSession threw",
        });
      }

      const dbStart = performance.now();
      try {
        const { error } = await supabase
          .from("blog_posts")
          .select("id", { count: "exact", head: true })
          .limit(1);
        update("backend-db", {
          state: error ? "fail" : "pass",
          ms: Math.round(performance.now() - dbStart),
          detail: error ? error.message : "Query OK",
        });
      } catch (e: any) {
        update("backend-db", {
          state: "fail",
          ms: Math.round(performance.now() - dbStart),
          detail: e?.message || "Query threw",
        });
      }
    };

    await Promise.all([
      runRoute("route-home", "/"),
      runRoute("route-courses", "/courses"),
      runRoute("route-blog", "/blog"),
      runRoute("route-help", "/help"),
      runRoute("route-admin", "/admin"),
      runRoute("route-admin-analytics", "/admin/analytics"),
      runBackend(),
    ]);

    if (!cancelRef.current) {
      const now = new Date();
      setLastCheckedAt(now);
      setNextCheckAt(new Date(now.getTime() + REFRESH_INTERVAL_MS));
    }
    setIsRunning(false);
  }, []);

  // Initial run on mount.
  useEffect(() => {
    cancelRef.current = false;
    void runAllChecks();
    return () => {
      cancelRef.current = true;
    };
  }, [runAllChecks]);

  // Daily auto-refresh on a 24h timer. Also re-runs when the tab returns to
  // the foreground after the interval has elapsed since the last check.
  useEffect(() => {
    if (!autoRefresh) return;

    const id = window.setInterval(() => {
      void runAllChecks();
    }, REFRESH_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastCheckedAt.getTime() >= REFRESH_INTERVAL_MS) {
        void runAllChecks();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [autoRefresh, lastCheckedAt, runAllChecks]);

  // Persist the toggle so the user's preference sticks across visits.
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(AUTO_REFRESH_STORAGE_KEY, autoRefresh ? "true" : "false");
  }, [autoRefresh]);

  const groups: Check["group"][] = ["Public", "Admin", "Backend"];
  const allDone = checks.every((c) => c.state !== "pending");
  const anyFailed = checks.some((c) => c.state === "fail");
  const overall: CheckState = !allDone ? "pending" : anyFailed ? "fail" : "pass";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageMeta
        title="System Status"
        description="Live status, build version, and health checks for SoloSuccess Academy."
        path="/status"
        noIndex
      />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="font-display text-2xl sm:text-3xl font-bold">System Status</h1>
          </div>
          <OverallBadge state={overall} />
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Build</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3 text-sm">
            <Info label="Version" value={buildVersion} mono />
            <Info label="Last deploy" value={formatDate(buildTime)} />
            <Info label="Last checked" value={formatDate(lastCheckedAt.toISOString())} />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
            <div className="flex items-center gap-3">
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              <Label htmlFor="auto-refresh" className="cursor-pointer">
                Auto-refresh daily
              </Label>
              {autoRefresh && (
                <span className="text-xs text-muted-foreground">
                  Next: {formatDate(nextCheckAt.toISOString())}
                </span>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void runAllChecks()}
              disabled={isRunning}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRunning ? "animate-spin" : ""}`} />
              {isRunning ? "Refreshing…" : "Refresh now"}
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" /> Recent deploys
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deploys === null ? (
              <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading history…
              </div>
            ) : deploys.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                {deploysError
                  ? `Could not load history: ${deploysError}`
                  : "No deploys recorded yet."}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {deploys.map((d) => {
                  const isCurrent = d.version === buildVersion;
                  return (
                    <li
                      key={d.version}
                      className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <DeployStatusIcon status={d.status} />
                        <span className="truncate font-mono">{d.version}</span>
                        {isCurrent && (
                          <Badge variant="secondary" className="text-[10px]">
                            current
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatDate(d.deployed_at)}</span>
                        <span className="capitalize">{d.status}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {groups.map((group) => (
          <Card key={group} className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">{group} checks</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {checks
                  .filter((c) => c.group === group)
                  .map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <StatusIcon state={c.state} />
                        <span className="truncate font-medium">{c.label}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {typeof c.ms === "number" && <span>{c.ms} ms</span>}
                        {c.detail && (
                          <span className="max-w-[16rem] truncate" title={c.detail}>
                            {c.detail}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        ))}

        <p className="text-xs text-muted-foreground">
          Route checks fetch the page HTML — because this is a single-page app,
          a 200 response confirms hosting/SPA fallback is healthy, not that the
          specific route rendered without JS errors. Backend checks verify the
          auth service and database are reachable from the browser.
        </p>
      </div>
    </div>
  );
}

function StatusIcon({ state }: { state: CheckState }) {
  if (state === "pending") return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (state === "pass") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  return <XCircle className="h-4 w-4 text-destructive" />;
}

function DeployStatusIcon({ status }: { status: string }) {
  if (status === "success") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === "pending") return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  return <XCircle className="h-4 w-4 text-destructive" />;
}

function OverallBadge({ state }: { state: CheckState }) {
  if (state === "pending") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" /> Checking…
      </Badge>
    );
  }
  if (state === "pass") {
    return (
      <Badge className="gap-1 bg-emerald-500/15 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20">
        <CheckCircle2 className="h-3 w-3" /> All systems operational
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="h-3 w-3" /> Degraded
    </Badge>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`truncate ${mono ? "font-mono" : ""}`} title={value}>
        {value}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}