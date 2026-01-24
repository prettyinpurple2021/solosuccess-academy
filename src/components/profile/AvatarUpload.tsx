import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';
import { uploadAvatar, useUpdateAvatar } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  displayName: string | null;
}

export function AvatarUpload({ userId, currentAvatarUrl, displayName }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateAvatar = useUpdateAvatar();
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const publicUrl = await uploadAvatar(userId, file);
      await updateAvatar.mutateAsync({ userId, avatarUrl: publicUrl });
      toast({ title: 'Avatar updated!' });
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

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-32 w-32">
          <AvatarImage src={currentAvatarUrl || undefined} alt="Profile avatar" />
          <AvatarFallback className="text-3xl">
            {displayName?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <Button
          size="icon"
          variant="secondary"
          className="absolute bottom-0 right-0 rounded-full h-10 w-10"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <p className="text-sm text-muted-foreground">
        Click the camera icon to upload a new avatar
      </p>
    </div>
  );
}
