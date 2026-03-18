/**
 * @file useVideoGenerator.ts — Client-Side Video Generation with Polling
 *
 * HOW IT WORKS:
 * 1. Submits a video generation request to generate-video (returns instantly with taskId)
 * 2. Polls check-video-status every 5 seconds until SUCCEEDED or FAILED
 * 3. Returns the final video URL
 *
 * This avoids the 60-second Edge Function timeout by doing polling client-side.
 */
import { useState, useRef } from 'react';
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
  // Track polling so we can cancel if component unmounts
  const abortRef = useRef(false);

  const generateVideo = async (options: VideoGenerateOptions): Promise<string | null> => {
    setIsGenerating(true);
    setProgress('Submitting video generation task...');
    abortRef.current = false;

    try {
      // Step 1: Submit the task (returns immediately with taskId)
      const { data, error } = await supabase.functions.invoke('generate-video', {
        body: options,
      });

      if (error) throw new Error(error.message || 'Failed to submit video task');
      if (data?.error) throw new Error(data.error);
      if (!data?.taskId) throw new Error('No task ID returned');

      const taskId = data.taskId;
      setProgress('Video generation in progress...');

      // Step 2: Poll check-video-status until done (max 5 minutes)
      const maxPolls = 60; // 60 × 5s = 5 minutes
      let polls = 0;

      while (polls < maxPolls && !abortRef.current) {
        // Wait 5 seconds between polls
        await new Promise((resolve) => setTimeout(resolve, 5000));
        polls++;

        setProgress(`Generating video... (${polls * 5}s elapsed)`);

        const { data: statusData, error: statusError } = await supabase.functions.invoke(
          'check-video-status',
          { body: { taskId } }
        );

        if (statusError) {
          console.error('Status check error:', statusError);
          continue; // Retry on transient errors
        }

        if (statusData?.status === 'SUCCEEDED' && statusData?.videoUrl) {
          toast({
            title: 'Video generated!',
            description: 'Your AI video has been created successfully.',
          });
          return statusData.videoUrl;
        }

        if (statusData?.status === 'FAILED') {
          throw new Error(statusData.error || 'Video generation failed');
        }

        // Still processing — continue polling
        if (statusData?.progress) {
          setProgress(`Generating video... ${Math.round(statusData.progress * 100)}%`);
        }
      }

      if (abortRef.current) {
        return null; // Cancelled
      }

      throw new Error('Video generation timed out after 5 minutes. Please try again.');
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

      // Upload to storage
      const filePath = `generated-videos/${Date.now()}-${fileName}`;
      const { data, error } = await supabase.storage
        .from('lesson-videos')
        .upload(filePath, file);

      if (error) throw error;

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

  // Cancel polling on unmount
  const cancelGeneration = () => {
    abortRef.current = true;
  };

  return {
    generateVideo,
    uploadGeneratedVideo,
    cancelGeneration,
    isGenerating,
    progress,
  };
}
