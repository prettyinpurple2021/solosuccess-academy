/**
 * generate-blog-post — Auto-publishing blog engine.
 *
 * Flow:
 * 1. Verify caller is either a cron job (CRON_JOB_SECRET header) or admin user.
 * 2. Pick the next topic:
 *    - If a row exists in blog_topic_queue with status='pending', use the
 *      highest-priority oldest one ("queue" mode).
 *    - Otherwise, ask the LLM to pick an untouched solopreneur topic
 *      ("AI-pick" mode), avoiding slugs already in blog_posts.
 * 3. Call Lovable AI (Gemini) with structured output to generate the post.
 * 4. Insert into blog_posts as status='published'. Mark queue row used.
 *
 * Returns JSON with the created post slug + id, or an error.
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const CRON_JOB_SECRET = Deno.env.get("CRON_JOB_SECRET")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Slugify a title into a URL-safe slug. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** JSON schema for the post the LLM should return. */
const postSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    metaTitle: { type: "string" },
    description: { type: "string" },
    excerpt: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    readingMinutes: { type: "number" },
    bodyHtml: { type: "string" },
    faq: {
      type: "array",
      items: {
        type: "object",
        properties: { q: { type: "string" }, a: { type: "string" } },
        required: ["q", "a"],
      },
    },
  },
  required: ["title", "metaTitle", "description", "excerpt", "tags", "readingMinutes", "bodyHtml"],
  additionalProperties: false,
};

/** Call Lovable AI with a JSON-schema constrained response. */
async function callAI(systemPrompt: string, userPrompt: string, schema: unknown, schemaName: string) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: schemaName,
            description: "Return the requested structured object.",
            parameters: schema,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: schemaName } },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${text}`);
  }
  const data = await res.json();
  const call = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!call) throw new Error("AI returned no tool call");
  return JSON.parse(call.function.arguments);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // ── Auth: cron secret OR admin user ──
    const cronSecret = req.headers.get("x-cron-secret");
    const isCron = cronSecret && cronSecret === CRON_JOB_SECRET;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    if (!isCron) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return json({ error: "Unauthorized" }, 401);
      const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData } = await userClient.auth.getUser();
      if (!userData?.user) return json({ error: "Unauthorized" }, 401);
      const { data: roleRow } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleRow) return json({ error: "Admin only" }, 403);
    }

    // ── Pick topic from queue OR ask the AI to pick one ──
    const { data: queueRow } = await admin
      .from("blog_topic_queue")
      .select("id, topic, angle, target_keyword")
      .eq("status", "pending")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    let topic: string;
    let angle: string | null = null;
    let keyword: string | null = null;
    let mode: "ai-queue" | "ai-auto" = "ai-queue";
    let queueId: string | null = null;

    // Collect existing slugs/titles so the AI doesn't repeat
    const { data: existing } = await admin
      .from("blog_posts")
      .select("slug, title")
      .order("published_at", { ascending: false })
      .limit(50);
    const existingTitles = (existing ?? []).map((p) => p.title);
    const existingSlugs = new Set((existing ?? []).map((p) => p.slug));

    if (queueRow) {
      topic = queueRow.topic;
      angle = queueRow.angle;
      keyword = queueRow.target_keyword;
      queueId = queueRow.id;
      mode = "ai-queue";
    } else {
      // Ask AI to pick a fresh solopreneur topic
      const picker = await callAI(
        "You pick blog topics for SoloSuccess Academy, an EdTech platform for solo founders, side hustlers, indie hackers and career changers.",
        `Pick ONE high-intent SEO topic for a new blog post.
Audience: solopreneurs / one-person businesses.
Avoid these existing titles: ${JSON.stringify(existingTitles)}.
Return a topic that has clear search demand and is not redundant with the existing ones.`,
        {
          type: "object",
          properties: {
            topic: { type: "string" },
            angle: { type: "string" },
            targetKeyword: { type: "string" },
          },
          required: ["topic", "angle", "targetKeyword"],
          additionalProperties: false,
        },
        "pick_topic",
      );
      topic = picker.topic;
      angle = picker.angle;
      keyword = picker.targetKeyword;
      mode = "ai-auto";
    }

    // ── Generate the post ──
    const post = await callAI(
      `You are a senior writer for SoloSuccess Academy. Write honest, opinionated, hands-on articles for solo entrepreneurs. No fluff, no AI-jargon, no fake stats, no purple/indigo cliches. Plain professional voice. Always include concrete steps, tools, and tradeoffs.`,
      `Write a complete blog post.

Topic: ${topic}
${angle ? `Angle: ${angle}` : ""}
${keyword ? `Target keyword: ${keyword}` : ""}

Requirements:
- title: catchy, specific, <= 70 chars
- metaTitle: SEO title, <= 60 chars, include the target keyword if natural
- description: meta description, 120–160 chars
- excerpt: 1–2 sentence teaser for the blog index, plain text, <= 220 chars
- tags: 3–5 short lowercase tags
- readingMinutes: integer estimate of reading time (5–12)
- bodyHtml: the full article body in semantic HTML using ONLY these tags:
    <p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>, <a href="...">, <blockquote>, <code>
    - 900–1500 words
    - Open with a hook paragraph (no H1; the page renders H1 separately)
    - 4–6 H2 sections with descriptive headings
    - Use bullet lists where helpful
    - Internal link suggestion: include 1 link to "/courses" or "/about" where natural
    - Do NOT include any <html>, <head>, <body>, <script>, or <style> tags
    - Do NOT include images
- faq: 3 short FAQ items relevant to the topic (used for FAQPage schema)`,
      postSchema,
      "generate_blog_post",
    );

    // ── Build a unique slug ──
    let slug = slugify(post.title);
    if (!slug) slug = `post-${Date.now()}`;
    let candidate = slug;
    let n = 2;
    while (existingSlugs.has(candidate)) {
      candidate = `${slug}-${n++}`;
    }
    slug = candidate;

    // ── Insert post ──
    const { data: inserted, error: insertErr } = await admin
      .from("blog_posts")
      .insert({
        slug,
        title: post.title,
        meta_title: post.metaTitle,
        description: post.description,
        excerpt: post.excerpt,
        body_html: post.bodyHtml,
        tags: post.tags ?? [],
        faq: post.faq ?? null,
        reading_minutes: Math.max(3, Math.min(20, Math.round(post.readingMinutes ?? 6))),
        status: "published",
        generated_by: mode,
        source_topic: topic,
      })
      .select("id, slug")
      .single();

    if (insertErr) throw new Error(`Insert failed: ${insertErr.message}`);

    // ── Mark queue row used ──
    if (queueId) {
      await admin
        .from("blog_topic_queue")
        .update({ status: "used", used_at: new Date().toISOString(), used_post_id: inserted.id })
        .eq("id", queueId);
    }

    return json({ ok: true, slug: inserted.slug, id: inserted.id, topic, mode });
  } catch (err) {
    console.error("generate-blog-post error", err);
    return json({ error: (err as Error).message }, 500);
  }
});