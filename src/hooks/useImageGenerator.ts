import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ImageContextType = 'textbook_illustration' | 'lesson_thumbnail' | 'concept_diagram' | 'general';

export interface ImageContext {
  type: ImageContextType;
  topic?: string;
}

export interface GeneratedImage {
  imageUrl: string;
  description?: string;
}

export function useImageGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateImage = async (
    prompt: string,
    context?: ImageContext,
    model?: string
  ): Promise<GeneratedImage | null> => {
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt, context, model },
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate image');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Image generated!',
        description: 'AI has created your image.',
      });

      return {
        imageUrl: data.imageUrl,
        description: data.description,
      };
    } catch (error: any) {
      console.error('Image generation error:', error);

      let errorMessage = 'Failed to generate image';
      if (error.message?.includes('Rate limit')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (error.message?.includes('Usage limit') || error.message?.includes('402')) {
        errorMessage = 'Usage limit reached. Please add credits to continue.';
      } else if (error.message?.includes('Admin access')) {
        errorMessage = 'Admin access required to generate images.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Image generation failed',
        description: errorMessage,
        variant: 'destructive',
      });

      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const uploadGeneratedImage = async (
    base64Url: string,
    fileName: string,
    bucket: string = 'lesson-videos'
  ): Promise<string | null> => {
    try {
      // Extract base64 data from data URL
      const base64Data = base64Url.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid image data');
      }

      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      // Upload to storage
      const filePath = `generated/${Date.now()}-${fileName}`;
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, blob, {
          contentType: 'image/png',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Could not save the generated image',
        variant: 'destructive',
      });
      return null;
    }
  };

  return {
    generateImage,
    uploadGeneratedImage,
    isGenerating,
  };
}
