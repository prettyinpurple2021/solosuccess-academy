import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, Edit, RotateCcw } from 'lucide-react';

interface SmartPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  defaultPrompt: string;
  onGenerate: (prompt: string) => Promise<void>;
  isGenerating: boolean;
}

export function SmartPromptDialog({
  open,
  onOpenChange,
  title,
  description,
  defaultPrompt,
  onGenerate,
  isGenerating,
}: SmartPromptDialogProps) {
  const [customPrompt, setCustomPrompt] = useState(defaultPrompt);
  const [isEdited, setIsEdited] = useState(false);

  // Reset to default prompt when dialog opens
  useEffect(() => {
    if (open) {
      setCustomPrompt(defaultPrompt);
      setIsEdited(false);
    }
  }, [open, defaultPrompt]);

  const handlePromptChange = (value: string) => {
    setCustomPrompt(value);
    setIsEdited(value !== defaultPrompt);
  };

  const handleReset = () => {
    setCustomPrompt(defaultPrompt);
    setIsEdited(false);
  };

  const handleGenerate = async () => {
    await onGenerate(customPrompt);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="prompt" className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                AI Prompt
                {isEdited && (
                  <span className="text-xs text-muted-foreground">(edited)</span>
                )}
              </Label>
              {isEdited && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-7 text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset to default
                </Button>
              )}
            </div>
            <Textarea
              id="prompt"
              value={customPrompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              placeholder="Describe what you want the AI to generate..."
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              💡 This prompt is pre-populated based on the lesson context. Edit it to customize the output.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            variant="neon"
            onClick={handleGenerate}
            disabled={isGenerating || !customPrompt.trim()}
          >
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
