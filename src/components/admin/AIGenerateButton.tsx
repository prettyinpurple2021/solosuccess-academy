/**
 * @file AIGenerateButton.tsx — AI Content Generation Trigger
 *
 * PURPOSE: Reusable button + dialog that calls the generate-content edge function
 * to create lesson content, quiz questions, worksheets, or activities via AI.
 * Shows a loading state, then passes the generated content back via onGenerated callback.
 *
 * PRODUCTION TODO:
 * - Add prompt customization in the dialog
 * - Show generation history/versioning
 * - Add "regenerate" option with different parameters
 */
import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Loader2 } from 'lucide-react';
import { useContentGenerator, ContentType, GenerateContext } from '@/hooks/useContentGenerator';

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

  const handleGenerate = async () => {
    const generatedContext: GenerateContext = {
      ...context,
      topic: topic || context.topic,
      difficulty,
      questionCount,
    };

    const content = await generateContent(type, generatedContext);
    if (content) {
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
      case 'course_outline':
        return 'Generate Course Outline';
      case 'lesson_content':
        return 'Generate Lesson Content';
      case 'quiz':
        return 'Generate Quiz Questions';
      case 'worksheet':
        return 'Generate Worksheet';
      case 'activity':
        return 'Generate Activity';
      case 'exam':
        return 'Generate Final Exam';
      default:
        return 'Generate Content';
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
      <DialogContent className="sm:max-w-[425px]">
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
          <div className="grid gap-2">
            <Label htmlFor="topic">Topic or Focus</Label>
            <Input
              id="topic"
              placeholder="e.g., Building a personal brand"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

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
