import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lesson } from '@/hooks/useAdmin';
import { 
  FileText, 
  Video, 
  HelpCircle, 
  FileSpreadsheet, 
  Zap,
  Pencil,
  Trash2,
  GripVertical,
  Clock,
  Eye,
  EyeOff,
  Copy
} from 'lucide-react';

interface SortableLessonItemProps {
  lesson: Lesson;
  index: number;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
  
  onTogglePublish: (lesson: Lesson) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

const typeIcons: Record<string, React.ReactNode> = {
  text: <FileText className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  quiz: <HelpCircle className="h-4 w-4" />,
  worksheet: <FileSpreadsheet className="h-4 w-4" />,
  activity: <Zap className="h-4 w-4" />,
};

const typeLabels: Record<string, string> = {
  text: 'Lecture',
  video: 'Video',
  quiz: 'Quiz',
  worksheet: 'Worksheet',
  activity: 'Activity',
};

export function SortableLessonItem({ 
  lesson, 
  index, 
  onEdit, 
  onDelete, 
  
  onTogglePublish,
  isUpdating,
  isDeleting 
}: SortableLessonItemProps) {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  const handleTitleClick = () => {
    navigate(`/admin/courses/${lesson.course_id}/lessons/${lesson.id}`);
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`hover:bg-muted/50 transition-colors ${isDragging ? 'shadow-lg' : ''}`}
    >
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>
          
          <span className="text-sm font-medium text-muted-foreground w-8">
            {index + 1}.
          </span>

          <div className="flex items-center gap-2">
            {typeIcons[lesson.type]}
            <Badge variant="secondary" className="text-xs">
              {typeLabels[lesson.type]}
            </Badge>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <button
                onClick={handleTitleClick}
                className="font-medium truncate text-left hover:text-primary hover:underline transition-colors cursor-pointer"
              >
                {lesson.title}
              </button>
              <Badge variant={lesson.is_published ? 'default' : 'outline'} className="text-xs">
                {lesson.is_published ? 'Published' : 'Draft'}
              </Badge>
            </div>
          </div>

          {lesson.duration_minutes && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {lesson.duration_minutes}m
            </div>
          )}

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onTogglePublish(lesson)}
              disabled={isUpdating}
              title={lesson.is_published ? 'Unpublish' : 'Publish'}
            >
              {lesson.is_published ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(lesson)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(lesson)}
              disabled={isDeleting}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
