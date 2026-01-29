import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useImageGenerator, ImageContextType } from '@/hooks/useImageGenerator';
import { Image, Loader2, Sparkles, Download, X } from 'lucide-react';

interface ImageGenerateDialogProps {
  topic?: string;
  onImageGenerated?: (imageUrl: string) => void;
  trigger?: React.ReactNode;
}

const IMAGE_TYPES: { value: ImageContextType; label: string; description: string }[] = [
  { value: 'textbook_illustration', label: 'Textbook Illustration', description: 'Educational diagram or illustration' },
  { value: 'lesson_thumbnail', label: 'Lesson Thumbnail', description: 'Eye-catching banner image' },
  { value: 'concept_diagram', label: 'Concept Diagram', description: 'Labeled diagram explaining a concept' },
  { value: 'general', label: 'General Image', description: 'Any type of image' },
];

const MODELS = [
  { value: 'google/gemini-2.5-flash-image', label: 'Gemini Flash (Fast)', description: 'Quick generation' },
  { value: 'google/gemini-3-pro-image-preview', label: 'Gemini Pro (High Quality)', description: 'Better quality, slower' },
];

export function ImageGenerateDialog({ topic, onImageGenerated, trigger }: ImageGenerateDialogProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState(topic || '');
  const [imageType, setImageType] = useState<ImageContextType>('textbook_illustration');
  const [model, setModel] = useState('google/gemini-2.5-flash-image');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  const { generateImage, uploadGeneratedImage, isGenerating } = useImageGenerator();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    const result = await generateImage(prompt, { type: imageType, topic: prompt }, model);
    if (result?.imageUrl) {
      setGeneratedImage(result.imageUrl);
    }
  };

  const handleUseImage = async () => {
    if (generatedImage && onImageGenerated) {
      // If the callback is provided, pass the base64 URL directly
      // The parent component can decide whether to upload it
      onImageGenerated(generatedImage);
      setOpen(false);
      resetForm();
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `generated-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetForm = () => {
    setPrompt(topic || '');
    setGeneratedImage(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Image className="h-4 w-4 mr-2" />
            Generate Image
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Image Generation
          </DialogTitle>
          <DialogDescription>
            Generate educational images using Lovable AI (powered by Google Gemini).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Describe the image</Label>
            <Input
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A diagram showing the water cycle with labeled arrows"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Image Type</Label>
              <Select value={imageType} onValueChange={(v) => setImageType(v as ImageContextType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {generatedImage && (
            <div className="space-y-2">
              <Label>Generated Image</Label>
              <div className="relative rounded-lg border border-border overflow-hidden bg-muted/20">
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="w-full h-auto max-h-64 object-contain"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                  onClick={() => setGeneratedImage(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {generatedImage ? (
            <>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Regenerate
              </Button>
              {onImageGenerated && (
                <Button onClick={handleUseImage}>
                  Use This Image
                </Button>
              )}
            </>
          ) : (
            <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Image
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
