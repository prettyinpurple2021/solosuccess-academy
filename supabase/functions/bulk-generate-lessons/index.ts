/**
 * @file bulk-generate-lessons/index.ts — Batch AI Content Generator
 *
 * PURPOSE: Generates full lesson content for lessons that currently have
 * placeholder/stub text (<500 chars), or force-regenerates ALL lessons
 * with rich markdown formatting when the `force` flag is set.
 *
 * HOW IT WORKS:
 * 1. Admin calls this function with optional course_id filter and force flag
 * 2. Function finds lessons to process (placeholders, or ALL if force=true)
 * 3. Generates rich markdown content for up to 3 lessons per call
 * 4. Saves generated content directly to the database
 * 5. Returns how many remain so the client can call again
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

// How many lessons to process per invocation (keeps us under timeout)
const BATCH_SIZE = 3;

/**
 * Builds a rich prompt that explicitly requests markdown with headings,
 * lists, blockquotes, callout sections, and horizontal-rule dividers.
 */
function buildPrompt(lesson: any, course: any): { system: string; user: string } {
  const baseSystem = `You are an expert educational content writer for SoloSuccess Academy, an online learning platform for solo founders and small business owners. Write engaging, actionable content that is practical and motivating.

CRITICAL FORMATTING RULES — you MUST follow these exactly:
- Use ## and ### headings to break content into clear sections
- Use bullet lists (- item) for key points, tips, and lists
- Use numbered lists (1. item) for step-by-step processes
- Use blockquotes (> text) for important quotes, definitions, or key insights
- Use horizontal rules (---) between major sections as visual dividers
- Use **bold** for key terms and emphasis
- Use *italic* for definitions or secondary emphasis
- Use \`inline code\` for tools, apps, or technical terms
- Include at least 2 blockquote callouts per lesson
- Include at least 1 horizontal rule divider
- DO NOT use HTML tags — only standard markdown`;

  switch (lesson.type) {
    case "quiz":
      return {
        system: `${baseSystem}\n
Generate quiz questions in JSON format:\n{\"questions\":[{\"question\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"correctIndex\":0,\"explanation\":\"...\"}]}\nInclude 5 varied questions testing practical knowledge.`,
        user: `Create a quiz for the lesson \"${lesson.title}\" in the course \"${course.title}\" (${course.description}). Focus on practical application for solo entrepreneurs.`,
      };

    case "activity":
      return {
        system: `${baseSystem}\n
Generate an activity in JSON format:\n{\"title\":\"...\",\"description\":\"...\",\"objectives\":[\"...\"],\"steps\":[{\"stepNumber\":1,\"title\":\"...\",\"instructions\":\"...\",\"duration\":\"...\",\"deliverable\":\"...\"}],\"reflection\":\"...\"}\nMake it hands-on and immediately applicable.`,
        user: `Create a practical activity for the lesson \"${lesson.title}\" in the course \"${course.title}\" (${course.description}). Make it something a solo founder can complete in 30-60 minutes.`,
      };

    case "worksheet":
      return {
        system: `${baseSystem}\n
Generate a worksheet in JSON format:\n{\"title\":\"...\",\"instructions\":\"...\",\"sections\":[{\"title\":\"...\",\"description\":\"...\",\"exercises\":[{\"type\":\"text|checklist|reflection\",\"prompt\":\"...\",\"hints\":\"...\"}]}]}\nMake exercises practical and actionable.`,
        user: `Create a worksheet for the lesson \"${lesson.title}\" in the course \"${course.title}\" (${course.description}). Include exercises that help solo founders apply concepts immediately.`,
      };

    case "assignment":
      return {
        system: `${baseSystem}\n
Write a comprehensive assignment description using rich markdown formatting. Structure it with:
## Assignment Overview
Brief description of the assignment and its real-world value.

## Learning Objectives
- Objective 1
- Objective 2

> **Why this matters:** A blockquote explaining the practical importance.

---

## Step-by-Step Instructions
1. First step with details
2. Second step with details

## Deliverables
- What to submit
- Format requirements

> **Pro Tip:** Helpful advice in a blockquote.

---

## Evaluation Criteria
- Criteria with point values

## Tips for Success
- Actionable tips

Keep it between 600-1000 words.`,
        user: `Create an assignment for \"${lesson.title}\" in \"${course.title}\" (${course.description}). Make it a practical project a solo founder can complete and add to their portfolio.`,
      };

    default:
      // text or video type — generate rich markdown content
      return {
        system: `${baseSystem}\n
Generate engaging lesson content using this exact structure pattern:

## Introduction
An engaging opening paragraph that hooks the reader and explains why this topic matters for solo entrepreneurs.

> **Key Insight:** A compelling blockquote that frames the main concept.

---

## [First Major Section]
Detailed content with practical examples.

- Key point one with explanation
- Key point two with explanation  
- Key point three with explanation

### [Subsection if needed]
Deeper dive into a specific aspect.

> **Real-World Example:** A practical example or case study in blockquote format.

---

## [Second Major Section]
More detailed content with actionable advice.

1. Step-by-step process item one
2. Step-by-step process item two
3. Step-by-step process item three

### Common Mistakes to Avoid
- Mistake 1 and how to fix it
- Mistake 2 and how to fix it

---

## [Third Major Section]
Additional practical content.

> **Pro Tip:** An expert tip or best practice.

---

## Key Takeaways
- Takeaway 1
- Takeaway 2
- Takeaway 3
- Takeaway 4

> **Action Step:** What the student should do RIGHT NOW to apply this lesson.

Keep the content between 800-1500 words. Every lesson MUST include at least 3 section headings (##), 2 blockquotes (>), 1 horizontal rule (---), and both bullet and numbered lists.`,
        user: `Write comprehensive lesson content for \"${lesson.title}\" in the course \"${course.title}\" (${course.description}). Make it practical, motivating, and immediately useful for solo founders and entrepreneurs. Use rich markdown formatting with headings, blockquotes, lists, and dividers.`,
      };
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return corsResponse(req);
  }

  try {
    // --- Auth: verify admin ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
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
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const userId = claimsData.claims.sub as string;

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Parse request ---
    const body = await req.json();
    const courseId = body.courseId; // optional filter
    const force = body.force === true; // force-regenerate ALL lessons
    // Track which lesson IDs have already been processed (sent from client)
    const processedIds: string[] = body.processedIds || [];

    // --- Use service role for DB writes ---
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // --- Find lessons to process ---
    let query = serviceClient
      .from("lessons")
      .select("id, title, type, order_number, content, course_id")
      .eq("is_published", true)
      .order("order_number", { ascending: true });

    if (courseId) {
      query = query.eq("course_id", courseId);
    }

    const { data: allLessons, error: lessonsErr } = await query;
    if (lessonsErr) throw new Error(lessonsErr.message);

    // Filter based on mode: force = all text/video/assignment; normal = placeholders only
    let eligibleLessons = (allLessons || []).filter((l: any) => {
      // Skip already-processed lessons in this session
      if (processedIds.includes(l.id)) return false;

      if (force) {
        // In force mode, regenerate text/video/assignment lessons (not quiz/activity/worksheet which use JSON)
        return ['text', 'video', 'assignment'].includes(l.type);
      }
      // Normal mode: only placeholder lessons
      return !l.content || l.content.length < 500;
    });

    // Take only BATCH_SIZE
    const lessonsToProcess = eligibleLessons.slice(0, BATCH_SIZE);

    if (lessonsToProcess.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No lessons to process in this batch",
          processed: 0,
          remaining: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Fetch course info for context ---
    const courseIds = [...new Set(lessonsToProcess.map((l: any) => l.course_id))];
    const { data: courses } = await serviceClient
      .from("courses")
      .select("id, title, description")
      .in("id", courseIds);

    const courseMap = Object.fromEntries((courses || []).map((c: any) => [c.id, c]));

    // --- Generate content for each lesson ---
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const results: any[] = [];

    for (const lesson of lessonsToProcess) {
      const course = courseMap[lesson.course_id] || { title: "Unknown", description: "" };
      const { system, user } = buildPrompt(lesson, course);

      try {
        console.log(`Generating content for: \"${lesson.title}\" (${lesson.type})${force ? ' [FORCE]' : ''}`);

        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            temperature: 0.7,
            max_tokens: 4000,
          }),
        });

        if (!aiResp.ok) {
          const errText = await aiResp.text();
          console.error(`AI error for \"${lesson.title}\":`, aiResp.status, errText);
          results.push({ id: lesson.id, title: lesson.title, status: "error", error: `AI ${aiResp.status}` });
          continue;
        }

        const aiData = await aiResp.json();
        const generated = aiData.choices?.[0]?.message?.content;

        if (!generated) {
          results.push({ id: lesson.id, title: lesson.title, status: "error", error: "No content returned" });
          continue;
        }

        // --- Save to DB based on lesson type ---
        const updatePayload: any = { updated_at: new Date().toISOString() };

        if (lesson.type === "quiz") {
          // Parse JSON quiz data
          try {
            const jsonMatch = generated.match(/```(?:json)?\s*([\s\S]*?)```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : generated;
            const parsed = JSON.parse(jsonStr.trim());
            updatePayload.quiz_data = parsed;
            updatePayload.content = `Quiz: ${lesson.title}\n\nThis quiz contains ${parsed.questions?.length || 0} questions to test your knowledge.`;
          } catch {
            updatePayload.content = generated;
          }
        } else if (lesson.type === "activity") {
          try {
            const jsonMatch = generated.match(/```(?:json)?\s*([\s\S]*?)```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : generated;
            const parsed = JSON.parse(jsonStr.trim());
            updatePayload.activity_data = parsed;
            updatePayload.content = `Activity: ${parsed.title || lesson.title}\n\n${parsed.description || "Complete this hands-on activity."}`;
          } catch {
            updatePayload.content = generated;
          }
        } else if (lesson.type === "worksheet") {
          try {
            const jsonMatch = generated.match(/```(?:json)?\s*([\s\S]*?)```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : generated;
            const parsed = JSON.parse(jsonStr.trim());
            updatePayload.worksheet_data = parsed;
            updatePayload.content = `Worksheet: ${parsed.title || lesson.title}\n\n${parsed.instructions || "Complete this worksheet."}`;
          } catch {
            updatePayload.content = generated;
          }
        } else {
          // text, video, assignment — rich markdown content
          updatePayload.content = generated;
        }

        const { error: updateErr } = await serviceClient
          .from("lessons")
          .update(updatePayload)
          .eq("id", lesson.id);

        if (updateErr) {
          results.push({ id: lesson.id, title: lesson.title, status: "error", error: updateErr.message });
        } else {
          results.push({
            id: lesson.id,
            title: lesson.title,
            status: "success",
            contentLength: (updatePayload.content || "").length,
          });
        }
      } catch (err) {
        results.push({ id: lesson.id, title: lesson.title, status: "error", error: String(err) });
      }
    }

    // --- Count remaining ---
    const newlyProcessedIds = results.filter((r: any) => r.status === 'success').map((r: any) => r.id);
    const allProcessedIds = [...processedIds, ...newlyProcessedIds];
    const remaining = eligibleLessons.length - lessonsToProcess.length;

    return new Response(
      JSON.stringify({
        message: `Processed ${results.length} lessons`,
        processed: results.length,
        remaining,
        results,
        processedIds: allProcessedIds,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("bulk-generate-lessons error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
