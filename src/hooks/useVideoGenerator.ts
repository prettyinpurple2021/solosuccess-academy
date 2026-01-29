import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VideoGenerateOptions {
  prompt: string;
  duration?: 5 | 10;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  imageUrl?: string;
}

export function useVideoGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const { toast } = useToast();

  const generateVideo = async (options: VideoGenerateOptions): Promise<string | null> => {
    setIsGenerating(true);
    setProgress('Starting video generation...');

    try {
      const { data, error } = await supabase.functions.invoke('generate-video', {
        body: options,
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate video');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.videoUrl) {
        throw new Error('No video URL returned');
      }

      toast({
        title: 'Video generated!',
        description: 'Your AI video has been created successfully.',
      });

      return data.videoUrl;
    } catch (error: any) {
      console.error('Video generation error:', error);

      let errorMessage = 'Failed to generate video';
      if (error.message?.includes('RUNWAY_API_KEY')) {
        errorMessage = 'Runway API key not configured. Please add it in AI Settings.';
      } else if (error.message?.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error.message?.includes('Invalid')) {
        errorMessage = 'Invalid API key. Please check your Runway API key.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Video generation failed',
        description: errorMessage,
        variant: 'destructive',
      });

      return null;
    } finally {
      setIsGenerating(false);
      setProgress('');
    }
  };

  const uploadGeneratedVideo = async (
    videoUrl: string,
    fileName: string
  ): Promise<string | null> => {
    try {
      // Fetch the video from Runway's URL
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch generated video');
      }

      const blob = await response.blob();
      const file = new File([blob], fileName, { type: 'video/mp4' });

      // Upload to Supabase storage
      const filePath = `generated-videos/${Date.now()}-${fileName}`;
      const { data, error } = await supabase.storage
        .from('lesson-videos')
        .upload(filePath, file);

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('lesson-videos')
        .getPublicUrl(filePath);

      toast({
        title: 'Video saved!',
        description: 'The video has been saved to your library.',
      });

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Video upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to save video',
        variant: 'destructive',
      });
      return null;
    }
  };

  return {
    generateVideo,
    uploadGeneratedVideo,
    isGenerating,
    progress,
  };
}
