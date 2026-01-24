import { type Lesson } from '@/lib/courseData';
import { Badge } from '@/components/ui/badge';
import { FileText, Video, Sparkles, PenLine } from 'lucide-react';

interface LessonContentProps {
  lesson: Lesson;
}

export function LessonContent({ lesson }: LessonContentProps) {
  const getTypeIcon = () => {
    switch (lesson.type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'quiz':
        return <Sparkles className="h-4 w-4" />;
      case 'assignment':
        return <PenLine className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeName = () => {
    switch (lesson.type) {
      case 'video':
        return 'Video Lesson';
      case 'quiz':
        return 'Quiz';
      case 'assignment':
        return 'Assignment';
      default:
        return 'Reading';
    }
  };

  return (
    <div className="space-y-6">
      {/* Lesson Header */}
      <div>
        <Badge variant="outline" className="mb-3">
          {getTypeIcon()}
          <span className="ml-1">{getTypeName()}</span>
          {lesson.duration_minutes && (
            <span className="ml-2 text-muted-foreground">• {lesson.duration_minutes} min</span>
          )}
        </Badge>
        <h1 className="text-2xl md:text-3xl font-display font-bold">
          {lesson.title}
        </h1>
      </div>

      {/* Video Player */}
      {lesson.type === 'video' && lesson.video_url && (
        <div className="aspect-video bg-muted rounded-lg overflow-hidden">
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
        <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <Video className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Video content coming soon</p>
          </div>
        </div>
      )}

      {/* Text Content */}
      {lesson.content && (
        <div className="prose prose-invert max-w-none">
          <div 
            className="text-foreground leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ 
              __html: lesson.content
                .replace(/\n\n/g, '</p><p class="mb-4">')
                .replace(/\n/g, '<br/>')
                .replace(/^/, '<p class="mb-4">')
                .replace(/$/, '</p>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
            }}
          />
        </div>
      )}

      {/* Placeholder for lessons without content */}
      {!lesson.content && lesson.type !== 'video' && (
        <div className="bg-muted/30 border border-dashed rounded-lg p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Lesson content coming soon</p>
        </div>
      )}
    </div>
  );
}
