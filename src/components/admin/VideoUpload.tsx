/**
 * @file VideoUpload.tsx — Video File Upload Component
 *
 * PURPOSE: Handles video file upload to Supabase Storage for lesson video content.
 * Shows upload progress, current video URL, and supports URL-only input as
 * an alternative to file upload (for external video hosting).
 * Includes YouTube/Vimeo URL embed preview.
 *
 * STORAGE: Files uploaded to 'lesson-videos' bucket under {courseId}/{lessonId}/ path.
 *
 * PRODUCTION TODO:
 * - Add video transcoding pipeline for adaptive bitrate streaming
 * - Add video thumbnail generation
 * - Implement chunked upload for large files (>100MB)
 */
import { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { uploadLessonVideo } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { Upload, Video, Link, Loader2, X, ExternalLink } from 'lucide-react';

interface VideoUploadProps {
  courseId: string;
  lessonId: string;
  currentUrl: string;
  onUpload: (url: string) => void;
}

/**
 * Extract a YouTube video ID from various URL formats.
 * Supports: youtube.com/watch?v=, youtu.be/, youtube.com/embed/
 */
function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Extract a Vimeo video ID from various URL formats.
 * Supports: vimeo.com/{id}, player.vimeo.com/video/{id}
 */
function getVimeoId(url: string): string | null {
  const match = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  return match ? match[1] : null;
}

/**
 * Determine the embed URL for a given video URL (YouTube or Vimeo).
 * Returns null if the URL is not a recognized embed format.
 */
function getEmbedUrl(url: string): { embedUrl: string; platform: string } | null {
  const ytId = getYouTubeId(url);
  if (ytId) return { embedUrl: `https://www.youtube.com/embed/${ytId}`, platform: 'YouTube' };

  const vimeoId = getVimeoId(url);
  if (vimeoId) return { embedUrl: `https://player.vimeo.com/video/${vimeoId}`, platform: 'Vimeo' };

  return null;
}

export function VideoUpload({ courseId, lessonId, currentUrl, onUpload }: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [manualUrl, setManualUrl] = useState(currentUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Determine if the current URL is embeddable (YouTube/Vimeo)
  const embedInfo = useMemo(() => (currentUrl ? getEmbedUrl(currentUrl) : null), [currentUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a video file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select a video under 500MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for now (Supabase doesn't provide upload progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const publicUrl = await uploadLessonVideo(courseId, lessonId, file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      onUpload(publicUrl);
      setManualUrl(publicUrl);
      toast({ title: 'Video uploaded!' });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleManualUrl = () => {
    if (manualUrl.trim()) {
      onUpload(manualUrl.trim());
      toast({ title: 'Video URL saved!' });
    }
  };

  const handleRemove = () => {
    onUpload('');
    setManualUrl('');
  };

  return (
    <div className="space-y-6">
      {/* File upload section */}
      <div className="space-y-2">
        <Label>Upload Video</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Choose Video File
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        {isUploading && (
          <Progress value={uploadProgress} className="h-2" />
        )}
        <p className="text-xs text-muted-foreground">
          Supports MP4, WebM, MOV. Max 500MB.
        </p>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or paste URL</span>
        </div>
      </div>

      {/* URL input section with YouTube/Vimeo support */}
      <div className="space-y-2">
        <Label htmlFor="video-url">Video URL</Label>
        <div className="flex gap-2">
          <Input
            id="video-url"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
          />
          <Button variant="secondary" onClick={handleManualUrl}>
            <Link className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          YouTube, Vimeo, or direct video URLs supported. Embeds auto-detected.
        </p>
      </div>

      {/* Current video display with embed preview */}
      {currentUrl && (
        <div className="space-y-3">
          <Label>Current Video</Label>

          {/* YouTube/Vimeo embed preview */}
          {embedInfo && (
            <div className="rounded-lg overflow-hidden border bg-black aspect-video">
              <iframe
                src={embedInfo.embedUrl}
                title={`${embedInfo.platform} video preview`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* URL display + remove button */}
          <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
            <Video className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm truncate flex-1">{currentUrl}</span>
            {embedInfo && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                {embedInfo.platform}
              </span>
            )}
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <Button variant="ghost" size="icon" onClick={handleRemove}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
