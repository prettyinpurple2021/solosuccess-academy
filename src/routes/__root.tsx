/**
 * @file __root.tsx — Root route for TanStack Start
 *
 * Replaces the old index.html + main.tsx + App.tsx trio:
 * - head() carries the SEO meta, fonts, favicon and JSON-LD from index.html
 * - RootShell renders the <html>/<head>/<body> document shell
 * - RootComponent nests every global provider around <Outlet />
 * - errorComponent + notFoundComponent give branded fallbacks
 */
import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Navigate,
  Outlet,
  Scripts,
  useLocation,
  useRouter,
} from "@tanstack/react-router";
import { Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";

import appCss from "../styles.css?url";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GamificationProvider } from "@/components/gamification/GamificationProvider";
import { NeonSpinner } from "@/components/ui/neon-spinner";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { SkipLink } from "@/components/layout/SkipLink";
import { useTrafficHeartbeat } from "@/hooks/useTrafficHeartbeat";
import NotFound from "@/pages/NotFound";

// ported from main.tsx — PostHog analytics init (module is SSR-guarded)
import "@/lib/posthog";

/**
 * Reduced-motion bootstrap — ported from main.tsx's initReducedMotion().
 * Runs as an inline head script BEFORE first paint so decorative backgrounds
 * (nebula, starfield) never flash in for users who prefer reduced motion.
 */
const REDUCED_MOTION_BOOTSTRAP = `(function(){try{var v=null;try{v=localStorage.getItem('a11y:motion-preference')}catch(e){}var p=(v==='reduce'||v==='full'||v==='system')?v:'system';var s=false;try{s=window.matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}var r=p==='reduce'||(p==='system'&&s);document.documentElement.setAttribute('data-reduce-motion',r?'true':'false')}catch(e){}})();`;

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Orbitron:wght@700;900&family=Rajdhani:wght@500;700&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400&display=swap";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { title: "SoloSuccess Academy — AI Courses for Solo Founders" },
      {
        name: "description",
        content:
          "Master entrepreneurship with 10 AI-powered courses designed for solo founders. From mindset to pitch, build your business one course at a time.",
      },
      { name: "google-site-verification", content: "WZZSGK-rrBl1E2w1bnJ3yhSR_MR6ae74qMR1uxPATE4" },
      { name: "author", content: "SoloSuccess Academy" },
      {
        name: "keywords",
        content:
          "entrepreneurship, solo founder, AI learning, online courses, business education, startup, indie hacker",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "SoloSuccess Academy — AI Courses for Solo Founders" },
      { property: "og:url", content: "https://solosuccessacademy.app/" },
      {
        property: "og:description",
        content:
          "Master entrepreneurship with 10 AI-powered courses designed for solo founders. From mindset to pitch, build your business one course at a time.",
      },
      { property: "og:image", content: "https://solosuccessacademy.app/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "SoloSuccess Academy — AI Courses for Solo Founders" },
      {
        name: "twitter:description",
        content:
          "Master entrepreneurship with 10 AI-powered courses designed for solo founders. From mindset to pitch, build your business one course at a time.",
      },
      { name: "twitter:image", content: "https://solosuccessacademy.app/og-image.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: "https://solosuccessacademy.app/" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: FONTS_HREF },
      {
        rel: "icon",
        type: "image/png",
        href: "https://storage.googleapis.com/gpt-engineer-file-uploads/NLWVD3fDzNYASkymUcc0kTOEijL2/uploads/1769370570971-Create a favicon-siz.png",
      },
    ],
    scripts: [
      { children: REDUCED_MOTION_BOOTSTRAP },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "SoloSuccess Academy",
          url: "https://solosuccessacademy.app",
          logo: "https://solosuccessacademy.app/og-image.png",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "SoloSuccess Academy",
          url: "https://solosuccessacademy.app",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundHandler,
  errorComponent: RootErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/**
 * TrafficHeartbeat: invisible component that reports "the app is in use" to the
 * backend, so scheduled background jobs only run when there's real traffic.
 */
const TrafficHeartbeat = () => {
  useTrafficHeartbeat();
  return null;
};

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <HelmetProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <TooltipProvider>
              <GamificationProvider>
                {/* Reports live traffic used by on-demand background job gating */}
                <TrafficHeartbeat />
                {/* Two toast systems: Toaster = shadcn toasts, Sonner = sonner toasts */}
                <Toaster />
                <Sonner />
                {/* SkipLink: Accessibility — lets keyboard users skip nav to main content */}
                <SkipLink />
                {/* Suspense: pages lazy-load some heavy internals (charts, flipbook) */}
                <Suspense
                  fallback={
                    <div className="flex min-h-screen items-center justify-center cyber-bg">
                      <div className="cyber-grid absolute inset-0" />
                      <div className="flex flex-col items-center gap-4 relative z-10">
                        <NeonSpinner size="lg" />
                        <p className="text-sm text-muted-foreground font-mono">Loading...</p>
                      </div>
                    </div>
                  }
                >
                  <Outlet />
                </Suspense>
              </GamificationProvider>
            </TooltipProvider>
          </ThemeProvider>
        </HelmetProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

/**
 * 404 handler — also preserves the legacy `/index` → `/` redirect the old
 * router had, so the app preview never opens on a 404 page.
 */
function NotFoundHandler() {
  const location = useLocation();
  if (location.pathname === "/index") {
    return <Navigate to="/" replace />;
  }
  return <NotFound />;
}

function RootErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-2 text-xl font-heading font-bold text-foreground">
          This page didn't load
        </h1>
        <p className="mb-6 text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </button>
          <a
            className="rounded-md border border-border bg-card px-4 py-2 text-foreground"
            href="/"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
