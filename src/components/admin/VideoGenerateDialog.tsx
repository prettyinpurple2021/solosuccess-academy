import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVideoGenerator } from '@/hooks/useVideoGenerator';
import { Video, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VideoGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVideoGenerated?: (videoUrl: string) => void;
  context?: {
    topic?: string;
    type?: 'lesson_explainer' | 'concept_animation' | 'intro_video';
  };
}

export function VideoGenerateDialog({
  open,
  onOpenChange,
  onVideoGenerated,
  context,
}: VideoGenerateDialogProps) {
  const [prompt, setPrompt] = useState(context?.topic || '');
  const [duration, setDuration] = useState<'5' | '10'>('5');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [referenceImageUrl, setReferenceImageUrl] = useState('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  const { generateVideo, uploadGeneratedVideo, isGenerating, progress } = useVideoGenerator();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    // Build enhanced prompt based on context
    let enhancedPrompt = prompt;
    if (context?.type === 'lesson_explainer') {
      enhancedPrompt = `Educational explainer video: ${prompt}. Style: Clean, professional, suitable for online learning. Smooth animations and clear visuals.`;
    } else if (context?.type === 'concept_animation') {
      enhancedPrompt = `Animated concept visualization: ${prompt}. Style: Abstract, modern motion graphics explaining the concept visually.`;
    } else if (context?.type === 'intro_video') {
      enhancedPrompt = `Course introduction video: ${prompt}. Style: Engaging, dynamic, welcoming atmosphere for learners.`;
    }

    const videoUrl = await generateVideo({
      prompt: enhancedPrompt,
      duration: parseInt(duration) as 5 | 10,
      aspectRatio,
      ...(referenceImageUrl && { imageUrl: referenceImageUrl }),
    });

    if (videoUrl) {
      setGeneratedVideoUrl(videoUrl);
    }
  };

  const handleSaveVideo = async () => {
    if (!generatedVideoUrl) return;

    const fileName = `${prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
    const savedUrl = await uploadGeneratedVideo(generatedVideoUrl, fileName);

    if (savedUrl && onVideoGenerated) {
      onVideoGenerated(savedUrl);
      onOpenChange(false);
      resetForm();
    }
  };

  const handleUseDirectUrl = () => {
    if (generatedVideoUrl && onVideoGenerated) {
      onVideoGenerated(generatedVideoUrl);
      onOpenChange(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setPrompt(context?.topic || '');
    setGeneratedVideoUrl(null);
    setReferenceImageUrl('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Generate AI Video
          </DialogTitle>
          <DialogDescription>
            Create educational videos using Runway AI. Requires a Runway API key configured in AI
            Settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Video generation requires a Runway API key.</span>
              <a
                href="/admin/ai-settings"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Configure <ExternalLink className="h-3 w-3" />
              </a>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="video-type">Video Type</Label>
            <Select
              value={context?.type || 'lesson_explainer'}
              onValueChange={() => {}}
              disabled
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lesson_explainer">Lesson Explainer</SelectItem>
                <SelectItem value="concept_animation">Concept Animation</SelectItem>
                <SelectItem value="intro_video">Course Intro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Video Description</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what should happen in the video..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select value={duration} onValueChange={(v) => setDuration(v as '5' | '10')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 seconds</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aspectRatio">Aspect Ratio</Label>
              <Select
                value={aspectRatio}
                onValueChange={(v) => setAspectRatio(v as '16:9' | '9:16' | '1:1')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                  <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                  <SelectItem value="1:1">1:1 (Square)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referenceImage">Reference Image URL (Optional)</Label>
            <Input
              id="referenceImage"
              type="url"
              value={referenceImageUrl}
              onChange={(e) => setReferenceImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-muted-foreground">
              Provide a starting image to guide the video generation.
            </p>
          </div>

          {generatedVideoUrl && (
            <div className="space-y-2">
              <Label>Generated Video</Label>
              <video
                src={generatedVideoUrl}
                controls
                className="w-full rounded-lg border"
                style={{ maxHeight: '300px' }}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          {!generatedVideoUrl ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {progress || 'Generating...'}
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4 mr-2" />
                    Generate Video
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={resetForm}>
                Generate Another
              </Button>
              <Button variant="secondary" onClick={handleUseDirectUrl}>
                Use Direct URL
              </Button>
              <Button onClick={handleSaveVideo}>Save to Library</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
