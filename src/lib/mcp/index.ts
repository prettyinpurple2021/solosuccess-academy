import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMyCoursesTool from "./tools/list_my_courses";
import getMyProgressTool from "./tools/get_my_progress";
import listMyCertificatesTool from "./tools/list_my_certificates";
import searchLessonsTool from "./tools/search_lessons";

/**
 * SoloSuccess Academy MCP server.
 *
 * Exposes read-only tools tied to the signed-in student's own data
 * (purchased courses, XP/streak progress, earned certificates, and
 * lesson search). Every tool runs as the authenticated user via RLS.
 */
const projectRef =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "solosuccess-academy-mcp",
  title: "SoloSuccess Academy",
  version: "0.1.0",
  instructions:
    "Tools for SoloSuccess Academy students. Use these to look up the signed-in student's purchased courses, progress (XP and streak), earned certificates, and search lesson content within their enrolled courses.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listMyCoursesTool,
    getMyProgressTool,
    listMyCertificatesTool,
    searchLessonsTool,
  ],
});