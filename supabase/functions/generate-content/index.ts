import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit: 20 requests per hour per admin
const RATE_LIMIT_CONFIG = {
  endpoint: "generate-content",
  maxRequests: 20,
  windowMinutes: 60,
};

interface GenerateRequest {
  type: "course_outline" | "lesson_content" | "quiz" | "worksheet" | "activity" | "exam" | "textbook_chapter" | "textbook_page" | "bulk_curriculum";
  context: {
    courseTitle?: string;
    courseDescription?: string;
    lessonTitle?: string;
    lessonType?: string;
    topic?: string;
    difficulty?: "beginner" | "intermediate" | "advanced";
    questionCount?: number;
    chapterTitle?: string;
    pageCount?: number;
    documentContent?: string;
    documentFileName?: string;
  };
  customPrompt?: string;
}

const systemPrompts: Record<string, string> = {
  course_outline: `You are an expert curriculum designer for SoloSuccess Academy, an online learning platform for solo founders and small business owners. 
Generate a comprehensive course outline with:
- A compelling course title
- A detailed course description (2-3 paragraphs)
- A discussion question for the community
- A project title and description for the capstone project
- 6-10 lesson ideas with titles and brief descriptions

Format your response as JSON:
{
  "title": "Course Title",
  "description": "Course description...",
  "discussion_question": "Question for discussion...",
  "project_title": "Capstone Project Title",
  "project_description": "Project description...",
  "lessons": [
    { "title": "Lesson Title", "type": "text|video|quiz|worksheet|activity", "description": "Brief description" }
  ]
}`,

  lesson_content: `You are an expert educational content writer for SoloSuccess Academy. 
Generate engaging, actionable lesson content for solo founders and small business owners.
Use clear language, practical examples, and include:
- An engaging introduction
- 3-5 main sections with headers
- Practical tips and action items
- A summary or key takeaways

Format with markdown: use **bold** for emphasis, bullet points for lists, and clear section headers.
Keep the content between 800-1500 words.`,

  quiz: `You are an expert assessment designer for SoloSuccess Academy.
Create quiz questions that test understanding and application of concepts.
Generate questions in JSON format:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}
Include a mix of difficulty levels and ensure questions are practical and relevant to entrepreneurs.`,

  worksheet: `You are an expert instructional designer for SoloSuccess Academy.
Create a practical worksheet with exercises that help learners apply concepts.
Generate in JSON format:
{
  "title": "Worksheet Title",
  "instructions": "Overall instructions for the worksheet",
  "sections": [
    {
      "title": "Section Title",
      "description": "Section description",
      "exercises": [
        {
          "type": "text|checklist|rating|reflection",
          "prompt": "Exercise prompt or question",
          "hints": "Optional hints or examples"
        }
      ]
    }
  ]
}`,

  activity: `You are an expert activity designer for SoloSuccess Academy.
Create an interactive activity that engages learners through hands-on practice.
Generate in JSON format:
{
  "title": "Activity Title",
  "description": "Brief description of the activity",
  "objectives": ["Learning objective 1", "Learning objective 2"],
  "steps": [
    {
      "stepNumber": 1,
      "title": "Step Title",
      "instructions": "Detailed instructions",
      "duration": "Estimated time (e.g., '10 minutes')",
      "deliverable": "What the learner should produce or accomplish"
    }
  ],
  "reflection": "Reflection question for after completing the activity"
}`,

  exam: `You are an expert assessment designer for SoloSuccess Academy.
Create a comprehensive final exam that covers all major concepts from a course.
Generate 15-20 questions in JSON format:
{
  "title": "Final Exam: [Course Title]",
  "instructions": "Exam instructions...",
  "passingScore": 70,
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Explanation of the correct answer",
      "points": 5
    }
  ]
}
Include questions of varying difficulty and cover the breadth of the course material.`,

  textbook_chapter: `You are an expert educational content writer for SoloSuccess Academy.
Create a complete textbook chapter with multiple pages of rich content.
Generate in JSON format:
{
  "title": "Chapter Title",
  "pages": [
    {
      "content": "Full page content in markdown format with headers, paragraphs, bullet points, examples, and key takeaways. Should be 300-500 words per page.",
      "embedded_quiz": null or {
        "question": "A comprehension question",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "Why this is correct"
      }
    }
  ]
}
Create 4-6 pages per chapter. Include practical examples, actionable tips, and at least 2 embedded quizzes to test understanding.`,

  textbook_page: `You are an expert educational content writer for SoloSuccess Academy.
Create a single textbook page with rich, engaging content for solo founders and small business owners.
Generate in JSON format:
{
  "content": "Full page content in markdown format. Include:\n- A clear main concept or topic\n- 2-3 supporting paragraphs with examples\n- Bullet points for key takeaways\n- A practical tip or action item\nContent should be 300-500 words.",
  "embedded_quiz": null or {
    "question": "A comprehension question about the content",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Why this answer is correct"
  }
}
Make the content actionable and relevant to entrepreneurs.`,

  bulk_curriculum: `You are an expert curriculum designer and content creator for SoloSuccess Academy, an online learning platform for solo founders and small business owners.

You will be given a source document containing educational content, research, notes, or other material. Your task is to analyze this document and create a comprehensive curriculum from it.

Generate a complete curriculum package in JSON format:
{
  "course": {
    "title": "Course Title derived from the document content",
    "description": "2-3 paragraph course description",
    "discussion_question": "A thought-provoking question for community discussion",
    "project_title": "Capstone Project Title",
    "project_description": "Clear description of the final project students will complete"
  },
  "lessons": [
    {
      "title": "Lesson Title",
      "type": "text|quiz|worksheet|activity",
      "content": "Full lesson content in markdown (for text lessons, 800-1500 words)",
      "quiz_data": null or { "questions": [...] } (for quiz lessons),
      "worksheet_data": null or { "title": "...", "instructions": "...", "sections": [...] } (for worksheet lessons),
      "activity_data": null or { "title": "...", "description": "...", "objectives": [...], "steps": [...] } (for activity lessons)
    }
  ],
  "textbook_chapters": [
    {
      "title": "Chapter Title",
      "pages": [
        {
          "content": "Page content in markdown (300-500 words)",
          "embedded_quiz": null or { "question": "...", "options": [...], "correctAnswer": 0, "explanation": "..." }
        }
      ]
    }
  ],
  "final_exam": {
    "title": "Final Exam Title",
    "instructions": "Exam instructions",
    "passingScore": 70,
    "questions": [
      {
        "question": "Question text",
        "options": ["A", "B", "C", "D"],
        "correctIndex": 0,
        "explanation": "Why this is correct",
        "points": 5
      }
    ]
  }
}

Extract key concepts, organize them logically, and create comprehensive educational materials. Include a mix of lesson types for varied learning experiences. Ensure quizzes test understanding of the source material.`
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user is admin
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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    // Check if user is admin
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

    // Check rate limit
    const rateLimitResult = await checkRateLimit(userId, RATE_LIMIT_CONFIG);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult, corsHeaders);
    }

    const { type, context, customPrompt }: GenerateRequest = await req.json();

    if (!type || !systemPrompts[type]) {
      return new Response(
        JSON.stringify({ error: "Invalid content type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if document content is provided and prepend it
    const documentPrefix = context.documentContent
      ? `## SOURCE DOCUMENT: "${context.documentFileName || 'Uploaded Document'}"\n\n${context.documentContent.substring(0, 50000)}\n\n---\n\nUsing the above source document, `
      : "";

    // Use custom prompt if provided, otherwise build default prompt
    let userPrompt = customPrompt || "";
    
    if (!customPrompt) {
      switch (type) {
        case "course_outline":
          userPrompt = `${documentPrefix}Create a course outline about: ${context.topic || "building a successful solo business"}
Target audience: Solo founders and small business owners
Difficulty level: ${context.difficulty || "intermediate"}`;
          break;

        case "lesson_content":
          userPrompt = `${documentPrefix}Create lesson content for:
Course: ${context.courseTitle || "Solo Business Mastery"}
Lesson Title: ${context.lessonTitle || context.topic || "Getting Started"}
Difficulty: ${context.difficulty || "intermediate"}
${context.topic ? `Topic focus: ${context.topic}` : ""}`;
          break;

        case "quiz":
          userPrompt = `${documentPrefix}Create ${context.questionCount || 5} quiz questions about:
Topic: ${context.topic || context.lessonTitle || "business fundamentals"}
Course context: ${context.courseTitle || "Solo Business"}
Difficulty: ${context.difficulty || "intermediate"}`;
          break;

        case "worksheet":
          userPrompt = `${documentPrefix}Create a practical worksheet for:
Topic: ${context.topic || context.lessonTitle || "strategic planning"}
Course: ${context.courseTitle || "Solo Business Mastery"}
Focus on actionable exercises that entrepreneurs can apply immediately.`;
          break;

        case "activity":
          userPrompt = `${documentPrefix}Create an interactive activity for:
Topic: ${context.topic || context.lessonTitle || "business strategy"}
Course: ${context.courseTitle || "Solo Business Mastery"}
Make it hands-on and practical for solo entrepreneurs.`;
          break;

        case "exam":
          userPrompt = `${documentPrefix}Create a comprehensive final exam for:
Course: ${context.courseTitle || "Solo Business Mastery"}
Course Description: ${context.courseDescription || "A course for solo entrepreneurs"}
Include ${context.questionCount || 15} questions covering all major topics.`;
          break;

        case "textbook_chapter":
          userPrompt = `${documentPrefix}Create a complete textbook chapter for:
Course: ${context.courseTitle || "Solo Business Mastery"}
Chapter Title: ${context.chapterTitle || context.topic || "Introduction"}
Number of pages: ${context.pageCount || 5}
Difficulty: ${context.difficulty || "intermediate"}
Make it comprehensive and practical for solo entrepreneurs.`;
          break;

        case "textbook_page":
          userPrompt = `${documentPrefix}Create a textbook page for:
Course: ${context.courseTitle || "Solo Business Mastery"}
Chapter: ${context.chapterTitle || "Introduction"}
Topic: ${context.topic || "Key Concepts"}
Difficulty: ${context.difficulty || "intermediate"}
Include an embedded quiz to test understanding.`;
          break;

        case "bulk_curriculum":
          if (!context.documentContent) {
            return new Response(
              JSON.stringify({ error: "Document content is required for bulk curriculum generation" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          userPrompt = `## SOURCE DOCUMENT: "${context.documentFileName || 'Uploaded Document'}"

${context.documentContent.substring(0, 80000)}

---

Analyze the above source document thoroughly and create a complete curriculum package including:
1. A comprehensive course with title, description, discussion question, and capstone project
2. 6-10 lessons with varied types (text, quiz, worksheet, activity) with full content
3. 2-4 textbook chapters with multiple pages each
4. A final exam with 15-20 questions

Difficulty level: ${context.difficulty || "intermediate"}
Target audience: Solo founders and small business owners

Extract all key concepts from the document and organize them into a logical learning progression.`;
          break;
      }
    } else if (context.documentContent) {
      // If custom prompt is provided but also has document, prepend document
      userPrompt = `${documentPrefix}${customPrompt}`;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompts[type] },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please check your Lovable AI credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate content");
    }

    const aiResponse = await response.json();
    const generatedContent = aiResponse.choices?.[0]?.message?.content;

    if (!generatedContent) {
      throw new Error("No content generated");
    }

    // Try to parse JSON from the response for structured content types
    let parsedContent = generatedContent;
    const jsonContentTypes = ["course_outline", "quiz", "worksheet", "activity", "exam", "textbook_chapter", "textbook_page", "bulk_curriculum"];
    if (jsonContentTypes.includes(type)) {
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = generatedContent.match(/```(?:json)?\s*([\s\S]*?)```/);
        const jsonString = jsonMatch ? jsonMatch[1] : generatedContent;
        parsedContent = JSON.parse(jsonString.trim());
      } catch {
        // If parsing fails, return raw content
        console.log("Could not parse JSON, returning raw content");
      }
    }

    return new Response(
      JSON.stringify({ content: parsedContent, raw: generatedContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Content generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
