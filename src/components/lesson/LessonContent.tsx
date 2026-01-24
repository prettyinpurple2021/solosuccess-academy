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

      {/* Video Player */}
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

      {/* Text Content */}
      {lesson.content && (
        <div className="prose prose-invert max-w-none">
          <div 
            className="text-foreground/90 leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ 
              __html: lesson.content
                .replace(/\n\n/g, '</p><p class="mb-4">')
                .replace(/\n/g, '<br/>')
                .replace(/^/, '<p class="mb-4">')
                .replace(/$/, '</p>')
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-cyan-300">$1</strong>')
                .replace(/\*(.*?)\*/g, '<em class="text-primary/80">$1</em>')
                .replace(/`(.*?)`/g, '<code class="bg-primary/20 px-1.5 py-0.5 rounded text-sm text-cyan-300 border border-primary/30">$1</code>')
            }}
          />
        </div>
      )}

      {/* Placeholder for lessons without content */}
      {!lesson.content && lesson.type !== 'video' && (
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