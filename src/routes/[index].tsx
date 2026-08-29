/**
 * Legacy "/index" URL support.
 *
 * The old SPA build had a redirect from /index to /. Some bookmarks and
 * links still point at /index, which would otherwise 404 in the new
 * route tree. The bracket-escaped filename produces the literal path
 * segment "index" instead of an index route.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/index")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
});
