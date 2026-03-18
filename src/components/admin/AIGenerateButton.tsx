/**
 * @file AIGenerateButton.tsx — AI Content Generation Trigger
 *
 * PURPOSE: Reusable button + dialog that calls the generate-content edge function
 * to create lesson content, quiz questions, worksheets, or activities via AI.
 * Shows a loading state, then passes the generated content back via onGenerated callback.
 * Includes custom prompt textarea and generation history tracking.
 *
 * PRODUCTION TODO:
 * - Show generation history/versioning with database persistence
 */
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { Sparkles, Loader2, History, ChevronDown, RotateCcw } from 'lucide-react';
import { useContentGenerator, ContentType, GenerateContext } from '@/hooks/useContentGenerator';

/** A single entry in the in-memory generation history */
interface HistoryEntry {
  timestamp: Date;
  type: ContentType;
  topic: string;
  difficulty: string;
  // We store a truncated preview of what was generated
  preview: string;
  content: any;
}

interface AIGenerateButtonProps {
  type: ContentType;
  context?: GenerateContext;
  onGenerated: (content: any) => void;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'ghost' | 'secondary';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  showDialog?: boolean;
}

export function AIGenerateButton({
  type,
  context = {},
  onGenerated,
  buttonText = 'Generate with AI',
  buttonVariant = 'outline',
  buttonSize = 'sm',
  showDialog = true,
}: AIGenerateButtonProps) {
  const { generateContent, isGenerating } = useContentGenerator();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [topic, setTopic] = useState(context.topic || '');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>(
    context.difficulty || 'intermediate'
  );
  const [questionCount, setQuestionCount] = useState(context.questionCount || 5);

  // --- Custom prompt support ---
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);

  // --- In-memory generation history (per-session) ---
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  /**
   * Generate a short preview string from any content type.
   * Used for the history panel so admins can identify past generations.
   */
  const getPreview = useCallback((content: any): string => {
    if (typeof content === 'string') return content.substring(0, 80);
    if (content?.questions) return `${content.questions.length} questions generated`;
    if (content?.worksheets) return `${content.worksheets.length} worksheet(s) generated`;
    if (content?.activities) return `${content.activities.length} activity/activities generated`;
    return JSON.stringify(content).substring(0, 80);
  }, []);

  const handleGenerate = async () => {
    const generatedContext: GenerateContext = {
      ...context,
      topic: topic || context.topic,
      difficulty,
      questionCount,
      // Pass custom prompt as additional instructions
      ...(customPrompt.trim() ? { customPrompt: customPrompt.trim() } : {}),
    };

    const content = await generateContent(type, generatedContext);
    if (content) {
      // Add to history
      setHistory((prev) => [
        {
          timestamp: new Date(),
          type,
          topic: topic || context.topic || 'Untitled',
          difficulty,
          preview: getPreview(content),
          content,
        },
        ...prev,
      ]);
      onGenerated(content);
      setDialogOpen(false);
    }
  };

  const handleQuickGenerate = async () => {
    const content = await generateContent(type, context);
    if (content) {
      onGenerated(content);
    }
  };

  /**
   * Restore a previous generation from history.
   * This lets the admin "undo" by re-applying old content.
   */
  const handleRestoreFromHistory = (entry: HistoryEntry) => {
    onGenerated(entry.content);
    setDialogOpen(false);
  };

  // --- No-dialog mode: quick generate button ---
  if (!showDialog) {
    return (
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={handleQuickGenerate}
        disabled={isGenerating}
        className="border-primary/50 hover:border-primary hover:bg-primary/10"
      >
        {isGenerating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        {isGenerating ? 'Generating...' : buttonText}
      </Button>
    );
  }

  const getDialogTitle = () => {
    switch (type) {
      case 'course_outline': return 'Generate Course Outline';
      case 'lesson_content': return 'Generate Lesson Content';
      case 'quiz': return 'Generate Quiz Questions';
      case 'worksheet': return 'Generate Worksheet';
      case 'activity': return 'Generate Activity';
      case 'exam': return 'Generate Final Exam';
      default: return 'Generate Content';
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant={buttonVariant}
          size={buttonSize}
          className="border-primary/50 hover:border-primary hover:bg-primary/10"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>
            Provide some context and let AI generate content for you.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Topic input */}
          <div className="grid gap-2">
            <Label htmlFor="topic">Topic or Focus</Label>
            <Input
              id="topic"
              placeholder="e.g., Building a personal brand"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          {/* Difficulty selector */}
          <div className="grid gap-2">
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Question count for quiz/exam types */}
          {(type === 'quiz' || type === 'exam') && (
            <div className="grid gap-2">
              <Label htmlFor="questionCount">Number of Questions</Label>
              <Input
                id="questionCount"
                type="number"
                min={1}
                max={30}
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value) || 5)}
              />
            </div>
          )}

          {/* Custom prompt textarea (collapsible) */}
          <Collapsible open={showCustomPrompt} onOpenChange={setShowCustomPrompt}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground">
                Custom Prompt Instructions
                <ChevronDown className={`h-4 w-4 transition-transform ${showCustomPrompt ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Add specific instructions for the AI, e.g., 'Focus on real-world examples for freelancers' or 'Include case studies from tech startups'..."
                rows={3}
                className="text-sm"
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Generation history (collapsible) */}
          {history.length > 0 && (
            <Collapsible open={showHistory} onOpenChange={setShowHistory}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <History className="h-3 w-3" />
                    Generation History ({history.length})
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <ScrollArea className="max-h-[150px]">
                  <div className="space-y-1">
                    {history.map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 rounded-md bg-muted/30 text-xs hover:bg-muted/50 cursor-pointer group"
                        onClick={() => handleRestoreFromHistory(entry)}
                        title="Click to restore this generation"
                      >
                        <RotateCcw className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{entry.topic}</p>
                          <p className="text-muted-foreground truncate">{entry.preview}</p>
                        </div>
                        <span className="text-muted-foreground whitespace-nowrap">
                          {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
