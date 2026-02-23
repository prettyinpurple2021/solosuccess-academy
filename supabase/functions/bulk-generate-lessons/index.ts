/**
 * @file bulk-generate-lessons/index.ts — Batch AI Content Generator
 *
 * PURPOSE: Generates full lesson content for lessons that currently have
 * placeholder/stub text (<500 chars). Processes up to 3 lessons per
 * invocation to stay within edge function timeout limits.
 *
 * HOW IT WORKS:
 * 1. Admin calls this function with optional course_id filter
 * 2. Function finds lessons with short content (<500 chars)
 * 3. Generates rich content for up to 3 lessons per call
 * 4. Saves generated content directly to the database
 * 5. Returns how many remain so the client can call again
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// How many lessons to process per invocation (keeps us under timeout)
const BATCH_SIZE = 3;

/**
 * Builds a rich prompt for generating lesson content based on lesson type
 */
function buildPrompt(lesson: any, course: any): { system: string; user: string } {
  const baseSystem = `You are an expert educational content writer for SoloSuccess Academy, an online learning platform for solo founders and small business owners. Write engaging, actionable content that is practical and motivating.`;

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
Write a comprehensive assignment description in markdown. Include:\n- Clear objectives\n- Step-by-step instructions\n- Deliverables expected\n- Evaluation criteria\n- Tips for success\nKeep it between 600-1000 words.`,
        user: `Create an assignment for \"${lesson.title}\" in \"${course.title}\" (${course.description}). Make it a practical project a solo founder can complete and add to their portfolio.`,
      };

    default:
      // text or video type — generate rich markdown content
      return {
        system: `${baseSystem}\n
Generate engaging lesson content in markdown format. Include:\n- An engaging introduction paragraph\n- 3-5 main sections with ## headers\n- Practical tips, examples, and action items\n- Bullet points for key concepts\n- A "Key Takeaways" section at the end\nKeep the content between 800-1500 words. Use **bold** for emphasis.`,
        user: `Write comprehensive lesson content for \"${lesson.title}\" in the course \"${course.title}\" (${course.description}). Make it practical, motivating, and immediately useful for solo founders and entrepreneurs.`,
      };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    // --- Use service role for DB writes ---
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // --- Find placeholder lessons ---
    let query = serviceClient
      .from("lessons")
      .select("id, title, type, order_number, content, course_id")
      .eq("is_published", true)
      .order("order_number", { ascending: true })
      .limit(BATCH_SIZE);

    if (courseId) {
      query = query.eq("course_id", courseId);
    }

    const { data: lessons, error: lessonsErr } = await query;
    if (lessonsErr) throw new Error(lessonsErr.message);

    // Filter to only placeholder lessons (content < 500 chars or null)
    const placeholderLessons = (lessons || []).filter(
      (l: any) => !l.content || l.content.length < 500
    );

    if (placeholderLessons.length === 0) {
      // Check total remaining across all courses
      let countQuery = serviceClient
        .from("lessons")
        .select("id, content", { count: "exact" })
        .eq("is_published", true);
      if (courseId) countQuery = countQuery.eq("course_id", courseId);
      const { data: allLessons } = await countQuery;
      const remaining = (allLessons || []).filter(
        (l: any) => !l.content || l.content.length < 500
      ).length;

      return new Response(
        JSON.stringify({
          message: "No placeholder lessons found in this batch",
          processed: 0,
          remaining,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Fetch course info for context ---
    const courseIds = [...new Set(placeholderLessons.map((l: any) => l.course_id))];
    const { data: courses } = await serviceClient
      .from("courses")
      .select("id, title, description")
      .in("id", courseIds);

    const courseMap = Object.fromEntries((courses || []).map((c: any) => [c.id, c]));

    // --- Generate content for each lesson ---
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const results: any[] = [];

    for (const lesson of placeholderLessons) {
      const course = courseMap[lesson.course_id] || { title: "Unknown", description: "" };
      const { system, user } = buildPrompt(lesson, course);

      try {
        console.log(`Generating content for: \"${lesson.title}\" (${lesson.type})`);

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
            // Also set some content text for display
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
          // text, video, assignment — plain markdown content
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
    let remainQuery = serviceClient
      .from("lessons")
      .select("id, content")
      .eq("is_published", true);
    if (courseId) remainQuery = remainQuery.eq("course_id", courseId);
    const { data: allRemaining } = await remainQuery;
    const remaining = (allRemaining || []).filter(
      (l: any) => !l.content || l.content.length < 500
    ).length;

    return new Response(
      JSON.stringify({
        message: `Processed ${results.length} lessons`,
        processed: results.length,
        remaining,
        results,
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
