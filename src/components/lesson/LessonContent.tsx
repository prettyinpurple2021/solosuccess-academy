/**
 * @file LessonContent.tsx — Main Lesson Content Renderer
 * 
 * Renders different content based on the lesson type:
 * - text: Rich text content with formatting
 * - video: Embedded video player + text content
 * - quiz: Text content + interactive quiz (TODO: QuizPlayer)
 * - assignment: Text content + inline submission form
 * - worksheet: Text content + worksheet exercises (TODO: WorksheetViewer)
 * - activity: Text content + step-by-step player (TODO: ActivityPlayer)
 * 
 * This component handles TYPE BRANCHING — the key missing piece
 * that ensures each lesson type gets its appropriate interactive UI.
 */
import DOMPurify from 'dompurify';
import { type Lesson } from '@/lib/courseData';
import { Badge } from '@/components/ui/badge';
import { FileText, Video, Sparkles, PenLine, BookOpen, Zap } from 'lucide-react';
import { AssignmentSubmission } from './AssignmentSubmission';

interface LessonContentProps {
  /** The lesson to render */
  lesson: Lesson;
  /** Whether the current user has completed this lesson */
  isCompleted?: boolean;
  /** Existing notes/submission from user_progress (used for assignments) */
  existingNotes?: string | null;
}

// Sanitize and format content to prevent XSS attacks
const sanitizeAndFormat = (content: string): string => {
  const formatted = content
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p class="mb-4">')
    .replace(/$/, '</p>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-cyan-300">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-primary/80">$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-primary/20 px-1.5 py-0.5 rounded text-sm text-cyan-300 border border-primary/30">$1</code>');
  
  return DOMPurify.sanitize(formatted, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'h1', 'h2', 'h3', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['class']
  });
};

export function LessonContent({ lesson, isCompleted = false, existingNotes = null }: LessonContentProps) {
  /** Returns the icon for the lesson type badge */
  const getTypeIcon = () => {
    switch (lesson.type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'quiz':
        return <Sparkles className="h-4 w-4" />;
      case 'assignment':
        return <PenLine className="h-4 w-4" />;
      case 'worksheet':
        return <BookOpen className="h-4 w-4" />;
      case 'activity':
        return <Zap className="h-4 w-4" />;
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
      case 'worksheet':
        return 'Worksheet';
      case 'activity':
        return 'Activity';
      default:
        return 'Reading';
    }
  };

  return (
    <div className="space-y-6">
      {/* Lesson Header */}
      <div>
        <Badge 
          variant="outline" 
          className="mb-3 border-primary/50 bg-primary/10 text-primary shadow-[0_0_10px_rgba(168,85,247,0.2)]"
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
        <div className="aspect-video bg-black/50 rounded-lg overflow-hidden border border-primary/30 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
          {lesson.video_url.includes('youtube.com') || lesson.video_url.includes('youtu.be') ? (
            <iframe
              src={lesson.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : lesson.video_url.includes('vimeo.com') ? (
            <iframe
              src={lesson.video_url.replace('vimeo.com/', 'player.vimeo.com/video/')}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture"
            />
          ) : (
            <video
              src={lesson.video_url}
              controls
              className="w-full h-full"
            />
          )}
        </div>
      )}

      {/* Placeholder for video lessons without URL */}
      {lesson.type === 'video' && !lesson.video_url && (
        <div className="aspect-video bg-black/50 rounded-lg overflow-hidden border border-primary/30 flex items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              <Video className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground">Video content coming soon</p>
          </div>
        </div>
      )}

      {/* Text Content — shown for ALL lesson types that have content */}
      {lesson.content && (
        <div className="prose prose-invert max-w-none">
          <div 
            className="text-foreground/90 leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: sanitizeAndFormat(lesson.content) }}
          />
        </div>
      )}

      {/* === TYPE-SPECIFIC INTERACTIVE SECTIONS === */}

      {/* Assignment Submission Form — shown for assignment-type lessons */}
      {lesson.type === 'assignment' && (
        <AssignmentSubmission
          lesson={lesson}
          isCompleted={isCompleted}
          existingNotes={existingNotes}
        />
      )}

      {/* Quiz Player — placeholder for future implementation */}
      {lesson.type === 'quiz' && !lesson.content && (
        <div className="bg-black/30 border border-secondary/20 border-dashed rounded-lg p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_hsl(var(--secondary)/0.3)]">
            <Sparkles className="h-8 w-8 text-secondary" />
          </div>
          <p className="text-muted-foreground">Interactive quiz coming soon</p>
        </div>
      )}

      {/* Worksheet Viewer — placeholder for future implementation */}
      {lesson.type === 'worksheet' && !lesson.content && (
        <div className="bg-black/30 border border-accent/20 border-dashed rounded-lg p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_hsl(var(--accent)/0.3)]">
            <BookOpen className="h-8 w-8 text-accent" />
          </div>
          <p className="text-muted-foreground">Interactive worksheet coming soon</p>
        </div>
      )}

      {/* Activity Player — placeholder for future implementation */}
      {lesson.type === 'activity' && !lesson.content && (
        <div className="bg-black/30 border border-primary/20 border-dashed rounded-lg p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Interactive activity coming soon</p>
        </div>
      )}

      {/* Fallback: Lessons with no content AND not a special type */}
      {!lesson.content && lesson.type === 'text' && (
        <div className="bg-black/30 border border-primary/20 border-dashed rounded-lg p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Lesson content coming soon</p>
        </div>
      )}
    </div>
  );
}
