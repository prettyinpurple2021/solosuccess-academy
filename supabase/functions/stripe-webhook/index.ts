// === stripe-webhook Edge Function ===
// Processes incoming Stripe webhook events (e.g., checkout.session.completed).
// Verifies the webhook signature, validates the event payload with Zod,
// and records purchases in the database.

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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return corsResponse(req);
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    // 1. Verify stripe-signature header is present
    if (!signature) {
      console.error("No Stripe signature found");
      return new Response(
        JSON.stringify({ error: "No signature provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Verify webhook secret is configured
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Webhook not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. CRITICAL: Verify webhook signature to prevent forged requests
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Webhook signature verification failed:", errorMessage);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Verified webhook event:", event.type);

    // 4. Handle checkout.session.completed events
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // 5. Validate metadata with Zod before trusting it
      const metadataResult = checkoutMetadataSchema.safeParse(session.metadata);
      if (!metadataResult.success) {
        console.error("Invalid session metadata:", metadataResult.error.errors);
        // Don't retry — bad metadata won't fix itself
        return new Response(JSON.stringify({ received: true, warning: "Invalid metadata, skipped" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const { userId, courseId } = metadataResult.data;
      const amountTotal = session.amount_total || 0;

      // 6. Insert purchase record using validated data
      const { error: purchaseError } = await supabaseClient
        .from("purchases")
        .insert({
          user_id: userId,
          course_id: courseId,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          amount_cents: amountTotal,
        });

      if (purchaseError) {
        console.error("Error creating purchase record:", purchaseError);
        // Don't throw — we don't want Stripe to retry for DB errors
      } else {
        console.log("Purchase recorded successfully for user:", userId, "course:", courseId);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
