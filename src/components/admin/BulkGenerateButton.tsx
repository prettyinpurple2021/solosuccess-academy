/**
 * @file BulkGenerateButton.tsx — Bulk AI Content Generation for All Lessons
 *
 * PURPOSE: Provides a button that triggers batch AI content generation for
 * all lessons with placeholder text. Processes 3 lessons at a time,
 * automatically continuing until all lessons have full content.
 *
 * HOW IT WORKS:
 * 1. Admin clicks "Bulk Generate All Content"
 * 2. Calls the bulk-generate-lessons edge function repeatedly
 * 3. Each call processes 3 lessons and returns how many remain
 * 4. Progress is shown with a progress bar and live results
 * 5. Stops when remaining === 0
 */
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2, CheckCircle, XCircle, Zap } from 'lucide-react';

interface LessonResult {
  id: string;
  title: string;
  status: 'success' | 'error';
  contentLength?: number;
  error?: string;
}

export function BulkGenerateButton() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<LessonResult[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const { toast } = useToast();

  /**
   * Runs the bulk generation loop:
   * Calls the edge function repeatedly, 3 lessons per batch,
   * until no placeholder lessons remain.
   */
  const runBulkGenerate = useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    setTotalProcessed(0);
    setRemaining(null);

    let totalDone = 0;
    let consecutiveErrors = 0;

    try {
      // Loop until all lessons are processed
      while (true) {
        const { data, error } = await supabase.functions.invoke('bulk-generate-lessons', {
          body: {},
        });

        if (error) {
          console.error('Bulk generate error:', error);
          consecutiveErrors++;
          if (consecutiveErrors >= 3) {
            toast({
              title: 'Generation stopped',
              description: 'Too many consecutive errors. Please try again later.',
              variant: 'destructive',
            });
            break;
          }
          // Wait a bit before retrying on error
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }

        consecutiveErrors = 0; // Reset on success

        const { processed, remaining: rem, results: batchResults } = data;

        // Update state with new results
        if (batchResults) {
          setResults(prev => [...prev, ...batchResults]);
        }
        totalDone += processed;
        setTotalProcessed(totalDone);
        setRemaining(rem);

        // If nothing was processed or nothing remains, we're done
        if (processed === 0 || rem === 0) {
          toast({
            title: '🎉 Bulk generation complete!',
            description: `Generated content for ${totalDone} lessons total.`,
          });
          break;
        }

        // Small delay between batches to avoid rate limits
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (err) {
      console.error('Bulk generation failed:', err);
      toast({
        title: 'Generation error',
        description: 'An unexpected error occurred. Check console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  }, [toast]);

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  // Estimate total lessons = processed + remaining
  const estimatedTotal = remaining !== null ? totalProcessed + remaining : null;
  const progressPercent = estimatedTotal && estimatedTotal > 0
    ? Math.round((totalProcessed / estimatedTotal) * 100)
    : 0;

  return (
    <Card className="border-2 border-dashed border-accent/40 bg-accent/5 hover:border-accent/60 transition-all">
      <CardContent className="p-4 space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/20 shadow-[0_0_15px_hsl(var(--accent)/0.3)]">
              <Zap className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold">Bulk Generate Lesson Content</h3>
              <p className="text-sm text-muted-foreground">
                AI-generate full content for all placeholder lessons (3 at a time)
              </p>
            </div>
          </div>
          <Button
            onClick={runBulkGenerate}
            disabled={isRunning}
            className="bg-accent/20 text-accent border-accent/30 hover:bg-accent/30"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Bulk Generate All Content
              </>
            )}
          </Button>
        </div>

        {/* Progress section — only visible during/after generation */}
        {(isRunning || results.length > 0) && (
          <div className="space-y-3">
            {/* Progress bar */}
            {estimatedTotal !== null && estimatedTotal > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{totalProcessed} of ~{estimatedTotal} lessons</span>
                  <span>{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            )}

            {/* Stats badges */}
            <div className="flex gap-2">
              <Badge className="bg-success/20 text-success border-success/30">
                <CheckCircle className="mr-1 h-3 w-3" />
                {successCount} generated
              </Badge>
              {errorCount > 0 && (
                <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                  <XCircle className="mr-1 h-3 w-3" />
                  {errorCount} errors
                </Badge>
              )}
              {remaining !== null && remaining > 0 && (
                <Badge variant="outline" className="border-muted-foreground/30">
                  {remaining} remaining
                </Badge>
              )}
            </div>

            {/* Recent results log */}
            {results.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1 text-xs font-mono bg-background/50 rounded p-2 border border-primary/10">
                {results.slice(-10).map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {r.status === 'success' ? (
                      <CheckCircle className="h-3 w-3 text-success shrink-0" />
                    ) : (
                      <XCircle className="h-3 w-3 text-destructive shrink-0" />
                    )}
                    <span className="truncate">{r.title}</span>
                    {r.contentLength && (
                      <span className="text-muted-foreground ml-auto shrink-0">
                        {r.contentLength} chars
                      </span>
                    )}
                    {r.error && (
                      <span className="text-destructive ml-auto shrink-0">{r.error}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
