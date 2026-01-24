import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { uploadLessonVideo } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { Upload, Video, Link, Loader2, X } from 'lucide-react';

interface VideoUploadProps {
  courseId: string;
  lessonId: string;
  currentUrl: string;
  onUpload: (url: string) => void;
}

export function VideoUpload({ courseId, lessonId, currentUrl, onUpload }: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [manualUrl, setManualUrl] = useState(currentUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or paste URL</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="video-url">Video URL</Label>
        <div className="flex gap-2">
          <Input
            id="video-url"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://..."
          />
          <Button variant="secondary" onClick={handleManualUrl}>
            <Link className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          YouTube, Vimeo, or direct video URLs supported
        </p>
      </div>

      {currentUrl && (
        <div className="space-y-2">
          <Label>Current Video</Label>
          <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
            <Video className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm truncate flex-1">{currentUrl}</span>
            <Button variant="ghost" size="icon" onClick={handleRemove}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
