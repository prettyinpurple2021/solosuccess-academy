// === ai-tutor Edge Function ===
// Provides AI-powered tutoring for students, with streaming responses.
// Validates all input with Zod, checks auth + rate limits + course access.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.25.76";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rate limit: 30 requests per hour per user
const RATE_LIMIT_CONFIG = {
  endpoint: "ai-tutor",
  maxRequests: 30,
  windowMinutes: 60,
};

// --- Zod schemas for input validation ---

// Each chat message must have a valid role and bounded content length
const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"], {
    errorMap: () => ({ message: "Role must be 'user' or 'assistant'" }),
  }),
  content: z
    .string()
    .min(1, "Message content cannot be empty")
    .max(10000, "Message content too long (max 10,000 chars)"),
});

// The full request body schema
const aiTutorRequestSchema = z.object({
  messages: z
    .array(chatMessageSchema)
    .min(1, "At least one message is required")
    .max(50, "Too many messages (max 50)"),
  courseTitle: z.string().max(500).optional(),
  lessonTitle: z.string().max(500).optional(),
  lessonContent: z.string().max(10000).optional(),
  courseId: z.string().uuid("courseId must be a valid UUID").optional(),
});

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // 2. Check rate limit
    const rateLimitResult = await checkRateLimit(userId, RATE_LIMIT_CONFIG);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult, corsHeaders);
    }

    // 3. Parse and validate input with Zod
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parseResult = aiTutorRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message ?? "Invalid input";
      return new Response(
        JSON.stringify({ error: firstError }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, courseTitle, lessonTitle, lessonContent, courseId } = parseResult.data;

    // 4. Verify course purchase if courseId provided
    if (courseId) {
      const { data: purchase } = await supabase
        .from("purchases")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .maybeSingle();

      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (!purchase && !adminRole) {
        return new Response(
          JSON.stringify({ error: "Course access required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 5. Build AI prompt
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Sanitize dynamic content for the system prompt
    const sanitize = (text: string | undefined, maxLen = 500): string => {
      if (!text) return "";
      return text.substring(0, maxLen);
    };

    const systemPrompt = `You are an expert AI Tutor for the course "${sanitize(courseTitle) || "Solo Founder Academy"}". 
You are currently helping a student with the lesson: "${sanitize(lessonTitle) || "Current Lesson"}".

${lessonContent ? `Here is the lesson content for context:\n${sanitize(lessonContent, 5000)}\n\n` : ""}

Your role:
- Help students understand the lesson material deeply
- Answer questions about business concepts, strategies, and implementation
- Provide practical examples and actionable advice
- Encourage critical thinking and application to their specific business
- Be supportive, encouraging, and focused on their success as solo founders

Guidelines:
- Keep responses concise but thorough (aim for 2-4 paragraphs unless they need more detail)
- Use bullet points for lists and steps
- Reference the lesson content when relevant
- Ask clarifying questions if their query is ambiguous
- Celebrate their progress and curiosity
- Stay focused on the course material and related business topics`;

    // 6. Call AI gateway with streaming
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service credits exhausted. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI Tutor error:", error);
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
