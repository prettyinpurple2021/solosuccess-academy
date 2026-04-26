// === stripe-webhook Edge Function ===
// Handles Stripe webhook events with full production hardening:
//   1. HMAC signature verification (Stripe → us)
//   2. Idempotent event processing via stripe_webhook_events ledger
//   3. checkout.session.completed → record purchase + send branded receipt
//   4. charge.refunded → mark purchase refunded
//   5. payment_intent.payment_failed → log only (no purchase row to mutate)
//
// SECURITY: This is a public webhook — verify_jwt is intentionally false.
// The Stripe signature is the only trust anchor.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://esm.sh/zod@3.25.76";

import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

// Zod schema: validates the metadata extracted from a completed checkout session
const checkoutMetadataSchema = z.object({
  userId: z.string().uuid("userId must be a valid UUID"),
  courseId: z.string().uuid("courseId must be a valid UUID"),
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return corsResponse(req);
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  // Service-role client — webhook bypasses RLS, this is intentional & safe
  // because we only act on Stripe-verified events.
  // deno-lint-ignore no-explicit-any
  const supabase: any = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("[stripe-webhook] Missing stripe-signature header");
      return new Response(JSON.stringify({ error: "No signature provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify HMAC signature — only Stripe can produce a valid signature with our secret
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("[stripe-webhook] Signature verification failed:", errorMessage);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── IDEMPOTENCY GATE ───────────────────────────────────────────
    // Stripe may retry the same event (network blips, our 5xxs). The unique
    // index on stripe_webhook_events.stripe_event_id guarantees we only
    // process each event once.
    const { data: existingEvent, error: lookupError } = await supabase
      .from("stripe_webhook_events")
      .select("id, status")
      .eq("stripe_event_id", event.id)
      .maybeSingle();

    if (lookupError) {
      console.error("[stripe-webhook] Ledger lookup failed:", lookupError);
      // Surface a 500 so Stripe retries — better safe than dropping events.
      return new Response(JSON.stringify({ error: "Ledger lookup failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (existingEvent) {
      console.log(`[stripe-webhook] Skipping duplicate event ${event.id} (${event.type})`);
      return new Response(JSON.stringify({ received: true, idempotent: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reserve the event ID immediately so concurrent retries can't double-process.
    // If this insert fails for any reason other than uniqueness, we treat it as
    // a hard error and let Stripe retry.
    const { error: reserveError } = await supabase
      .from("stripe_webhook_events")
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        payload: event as unknown as Record<string, unknown>,
        status: "processing",
      });

    if (reserveError) {
      // 23505 = unique_violation: another worker grabbed it first → safe to ack.
      // deno-lint-ignore no-explicit-any
      if ((reserveError as any).code === "23505") {
        return new Response(JSON.stringify({ received: true, idempotent: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("[stripe-webhook] Failed to reserve event:", reserveError);
      return new Response(JSON.stringify({ error: "Failed to reserve event" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processingError: string | null = null;

    // ── EVENT ROUTING ──────────────────────────────────────────────
    try {
      if (event.type === "checkout.session.completed") {
        await handleCheckoutCompleted(stripe, supabase, event.data.object as Stripe.Checkout.Session);
      } else if (event.type === "charge.refunded") {
        await handleChargeRefunded(supabase, event.data.object as Stripe.Charge);
      } else if (event.type === "payment_intent.payment_failed") {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.warn(
          `[stripe-webhook] Payment failed: ${pi.id} (${pi.last_payment_error?.message ?? "no message"})`
        );
      } else {
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
      }
    } catch (err) {
      processingError = err instanceof Error ? err.message : String(err);
      console.error("[stripe-webhook] Event handling failed:", processingError);
    }

    // Mark the event as processed (or errored) in the ledger
    await supabase
      .from("stripe_webhook_events")
      .update({
        status: processingError ? "error" : "processed",
        error_message: processingError,
      })
      .eq("stripe_event_id", event.id);

    // Always 200 to Stripe for events we accepted into the ledger; otherwise
    // Stripe will keep retrying forever and we'd build up a flood.
    return new Response(JSON.stringify({ received: true, error: processingError }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("[stripe-webhook] Unhandled error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

// ── handlers ──────────────────────────────────────────────────────

async function handleCheckoutCompleted(
  stripe: Stripe,
  // deno-lint-ignore no-explicit-any
  supabase: any,
  session: Stripe.Checkout.Session
) {
  const metadataResult = checkoutMetadataSchema.safeParse(session.metadata);
  if (!metadataResult.success) {
    console.error(
      "[stripe-webhook] Invalid session metadata:",
      metadataResult.error.errors
    );
    return; // Bad metadata won't fix itself; treat as processed.
  }

  const { userId, courseId } = metadataResult.data;
  const amountTotal = session.amount_total || 0;

  // Insert purchase. Unique constraint on stripe_checkout_session_id makes this safe
  // even if Stripe replays the same session by accident.
  const { error: purchaseError } = await supabase
    .from("purchases")
    .insert({
      user_id: userId,
      course_id: courseId,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string,
      amount_cents: amountTotal,
    });

  if (purchaseError) {
    // deno-lint-ignore no-explicit-any
    const code = (purchaseError as any).code;
    if (code === "23505") {
      console.log(
        `[stripe-webhook] Purchase already exists for session ${session.id} — skipping receipt re-send`
      );
      return;
    }
    throw new Error(`Purchase insert failed: ${purchaseError.message}`);
  }

  console.log(
    `[stripe-webhook] Purchase recorded for user ${userId}, course ${courseId}`
  );

  // ── Send branded receipt (best-effort; failures don't unwind the purchase) ──
  try {
    // Fetch course title + student name in parallel
    const [courseRes, profileRes] = await Promise.all([
      supabase.from("courses").select("title").eq("id", courseId).maybeSingle(),
      supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
    ]);

    const courseTitle: string =
      courseRes?.data?.title ?? "your SoloSuccess Academy course";
    const studentName: string | undefined = profileRes?.data?.display_name ?? undefined;
    const recipientEmail = session.customer_details?.email ?? session.customer_email ?? null;

    if (!recipientEmail) {
      console.warn("[stripe-webhook] No recipient email on session, skipping receipt");
      return;
    }

    const amountFormatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (session.currency ?? "usd").toUpperCase(),
    }).format(amountTotal / 100);

    const purchaseDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "purchase-receipt",
        recipientEmail,
        idempotencyKey: `receipt-${session.id}`,
        templateData: {
          studentName,
          courseTitle,
          amountFormatted,
          purchaseDate,
          orderId: session.id,
          courseUrl: `https://solosuccessacademy.cloud/courses/${courseId}`,
        },
      },
    });

    console.log(`[stripe-webhook] Receipt enqueued for ${recipientEmail}`);
  } catch (emailErr) {
    console.error(
      "[stripe-webhook] Receipt send failed (non-fatal):",
      emailErr instanceof Error ? emailErr.message : emailErr
    );
  }
}

// deno-lint-ignore no-explicit-any
async function handleChargeRefunded(supabase: any, charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) {
    console.warn("[stripe-webhook] charge.refunded without payment_intent");
    return;
  }

  const { data: purchase, error: findErr } = await supabase
    .from("purchases")
    .select("id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (findErr || !purchase) {
    console.warn(
      `[stripe-webhook] No purchase found for refunded payment_intent ${paymentIntentId}`
    );
    return;
  }

  const { error: updateErr } = await supabase
    .from("purchases")
    .update({
      refunded_at: new Date().toISOString(),
      refund_amount_cents: charge.amount_refunded,
    })
    .eq("id", purchase.id);

  if (updateErr) {
    throw new Error(`Refund update failed: ${updateErr.message}`);
  }

  console.log(`[stripe-webhook] Marked purchase ${purchase.id} as refunded`);
}
