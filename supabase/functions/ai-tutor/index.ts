// === ai-tutor Edge Function ===
// Provides AI-powered tutoring for students, with streaming responses.
// Validates all input with Zod, checks auth + rate limits + course access.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.25.76";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";
import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

import { getRateLimit } from "../_shared/rateLimitConfig.ts";
const RATE_LIMIT_CONFIG = getRateLimit("ai-tutor");

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
  lessonContent: z.string().max(40000).optional(),
  lessonDescription: z.string().max(2000).optional(),
  lessonType: z.string().max(50).optional(),
  courseId: z.string().uuid("courseId must be a valid UUID").optional(),
  lessonId: z.string().uuid("lessonId must be a valid UUID").optional(),
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return corsResponse(req);
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

    const {
      messages,
      courseTitle,
      lessonTitle,
      lessonContent,
      lessonDescription,
      lessonType,
      courseId,
      lessonId,
    } = parseResult.data;

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

    // 4b. Gather expanded context (best-effort — failures don't block the chat)
    let courseOutlineText = "";
    let textbookExcerptText = "";
    let progressSummaryText = "";

    if (courseId) {
      try {
        const { data: lessons } = await supabase
          .from("lessons")
          .select("id, title, type, order_number, is_published")
          .eq("course_id", courseId)
          .eq("is_published", true)
          .order("order_number", { ascending: true });

        if (lessons?.length) {
          const currentIdx = lessonId ? lessons.findIndex((l) => l.id === lessonId) : -1;
          courseOutlineText = lessons
            .map((l, i) => {
              const marker = i === currentIdx ? "→" : "  ";
              return `${marker} ${l.order_number}. ${l.title} (${l.type})`;
            })
            .join("\n");

          // Progress summary — how far the student has gotten in this course
          const { data: progress } = await supabase
            .from("user_progress")
            .select("lesson_id, completed")
            .eq("user_id", userId)
            .in("lesson_id", lessons.map((l) => l.id));
          const completedCount = progress?.filter((p) => p.completed).length ?? 0;
          progressSummaryText = `The student has completed ${completedCount} of ${lessons.length} lessons in this course.`;
          if (currentIdx > 0) {
            progressSummaryText += ` Prior lesson: "${lessons[currentIdx - 1].title}".`;
          }
          if (currentIdx >= 0 && currentIdx < lessons.length - 1) {
            progressSummaryText += ` Next lesson: "${lessons[currentIdx + 1].title}".`;
          }
        }
      } catch (e) {
        console.warn("ai-tutor: outline/progress fetch failed", e);
      }

      // Textbook chapter linked to this lesson (if any)
      if (lessonId) {
        try {
          const { data: chapter } = await supabase
            .from("textbook_chapters")
            .select("id, title")
            .eq("course_id", courseId)
            .eq("lesson_id", lessonId)
            .maybeSingle();
          if (chapter) {
            const { data: pages } = await supabase
              .from("textbook_pages")
              .select("page_number, content")
              .eq("chapter_id", chapter.id)
              .order("page_number", { ascending: true })
              .limit(6);
            if (pages?.length) {
              const joined = pages
                .map((p) => `[Page ${p.page_number}]\n${(p.content ?? "").substring(0, 1500)}`)
                .join("\n\n");
              textbookExcerptText = `Textbook chapter: "${chapter.title}"\n\n${joined.substring(0, 8000)}`;
            }
          }
        } catch (e) {
          console.warn("ai-tutor: textbook fetch failed", e);
        }
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

    const sections: string[] = [];
    sections.push(
      `You are an expert AI Tutor for the course "${sanitize(courseTitle) || "SoloSuccess Academy"}".`,
    );
    sections.push(
      `You are helping the student with the lesson: "${sanitize(lessonTitle) || "Current Lesson"}"${
        lessonType ? ` (type: ${sanitize(lessonType, 40)})` : ""
      }.`,
    );
    if (lessonDescription) {
      sections.push(`Lesson summary: ${sanitize(lessonDescription, 1500)}`);
    }
    if (lessonContent) {
      sections.push(`--- Lesson content ---\n${sanitize(lessonContent, 20000)}`);
    }
    if (textbookExcerptText) {
      sections.push(`--- Related textbook excerpts ---\n${textbookExcerptText}`);
    }
    if (courseOutlineText) {
      sections.push(
        `--- Course outline (→ marks the current lesson) ---\n${courseOutlineText.substring(0, 4000)}`,
      );
    }
    if (progressSummaryText) {
      sections.push(`--- Student progress ---\n${progressSummaryText}`);
    }
    sections.push(
      [
        "Your role:",
        "- Ground answers in the lesson content and textbook excerpts above; quote or paraphrase them when relevant.",
        "- Connect the current lesson to prior and upcoming lessons in the outline so the student sees the arc.",
        "- Give practical, solo-founder-specific examples and next actions.",
        "- Ask a clarifying question if the request is ambiguous.",
        "",
        "Guidelines:",
        "- Concise but thorough — usually 2–4 paragraphs. Use bullets for steps.",
        "- If the answer isn't in the provided context, say so plainly and give your best general guidance.",
        "- Stay on-topic for this course and the student's business.",
      ].join("\n"),
    );

    const systemPrompt = sections.join("\n\n");

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
