import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, FileText, Video, Mic, Edit } from 'lucide-react';
import { useContentGenerator } from '@/hooks/useContentGenerator';
import { SmartPromptDialog } from './SmartPromptDialog';
import { VoiceGenerateDialog } from '@/components/admin/VoiceGenerateDialog';
import { VideoGenerateDialog } from '@/components/admin/VideoGenerateDialog';

interface LessonContentSectionProps {
  lessonTitle: string;
  courseTitle: string;
  content: string;
  videoUrl: string;
  onContentChange: (content: string) => void;
  onVideoUrlChange: (url: string) => void;
  smartPrompt: string;
}

export function LessonContentSection({
  lessonTitle,
  courseTitle,
  content,
  videoUrl,
  onContentChange,
  onVideoUrlChange,
  smartPrompt,
}: LessonContentSectionProps) {
  const { generateContent, isGenerating } = useContentGenerator();
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [showVoiceDialog, setShowVoiceDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);

  const handleGenerate = async (customPrompt: string) => {
    const result = await generateContent('lesson_content', {
      lessonTitle,
      courseTitle,
      topic: lessonTitle,
    }, customPrompt);
    
    if (result && typeof result === 'string') {
      onContentChange(result);
    }
    setShowPromptDialog(false);
  };

  return (
    <>
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Lecture Content</CardTitle>
                <CardDescription>Main lesson content (supports Markdown)</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {content && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVoiceDialog(true)}
                    className="border-accent/50 hover:border-accent hover:bg-accent/10 hover:text-accent"
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    Generate Voice
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVideoDialog(true)}
                    className="border-secondary/50 hover:border-secondary hover:bg-secondary/10 hover:text-secondary"
                  >
                    <Video className="mr-2 h-4 w-4" />
                    Generate Video
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPromptDialog(true)}
                disabled={isGenerating}
                className="border-primary/50 hover:border-primary hover:bg-primary/10 hover:text-primary"
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate with AI
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder="Write your lesson content here... Markdown is supported."
              rows={16}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoUrl">Video URL (optional)</Label>
            <Input
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => onVideoUrlChange(e.target.value)}
              placeholder="https://youtube.com/watch?v=... or uploaded video URL"
            />
          </div>
        </CardContent>
      </Card>

      <SmartPromptDialog
        open={showPromptDialog}
        onOpenChange={setShowPromptDialog}
        title="Generate Lecture Content"
        description="AI will create comprehensive lesson content based on your prompt."
        defaultPrompt={smartPrompt}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />

      {showVoiceDialog && (
        <VoiceGenerateDialog
          open={showVoiceDialog}
          onOpenChange={setShowVoiceDialog}
          lessonContent={content}
          lessonTitle={lessonTitle}
        />
      )}

      {showVideoDialog && (
        <VideoGenerateDialog
          open={showVideoDialog}
          onOpenChange={setShowVideoDialog}
          context={{ topic: lessonTitle, type: 'lesson_explainer' }}
        />
      )}
    </>
  );
}
