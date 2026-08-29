/**
 * useTrafficHeartbeat
 *
 * WHAT: Tells the backend "somebody is using the app right now".
 * WHY:  Background tasks (cron jobs) are gated on this signal — they only run
 *       when there was recent user traffic or there is real pending work.
 *       That keeps the backend idle (and cheaper) during quiet hours.
 *
 * HOW:  Calls the `record_app_traffic` database function. That function is
 *       throttled server-side (max one write per minute) and stores no personal
 *       data — just a single "last seen" timestamp for the whole app.
 *       We additionally throttle in the browser via localStorage so we don't
 *       fire a request on every page render.
 */
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Don't ping more than once per 10 minutes per browser.
const THROTTLE_MS = 10 * 60 * 1000;
const STORAGE_KEY = "ssa:last-traffic-ping";

async function ping() {
  try {
    // Read the last ping time from this browser; skip if it's too recent.
    const last = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Date.now() - last < THROTTLE_MS) return;

    // Optimistically mark it now so two tabs don't both fire.
    localStorage.setItem(STORAGE_KEY, String(Date.now()));

    // Fire-and-forget: a failure here must never affect the UI.
    await supabase.rpc("record_app_traffic");
  } catch {
    // Silent by design — this is a background signal, not a user action.
  }
}

export function useTrafficHeartbeat() {
  useEffect(() => {
    // 1) Ping on app load.
    void ping();

    // 2) Ping again when the user returns to the tab (long sessions).
    const onVisible = () => {
      if (document.visibilityState === "visible") void ping();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);
}
