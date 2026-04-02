/**
 * @file LessonContent.tsx — Main Lesson Content Renderer
 *
 * Renders different content based on the lesson type:
 * - text:       Rich text content with formatting
 * - video:      Embedded video player + text content
 * - quiz:       Text content + interactive quiz (QuizViewer)
 * - assignment: Text content + inline submission form (AssignmentSubmission)
 * - worksheet:  Text content + worksheet exercises (WorksheetViewer)
 * - activity:   Text content + step-by-step player (ActivityViewer)
 *
 * This component handles TYPE BRANCHING — the key piece that ensures each
 * lesson type gets its appropriate interactive UI.
 */
import DOMPurify from 'dompurify';
import { type Lesson } from '@/lib/courseData';
import { Badge } from '@/components/ui/badge';
import { FileText, Video, Sparkles, PenLine, Activity, FileQuestion } from 'lucide-react';
import { QuizPlayer } from './QuizPlayer';
import { ActivityViewer } from './ActivityViewer';
import { WorksheetViewer } from './WorksheetViewer';
import { AssignmentSubmission } from './AssignmentSubmission';
import { ActivityStepPlayer } from './ActivityStepPlayer';
import { WorksheetPlayer } from './WorksheetPlayer';
import { PracticeLabPlayer } from './PracticeLabPlayer';
import { usePracticeLab } from '@/hooks/usePracticeLabs';

interface LessonContentProps {
  /** The lesson to render */
  lesson: Lesson;
  /** The student's saved notes for this lesson (used by worksheet) */
  savedNotes?: string | null;
  /** The student's previous quiz score (null if never attempted) */
  quizScore?: number | null;
  /** Number of quiz attempts already used (0-3) */
  quizAttempts?: number;
  /** The student's previous activity score (null if never attempted) */
  activityScore?: number | null;
  /** Called when a quiz is submitted with the resulting score (0-100) */
  onQuizSubmit?: (score: number) => void;
  /** Called when activity progress changes (0-100) */
  onActivityProgress?: (score: number) => void;
  /** Called when worksheet responses are saved */
  onSaveNotes?: (notes: string) => void;
  /** Whether the current user has completed this lesson */
  isCompleted?: boolean;
  /** Existing notes/submission from user_progress (used for assignments) */
  existingNotes?: string | null;
  /** Current user ID — passed to interactive players for persistence */
  userId?: string;
  /** Course ID — needed for practice lab file uploads */
  courseId?: string;
}

/**
 * Converts Markdown-like content into rich HTML with semantic structure.
 * Supports headings (##), lists, blockquotes (>), horizontal rules (---),
 * bold, italic, inline code, and callout detection.
 */
const sanitizeAndFormat = (content: string): string => {
  // Process line-by-line for block-level elements
  const lines = content.split('\n');
  let html = '';
  let inList: 'ul' | 'ol' | null = null;
  let inBlockquote = false;

  const closeList = () => {
    if (inList) {
      html += `</${inList}>`;
      inList = null;
    }
  };
  const closeBlockquote = () => {
    if (inBlockquote) {
      html += '</blockquote>';
      inBlockquote = false;
    }
  };

  /** Apply inline formatting to a line of text */
  const inlineFmt = (text: string) =>
    text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line — close open blocks
    if (!trimmed) {
      closeList();
      closeBlockquote();
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|_{3,}|\*{3,})$/.test(trimmed)) {
      closeList();
      closeBlockquote();
      html += '<hr/>';
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      closeList();
      closeBlockquote();
      const level = headingMatch[1].length;
      html += `<h${level}>${inlineFmt(headingMatch[2])}</h${level}>`;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      closeList();
      if (!inBlockquote) {
        inBlockquote = true;
        html += '<blockquote>';
      }
      html += `<p>${inlineFmt(trimmed.slice(1).trim())}</p>`;
      continue;
    } else {
      closeBlockquote();
    }

    // Unordered list
    if (/^[-*•]\s+/.test(trimmed)) {
      if (inList !== 'ul') {
        closeList();
        inList = 'ul';
        html += '<ul>';
      }
      html += `<li>${inlineFmt(trimmed.replace(/^[-*•]\s+/, ''))}</li>`;
      continue;
    }

    // Ordered list
    const olMatch = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (olMatch) {
      if (inList !== 'ol') {
        closeList();
        inList = 'ol';
        html += '<ol>';
      }
      html += `<li>${inlineFmt(olMatch[1])}</li>`;
      continue;
    }

    // Regular paragraph
    closeList();
    html += `<p>${inlineFmt(trimmed)}</p>`;
  }

  closeList();
  closeBlockquote();

  // Sanitize the final HTML to prevent XSS
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'code', 'pre',
      'h1', 'h2', 'h3',
      'ul', 'ol', 'li',
      'blockquote', 'hr',
      'div', 'span',
    ],
    ALLOWED_ATTR: ['class'],
  });
};

