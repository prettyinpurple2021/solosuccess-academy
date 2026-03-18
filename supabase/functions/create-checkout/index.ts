// === create-checkout Edge Function ===
// Creates a Stripe Checkout session for authenticated users purchasing a course.
// Validates input with Zod, checks auth, looks up Stripe price server-side,
// and returns the checkout URL.
//
// SECURITY: stripe_price_id is looked up server-side so it's never exposed to the client.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://esm.sh/zod@3.25.76";

import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

// Zod schema: only courseId is needed — stripe_price_id is looked up server-side
const checkoutRequestSchema = z.object({
  courseId: z
    .string()
    .uuid("courseId must be a valid UUID"),
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return corsResponse(req);
  }

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
      const firstError = parseResult.error.errors[0]?.message ?? "Invalid input";
      return new Response(
        JSON.stringify({ error: firstError }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { courseId } = parseResult.data;

    // 2. Retrieve and verify authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "User not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // We need the user's email for Stripe, so fetch the full user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token);
    if (userError || !user?.email) {
      return new Response(
        JSON.stringify({ error: "Could not retrieve user email" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Look up stripe_price_id server-side using service role key
    //    This keeps Stripe IDs off the client entirely.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: course, error: courseError } = await supabaseAdmin
      .from("courses")
      .select("stripe_price_id, is_published")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return new Response(
        JSON.stringify({ error: "Course not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!course.is_published) {
      return new Response(
        JSON.stringify({ error: "Course is not available for purchase" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!course.stripe_price_id) {
      return new Response(
        JSON.stringify({ error: "Course pricing not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Initialize Stripe with the secret key
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // 5. Check if user already has a Stripe customer record
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // 6. Create checkout session — priceId comes from server lookup, NOT from client
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: course.stripe_price_id,
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
