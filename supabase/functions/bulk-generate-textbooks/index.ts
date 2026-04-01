/**
 * @file bulk-generate-textbooks/index.ts — Batch Textbook Content Generator
 *
 * PURPOSE: Generates textbook chapters and pages for courses that currently
 * have no textbook content. Processes one course per invocation to stay
 * within edge function timeout limits. Creates 3 chapters with 4-5 pages each.
 *
 * HOW IT WORKS:
 * 1. Admin calls this function (optionally with a specific courseId)
 * 2. Function finds the next course with 0 textbook chapters
 * 3. Generates 3 chapters with rich page content via AI
 * 4. Inserts chapters + pages into the database
 * 5. Returns progress info so the client can call again
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

import { getCorsHeaders, corsResponse } from "../_shared/cors.ts";

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
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const userId = userData.user.id;

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
    const requestedCourseId = body.courseId;

    // --- Use service role for DB writes ---
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // --- Find courses with no textbook chapters ---
    const { data: allCourses } = await serviceClient
      .from("courses")
      .select("id, title, description, order_number")
      .order("order_number", { ascending: true });

    if (!allCourses?.length) {
      return new Response(
        JSON.stringify({ message: "No courses found", processed: 0, remaining: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get chapter counts per course
    const { data: chapterCounts } = await serviceClient
      .from("textbook_chapters")
      .select("course_id");

    const courseChapterMap = new Map<string, number>();
    (chapterCounts || []).forEach((c: any) => {
      courseChapterMap.set(c.course_id, (courseChapterMap.get(c.course_id) || 0) + 1);
    });

    // Filter to courses with no chapters
    const emptyCourses = allCourses.filter(c => !courseChapterMap.get(c.id));

    // Pick the target course
    let targetCourse;
    if (requestedCourseId) {
      targetCourse = allCourses.find(c => c.id === requestedCourseId);
      if (!targetCourse) {
        return new Response(
          JSON.stringify({ error: "Course not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      targetCourse = emptyCourses[0];
    }

    if (!targetCourse) {
      return new Response(
        JSON.stringify({ message: "All courses already have textbook content!", processed: 0, remaining: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Also get lesson titles for context ---
    const { data: lessons } = await serviceClient
      .from("lessons")
      .select("title, type, order_number")
      .eq("course_id", targetCourse.id)
      .order("order_number", { ascending: true });

    const lessonTitles = (lessons || []).map((l: any) => l.title).join(", ");

    // --- Generate textbook chapters via AI ---
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    console.log(`Generating textbook for: "${targetCourse.title}"`);

    const systemPrompt = `You are an expert educational content writer for SoloSuccess Academy, creating interactive textbook content for solo founders and small business owners.

Generate a complete textbook with 3 chapters, each containing 4-5 pages of rich educational content.

IMPORTANT FORMAT RULES — USE RICH MARKDOWN:
- Start each page with a ## heading for the page title
- Use ### subheadings to break content into clear sections
- Use **bold** for key terms and important concepts
- Use bullet points and numbered lists liberally for steps, tips, and examples
- Include > blockquotes for "Pro Tips", real-world insights, or motivational callouts (prefix with > 💡 **Pro Tip:** or > 📌 **Key Insight:** or > 🎯 **Action Item:**)
- Use --- horizontal rules between major sections for visual separation
- Each page should be 400-600 words of markdown content
- Include practical examples, mini case studies, and actionable advice
- Make content engaging, conversational, and directly applicable to solo entrepreneurship
- At least 2 pages per chapter should have an embedded quiz

EXAMPLE PAGE STRUCTURE:
## Understanding Your Target Market

Every successful solo business starts with one critical question...

### Why Market Research Matters

> 💡 **Pro Tip:** You don't need expensive tools to research your market. Start with free resources like Google Trends, Reddit communities, and social media groups.

Here are the **three pillars** of effective market research:

1. **Demographics** — Who are your potential customers?
2. **Psychographics** — What motivates them to buy?
3. **Behavior patterns** — Where do they spend time online?

---

### Putting It Into Practice

- Start by listing 5 communities where your ideal customer hangs out
- Spend 30 minutes reading their questions and complaints
- Document the **exact words** they use to describe their problems

> 🎯 **Action Item:** Create a simple spreadsheet tracking customer pain points you discover this week.

For interactive elements, you may optionally include:
- [SCRAMBLE: keyword | hint about the word] — creates a word scramble game
- [FILLBLANK: A ___ is important for success | strategy | Think about planning] — fill-in-the-blank game

Return ONLY valid JSON in this exact format:
{
  "chapters": [
    {
      "title": "Chapter Title",
      "pages": [
        {
          "content": "Full rich markdown content for this page...",
          "embedded_quiz": null
        },
        {
          "content": "Another page with a quiz...",
          "embedded_quiz": {
            "question": "What is the key benefit of X?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0,
            "explanation": "Option A is correct because..."
          }
        }
      ]
    }
  ]
}`;

    const userPrompt = `Create a comprehensive textbook for the course "${targetCourse.title}".

Course description: ${targetCourse.description || "A course for solo entrepreneurs"}

The course covers these topics (based on lesson titles): ${lessonTitles || targetCourse.title}

Create 3 chapters that cover the key concepts thoroughly. Each chapter should have 4-5 pages. Include embedded quizzes on at least 2 pages per chapter. Optionally include 1-2 mini-games across the textbook using the [SCRAMBLE:] or [FILLBLANK:] format.

Make the content practical, motivating, and immediately useful for solo founders.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI error:", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    const generated = aiData.choices?.[0]?.message?.content;

    if (!generated) {
      throw new Error("No content generated from AI");
    }

    // Parse the JSON response
    let textbookData;
    try {
      const jsonMatch = generated.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : generated;
      textbookData = JSON.parse(jsonStr.trim());
    } catch {
      console.error("Failed to parse textbook JSON:", generated.substring(0, 500));
      throw new Error("Failed to parse AI-generated textbook content");
    }

    if (!textbookData.chapters?.length) {
      throw new Error("No chapters in generated content");
    }

    // --- Insert chapters and pages into DB ---
    let totalPages = 0;

    for (let chIdx = 0; chIdx < textbookData.chapters.length; chIdx++) {
      const chapter = textbookData.chapters[chIdx];

      // Insert chapter
      const { data: insertedChapter, error: chapterErr } = await serviceClient
        .from("textbook_chapters")
        .insert({
          course_id: targetCourse.id,
          title: chapter.title,
          order_number: chIdx + 1,
          is_preview: chIdx === 0, // First chapter is preview/free
        })
        .select("id")
        .single();

      if (chapterErr) {
        console.error(`Error inserting chapter "${chapter.title}":`, chapterErr);
        continue;
      }

      // Insert pages for this chapter
      const pageInserts = (chapter.pages || []).map((page: any, pgIdx: number) => ({
        chapter_id: insertedChapter.id,
        page_number: pgIdx + 1,
        content: page.content || "",
        embedded_quiz: page.embedded_quiz || null,
      }));

      if (pageInserts.length > 0) {
        const { error: pagesErr } = await serviceClient
          .from("textbook_pages")
          .insert(pageInserts);

        if (pagesErr) {
          console.error(`Error inserting pages for "${chapter.title}":`, pagesErr);
        } else {
          totalPages += pageInserts.length;
        }
      }
    }

    // Count remaining courses without textbooks
    const remainingCount = emptyCourses.length - 1; // Minus the one we just processed

    console.log(`Generated ${textbookData.chapters.length} chapters, ${totalPages} pages for "${targetCourse.title}"`);

    return new Response(
      JSON.stringify({
        message: `Generated textbook for "${targetCourse.title}"`,
        course: targetCourse.title,
        chaptersCreated: textbookData.chapters.length,
        pagesCreated: totalPages,
        remaining: remainingCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("bulk-generate-textbooks error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