export function LessonContent({
  lesson,
  savedNotes,
  quizScore,
  quizAttempts,
  activityScore,
  onQuizSubmit,
  onActivityProgress,
  onSaveNotes,
  isCompleted = false,
  existingNotes = null,
  userId,
  courseId,
}: LessonContentProps) {
  /** Fetch practice lab for this lesson (if one exists) */
  const { data: practiceLab } = usePracticeLab(lesson.id);
  /** Returns the icon for the lesson type badge */
  const getTypeIcon = () => {
    switch (lesson.type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'quiz':
        return <Sparkles className="h-4 w-4" />;
      case 'assignment':
        return <PenLine className="h-4 w-4" />;
      case 'activity':
        return <Activity className="h-4 w-4" />;
      case 'worksheet':
        return <FileQuestion className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  /** Returns a human-readable label for the lesson type */
  const getTypeName = () => {
    switch (lesson.type) {
      case 'video':
        return 'Video Lesson';
      case 'quiz':
        return 'Quiz';
      case 'assignment':
        return 'Assignment';
      case 'activity':
        return 'Activity';
      case 'worksheet':
        return 'Worksheet';
      default:
        return 'Reading';
    }
  };

  const getEmbeddedVideoSrc = (rawUrl: string): { type: 'youtube' | 'vimeo' | 'raw'; src: string } => {
    try {
      const url = new URL(rawUrl);
      const hostname = url.hostname.toLowerCase();

      // Normalize common YouTube hostnames
      const isYouTubeHost =
        hostname === 'youtube.com' ||
        hostname === 'www.youtube.com' ||
        hostname === 'm.youtube.com' ||
        hostname === 'youtu.be' ||
        hostname === 'www.youtu.be';

      if (isYouTubeHost) {
        let videoId: string | null = null;

        if (hostname === 'youtu.be' || hostname === 'www.youtu.be') {
          // Short URL format: https://youtu.be/<id>
          videoId = url.pathname.replace(/^\/+/, '');
        } else {
          // Standard watch or embed URL: https://www.youtube.com/watch?v=<id>
          videoId = url.searchParams.get('v');
          if (!videoId && url.pathname.startsWith('/embed/')) {
            videoId = url.pathname.replace(/^\/embed\//, '');
          }
        }

        if (videoId) {
          const embedSrc = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;
          return { type: 'youtube', src: embedSrc };
        }

        // If we couldn't confidently extract an ID, fall back to the raw URL
        return { type: 'raw', src: rawUrl };
      }

      // Normalize common Vimeo hostnames
      const isVimeoHost =
        hostname === 'vimeo.com' ||
        hostname === 'www.vimeo.com' ||
        hostname === 'player.vimeo.com';

      if (isVimeoHost) {
        let videoId: string | null = null;

        if (hostname === 'player.vimeo.com') {
          // player URLs: https://player.vimeo.com/video/<id>
          videoId = url.pathname.replace(/^\/video\//, '').replace(/^\/+/, '');
        } else {
          // Standard URLs: https://vimeo.com/<id>
          videoId = url.pathname.replace(/^\/+/, '');
        }

        if (videoId) {
          const embedSrc = `https://player.vimeo.com/video/${encodeURIComponent(videoId)}`;
          return { type: 'vimeo', src: embedSrc };
        }

        // If we couldn't confidently extract an ID, fall back to the raw URL
        return { type: 'raw', src: rawUrl };
      }

      // Unknown host: do not transform, render as provided
      return { type: 'raw', src: rawUrl };
    } catch {
      // Malformed URL: fall back to raw string
      return { type: 'raw', src: rawUrl };
    }
  };

  return (
    <div className="space-y-6">
      {/* Lesson Header — HUD-framed title area */}
      <div className="lesson-section-frame">
        <Badge
          variant="outline"
          className="mb-3 border-primary/50 bg-primary/10 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.2)]"
        >
          {getTypeIcon()}
          <span className="ml-1">{getTypeName()}</span>
          {lesson.duration_minutes && (
            <span className="ml-2 text-muted-foreground">• {lesson.duration_minutes} min</span>
          )}
        </Badge>
        <h1 className="text-2xl md:text-3xl font-display font-bold neon-text">
          {lesson.title}
        </h1>
      </div>

      {/* Video Player — shown for video-type lessons */}
      {lesson.type === 'video' && lesson.video_url && (
        <div className="aspect-video bg-black/50 rounded-lg overflow-hidden border border-primary/30 shadow-[0_0_30px_hsl(var(--primary)/0.2)]">
          {(() => {
            const { type, src } = getEmbeddedVideoSrc(lesson.video_url);

            if (type === 'youtube') {
              return (
                <iframe
                  src={src}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              );
            }

            if (type === 'vimeo') {
              return (
                <iframe
                  src={src}
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; fullscreen; picture-in-picture"
                />
              );
            }

            return <video src={lesson.video_url} controls className="w-full h-full" />;
          })()}
        </div>
      )}

      {/* Placeholder for video lessons without URL */}
      {lesson.type === 'video' && !lesson.video_url && (
        <div className="aspect-video bg-black/50 rounded-lg overflow-hidden border border-primary/30 flex items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
              <Video className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground">Video content coming soon</p>
          </div>
        </div>
      )}

      {/* Text / Instructional Content — rendered with rich prose styling */}
      {lesson.content && (
        <div
          className="lesson-prose"
          dangerouslySetInnerHTML={{ __html: sanitizeAndFormat(lesson.content) }}
        />
      )}

      {/* ── Interactive Quiz ─────────────────────────────────────────────── */}
      {lesson.type === 'quiz' && lesson.quiz_data && (
        <div className="mt-6 pt-6 border-t border-primary/20">
          <QuizPlayer
            quizData={lesson.quiz_data}
            initialScore={quizScore}
            attemptCount={quizAttempts ?? 0}
            onComplete={onQuizSubmit ?? (() => {})}
          />
        </div>
      )}

      {/* Placeholder for quiz lessons that have no quiz_data yet */}
      {lesson.type === 'quiz' && !lesson.quiz_data && !lesson.content && (
        <div className="bg-black/30 border border-secondary/20 border-dashed rounded-lg p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_hsl(var(--secondary)/0.3)]">
            <Sparkles className="h-8 w-8 text-secondary" />
          </div>
          <p className="text-muted-foreground">Quiz questions coming soon</p>
        </div>
      )}

      {/* ── Activity Player ──────────────────────────────────────────────── */}
      {lesson.type === 'activity' && lesson.activity_data && (
        <div className="mt-6 pt-6 border-t border-primary/20">
          <ActivityViewer
            activityData={lesson.activity_data}
            onProgressChange={onActivityProgress}
            initialScore={activityScore}
          />
        </div>
      )}

      {/* Placeholder for activity lessons that have no activity_data yet */}
      {lesson.type === 'activity' && !lesson.activity_data && !lesson.content && (
        <div className="bg-black/30 border border-primary/20 border-dashed rounded-lg p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
            <Activity className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Activity content coming soon</p>
        </div>
      )}

      {/* ── Worksheet ────────────────────────────────────────────────────── */}
      {lesson.type === 'worksheet' && lesson.worksheet_data && (
        <div className="mt-6 pt-6 border-t border-primary/20">
          <WorksheetViewer
            worksheetData={lesson.worksheet_data}
            savedResponses={savedNotes}
            onSave={onSaveNotes ?? (() => {})}
          />
        </div>
      )}

      {/* Placeholder for worksheet lessons that have no worksheet_data yet */}
      {lesson.type === 'worksheet' && !lesson.worksheet_data && !lesson.content && (
        <div className="bg-black/30 border border-accent/20 border-dashed rounded-lg p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_hsl(var(--accent)/0.3)]">
            <FileQuestion className="h-8 w-8 text-accent" />
          </div>
          <p className="text-muted-foreground">Worksheet coming soon</p>
        </div>
      )}

      {/* ── Assignment Submission ─────────────────────────────────────────── */}
      {lesson.type === 'assignment' && (
        <AssignmentSubmission
          lesson={lesson}
          isCompleted={isCompleted}
          existingNotes={existingNotes}
        />
      )}

      {/* Fallback for text lessons with no content */}
      {lesson.type === 'text' && !lesson.content && (
        <div className="bg-black/30 border border-primary/20 border-dashed rounded-lg p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Lesson content coming soon</p>
        </div>
      )}

      {/* ── Practice Lab ─────────────────────────────────────────────────── */}
      {/* Shown for ANY lesson type that has a practice lab attached */}
      {practiceLab && userId && courseId && (
        <div className="mt-8 pt-8 border-t border-accent/20">
          <PracticeLabPlayer
            lab={practiceLab}
            userId={userId}
            courseId={courseId}
          />
        </div>
      )}
    </div>
  );
}
