/**
 * @file ExplainThisPanel.tsx — AI "Explain This" Floating Panel
 *
 * PURPOSE: When a student selects text and clicks "Explain This" in the
 * highlight toolbar, this panel shows an AI-generated simplified explanation
 * with an analogy and real-world example.
 */
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb, X, Loader2, Sparkles } from 'lucide-react';
import DOMPurify from 'dompurify';

interface ExplainThisPanelProps {
  /** The text the student selected */
  selectedText: string;
  /** Chapter title for additional context */
  chapterTitle?: string;
  /** Called when panel is closed */
  onClose: () => void;
}

/**
 * Renders simple markdown bold and bullet points.
 * Uses DOMPurify to sanitize output.
 */
function renderMarkdown(text: string): string {
  let html = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n- /g, '\n• ')
    .replace(/\n/g, '<br/>');
  return DOMPurify.sanitize(html);
}

export function ExplainThisPanel({ selectedText, chapterTitle, onClose }: ExplainThisPanelProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const { toast } = useToast();

  /** Calls the explain-text edge function */
  const fetchExplanation = useCallback(async () => {
    setIsLoading(true);
    setHasRequested(true);

    try {
      const { data, error } = await supabase.functions.invoke('explain-text', {
        body: { selectedText, context: chapterTitle },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setExplanation(data.explanation);
    } catch (err: any) {
      console.error('Explain This error:', err);
      toast({
        title: 'Could not generate explanation',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedText, chapterTitle, toast]);

  // Auto-fetch on mount
  React.useEffect(() => {
    if (!hasRequested) {
      fetchExplanation();
    }
  }, [fetchExplanation, hasRequested]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-20 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] bg-black/95 backdrop-blur-xl border border-primary/30 rounded-xl shadow-[0_0_40px_rgba(168,85,247,0.3)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
              <Lightbulb className="h-4 w-4 text-primary" />
            </div>
            <span className="font-display font-semibold text-sm text-secondary">Explain This</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 hover:bg-destructive/20">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Selected text preview */}
        <div className="px-4 pt-3 pb-2">
          <p className="text-xs text-muted-foreground italic line-clamp-2 border-l-2 border-primary/40 pl-2">
            "{selectedText.substring(0, 120)}{selectedText.length > 120 ? '...' : ''}"
          </p>
        </div>

        {/* Content */}
        <ScrollArea className="max-h-72 px-4 pb-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Thinking...</p>
            </div>
          ) : explanation ? (
            <div
              className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(explanation) }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Sparkles className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No explanation available</p>
              <Button size="sm" variant="neon" onClick={fetchExplanation}>
                Try Again
              </Button>
            </div>
          )}
        </ScrollArea>
      </motion.div>
    </AnimatePresence>
  );
}
