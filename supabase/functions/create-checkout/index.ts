// === create-checkout Edge Function ===
// Creates a Stripe Checkout session for authenticated users purchasing a course.
// Validates input with Zod, checks auth, and returns the checkout URL.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://esm.sh/zod@3.25.76";

// CORS headers so the frontend can call this function
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Zod schema: validates the request body has a valid Stripe price ID and UUID course ID
const checkoutRequestSchema = z.object({
  priceId: z
    .string()
    .min(1, "priceId is required")
    .regex(/^price_/, "priceId must be a valid Stripe price ID"),
  courseId: z
    .string()
    .uuid("courseId must be a valid UUID"),
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // 1. Parse and validate the request body using Zod
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parseResult = checkoutRequestSchema.safeParse(body);
    if (!parseResult.success) {
      // Return the first validation error message for clarity
      const firstError = parseResult.error.errors[0]?.message ?? "Invalid input";
      return new Response(
        JSON.stringify({ error: firstError }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { priceId, courseId } = parseResult.data;

    // 2. Retrieve and verify authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "User not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // We need the user's email for Stripe, so fetch the full user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user?.email) {
      return new Response(
        JSON.stringify({ error: "Could not retrieve user email" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Initialize Stripe with the secret key
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // 4. Check if user already has a Stripe customer record
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // 5. Create checkout session with validated inputs
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/courses/${courseId}?purchased=true`,
      cancel_url: `${req.headers.get("origin")}/courses/${courseId}?canceled=true`,
      metadata: {
        userId: user.id,
        courseId: courseId,
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Checkout error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
