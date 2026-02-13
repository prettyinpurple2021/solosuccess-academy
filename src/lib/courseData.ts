/**
 * @file courseData.ts — Course & Lesson Type Definitions and Utility Functions
 * 
 * This file defines the TypeScript interfaces and helper functions for the
 * course/lesson data model. These types mirror the database schema and are
 * used throughout the frontend for type safety.
 * 
 * DATA FLOW:
 * Database (PostgreSQL) → Supabase SDK → useCourses.ts hook → Components
 *                                         ↑ uses these types
 * 
 * PRODUCTION TODO:
 * - The `LessonType` here only includes 4 values, but the DB enum has 6
 *   ('text', 'video', 'quiz', 'assignment', 'worksheet', 'activity').
 *   Update this type to match the full DB enum for consistency.
 * - Consider generating these types automatically from the Supabase schema
 *   to prevent drift between frontend types and database columns.
 */

/** The three phases of the SoloSuccess curriculum */
export type CoursePhase = 'initialization' | 'orchestration' | 'launch';

/**
 * Course interface — matches the `courses` database table.
 * 
 * NOTE: `stripe_product_id` and `stripe_price_id` are included here
 * but intentionally excluded from public API queries in useCourses.ts
 * to avoid leaking Stripe IDs to the client.
 */
export interface Course {
  id: string;
  order_number: number;
  title: string;
  description: string | null;
  phase: CoursePhase;
  plug_and_play_asset: string | null;     // Downloadable resource URL
  discussion_question: string | null;      // Pre-set discussion prompt
  project_title: string | null;            // Capstone project title
  project_description: string | null;      // Capstone project instructions
  stripe_product_id: string | null;        // Stripe product (not exposed to client)
  stripe_price_id: string | null;          // Stripe price (not exposed to client)
  price_cents: number;                     // Price in cents (e.g., 4900 = $49.00)
  is_published: boolean;                   // Only published courses are visible to students
  created_at: string;                      // ISO 8601 timestamp
  updated_at: string;                      // ISO 8601 timestamp
}

/**
 * Lesson type enum — the different content formats a lesson can have.
 * 
 * PRODUCTION TODO: Add 'worksheet' | 'activity' to match the full DB enum.
 */
export type LessonType = 'text' | 'video' | 'quiz' | 'assignment';

/**
 * Lesson interface — matches the `lessons` database table.
 * Each lesson belongs to one course (via course_id foreign key).
 */
export interface Lesson {
  id: string;
  course_id: string;                       // FK → courses.id
  order_number: number;                    // Determines display order within a course
  title: string;
  type: LessonType;                        // Determines which viewer component renders
  content: string | null;                  // Markdown/HTML content for text lessons
  video_url: string | null;                // URL for video lessons (Supabase Storage)
  duration_minutes: number | null;         // Estimated time to complete
  created_at: string;
  updated_at: string;
}

/**
 * UI metadata for each curriculum phase.
 * Used to render phase badges, headers, and icons consistently.
 * 
 * The `colorClass` maps to CSS classes defined in index.css
 * (e.g., `.phase-initialization` sets the neon purple color).
 */
export const phaseMetadata: Record<CoursePhase, { 
  label: string; 
  description: string; 
  icon: string;
  colorClass: string;
}> = {
  initialization: {
    label: 'Phase 1: Initialization',
    description: 'Identity and Intel',
    icon: '🚀',
    colorClass: 'phase-initialization',
  },
  orchestration: {
    label: 'Phase 2: Orchestration',
    description: 'Building the Machine',
    icon: '⚙️',
    colorClass: 'phase-orchestration',
  },
  launch: {
    label: 'Phase 3: Launch Sequence',
    description: 'Sales and Future',
    icon: '🎯',
    colorClass: 'phase-launch',
  },
};

/**
 * Format a price from cents to a human-readable USD string.
 * 
 * @param cents - Price in cents (e.g., 4900)
 * @returns Formatted string (e.g., "$49.00")
 * 
 * PRODUCTION TODO: Support multiple currencies if expanding internationally.
 */
export const formatPrice = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
};

/**
 * Get Tailwind CSS classes for a phase badge.
 * Uses semantic design tokens from the theme.
 * 
 * @param phase - The course phase
 * @returns Tailwind class string for background, text, and border colors
 */
export const getPhaseClasses = (phase: CoursePhase): string => {
  switch (phase) {
    case 'initialization':
      return 'bg-primary/10 text-primary border-primary/30';
    case 'orchestration':
      return 'bg-secondary/10 text-secondary border-secondary/30';
    case 'launch':
      return 'bg-accent/10 text-accent border-accent/30';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

/**
 * Calculate overall progress as a percentage.
 * 
 * @param completedLessons - Number of lessons the student has completed
 * @param totalLessons - Total number of lessons in the course
 * @returns Integer percentage (0-100), rounded
 */
export const calculateProgress = (
  completedLessons: number,
  totalLessons: number
): number => {
  if (totalLessons === 0) return 0;
  return Math.round((completedLessons / totalLessons) * 100);
};
