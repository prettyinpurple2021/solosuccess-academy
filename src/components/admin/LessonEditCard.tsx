import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Video,
  HelpCircle,
  ClipboardList,
  Zap,
  PenLine,
  Trash2,
  GripVertical,
} from 'lucide-react';

export interface LessonData {
  title: string;
  type: string;
  content?: string;
  quiz_data?: {
    questions: Array<{
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }>;
  };
  worksheet_data?: any;
  activity_data?: any;
}

interface LessonEditCardProps {
  lesson: LessonData;
  index: number;
  onUpdate: (index: number, lesson: LessonData) => void;
  onDelete: (index: number) => void;
}

const lessonTypeIcons: Record<string, React.ElementType> = {
  text: FileText,
  video: Video,
  quiz: HelpCircle,
  worksheet: ClipboardList,
  activity: Zap,
  assignment: PenLine,
};

const lessonTypes = [
  { value: 'text', label: 'Text Lesson' },
  { value: 'video', label: 'Video Lesson' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'worksheet', label: 'Worksheet' },
  { value: 'activity', label: 'Activity' },
  { value: 'assignment', label: 'Assignment' },
];

export function LessonEditCard({ lesson, index, onUpdate, onDelete }: LessonEditCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = lessonTypeIcons[lesson.type] || FileText;

  const handleFieldChange = (field: keyof LessonData, value: any) => {
    onUpdate(index, { ...lesson, [field]: value });
  };

  const handleQuizQuestionChange = (qIndex: number, field: string, value: any) => {
    if (!lesson.quiz_data?.questions) return;
    
    const newQuestions = [...lesson.quiz_data.questions];
    newQuestions[qIndex] = { ...newQuestions[qIndex], [field]: value };
    handleFieldChange('quiz_data', { ...lesson.quiz_data, questions: newQuestions });
  };

  const handleQuizOptionChange = (qIndex: number, optIndex: number, value: string) => {
    if (!lesson.quiz_data?.questions) return;
    
    const newQuestions = [...lesson.quiz_data.questions];
    const newOptions = [...newQuestions[qIndex].options];
    newOptions[optIndex] = value;
    newQuestions[qIndex] = { ...newQuestions[qIndex], options: newOptions };
    handleFieldChange('quiz_data', { ...lesson.quiz_data, questions: newQuestions });
  };

  return (
    <Card className="border-border/50 bg-background/50 hover:border-primary/30 transition-colors">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-primary/5 transition-colors">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Badge variant="secondary" className="text-xs shrink-0">
                <Icon className="h-3 w-3 mr-1" />
                {lesson.type}
              </Badge>
              <span className="text-sm font-medium truncate">{lesson.title}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(index);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 space-y-4 border-t border-border/50">
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={lesson.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  placeholder="Lesson title"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={lesson.type}
                  onValueChange={(v) => handleFieldChange('type', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {lessonTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Text/Video Content */}
            {(lesson.type === 'text' || lesson.type === 'video' || lesson.type === 'assignment') && (
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={lesson.content || ''}
                  onChange={(e) => handleFieldChange('content', e.target.value)}
                  placeholder="Lesson content..."
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            )}

            {/* Quiz Questions */}
            {lesson.type === 'quiz' && lesson.quiz_data?.questions && (
              <div className="space-y-4">
                <Label>Quiz Questions ({lesson.quiz_data.questions.length})</Label>
                {lesson.quiz_data.questions.map((q, qIndex) => (
                  <div key={qIndex} className="p-3 border border-border/50 rounded-lg space-y-3 bg-muted/20">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium text-primary mt-2">Q{qIndex + 1}</span>
                      <Textarea
                        value={q.question}
                        onChange={(e) => handleQuizQuestionChange(qIndex, 'question', e.target.value)}
                        placeholder="Question..."
                        rows={2}
                        className="flex-1 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 pl-6">
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={q.correctIndex === optIndex}
                            onChange={() => handleQuizQuestionChange(qIndex, 'correctIndex', optIndex)}
                            className="accent-primary"
                          />
                          <Input
                            value={opt}
                            onChange={(e) => handleQuizOptionChange(qIndex, optIndex, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                            className="text-sm h-8"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="pl-6">
                      <Input
                        value={q.explanation || ''}
                        onChange={(e) => handleQuizQuestionChange(qIndex, 'explanation', e.target.value)}
                        placeholder="Explanation for correct answer..."
                        className="text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Worksheet Data */}
            {lesson.type === 'worksheet' && lesson.worksheet_data && (
              <div className="space-y-2">
                <Label>Worksheet Data (JSON)</Label>
                <Textarea
                  value={JSON.stringify(lesson.worksheet_data, null, 2)}
                  onChange={(e) => {
                    try {
                      handleFieldChange('worksheet_data', JSON.parse(e.target.value));
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  rows={8}
                  className="font-mono text-xs"
                />
              </div>
            )}

            {/* Activity Data */}
            {lesson.type === 'activity' && lesson.activity_data && (
              <div className="space-y-2">
                <Label>Activity Data (JSON)</Label>
                <Textarea
                  value={JSON.stringify(lesson.activity_data, null, 2)}
                  onChange={(e) => {
                    try {
                      handleFieldChange('activity_data', JSON.parse(e.target.value));
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  rows={8}
                  className="font-mono text-xs"
                />
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
