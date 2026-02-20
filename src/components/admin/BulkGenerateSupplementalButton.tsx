/**
 * @file BulkGenerateSupplementalButton.tsx — Bulk Quiz/Worksheet/Activity Generator
 *
 * PURPOSE: Admin button that generates quiz_data, worksheet_data, and activity_data
 * for all text-type lessons that are currently missing supplemental content.
 * Processes 2 lessons per batch (each generating 3 AI items = 6 AI calls per batch).
 *
 * HOW IT WORKS:
 * 1. Admin clicks "Bulk Generate Supplemental Content"
 * 2. Calls the bulk-generate-supplemental edge function in a loop
 * 3. Each call generates quiz + worksheet + activity for up to 2 lessons
 * 4. Progress bar tracks how many lessons are done vs. remaining
 * 5. Automatically stops when all lessons have supplemental content
 */
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ClipboardList, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface LessonResult {
  id: string;
  title: string;
  status: 'success' | 'error';
  generated?: string[]; // e.g. ['quiz', 'worksheet', 'activity']
  error?: string;
}

export function BulkGenerateSupplementalButton() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<LessonResult[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const { toast } = useToast();

  const runBulkGenerate = useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    setTotalProcessed(0);
    setRemaining(null);

    let totalDone = 0;
    let consecutiveErrors = 0;

    try {
      // Loop until all lessons have supplemental content
      while (true) {
        const { data, error } = await supabase.functions.invoke('bulk-generate-supplemental', {
          body: {},
        });

        if (error) {
          console.error('Bulk supplemental generate error:', error);
          consecutiveErrors++;
          if (consecutiveErrors >= 3) {
            toast({
              title: 'Generation stopped',
              description: 'Too many consecutive errors. Please try again later.',
              variant: 'destructive',
            });
            break;
          }
          // Wait before retrying on error
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }

        consecutiveErrors = 0;

        const { processed, remaining: rem, results: batchResults } = data;

        // Add batch results to the live log
        if (batchResults) {
          setResults(prev => [...prev, ...batchResults]);
        }

        totalDone += processed || 0;
        setTotalProcessed(totalDone);
        setRemaining(rem);

        // Stop when nothing was processed or nothing remains
        if (processed === 0 || rem === 0) {
          toast({
            title: '🎉 Supplemental content complete!',
            description: `Generated quizzes, worksheets & activities for ${totalDone} lessons.`,
          });
          break;
        }

        // Wait between batches to avoid AI rate limits
        // Each batch has 6 AI calls so we give it a few seconds
        await new Promise(r => setTimeout(r, 4000));
      }
    } catch (err) {
      console.error('Bulk supplemental generation failed:', err);
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

  // Estimate total: processed so far + remaining
  const estimatedTotal = remaining !== null ? totalProcessed + remaining : null;
  const progressPercent =
    estimatedTotal && estimatedTotal > 0
      ? Math.round((totalProcessed / estimatedTotal) * 100)
      : 0;

  return (
    <Card className="border-2 border-dashed border-warning/40 bg-warning/5 hover:border-warning/60 transition-all">
      <CardContent className="p-4 space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/20 shadow-[0_0_15px_hsl(var(--warning)/0.3)]">
              <ClipboardList className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold">Bulk Generate Quizzes, Worksheets & Activities</h3>
              <p className="text-sm text-muted-foreground">
                AI-generate supplemental content for all text lessons missing them (2 at a time)
              </p>
            </div>
          </div>
          <Button
            onClick={runBulkGenerate}
            disabled={isRunning}
            className="bg-warning/20 text-warning border-warning/30 hover:bg-warning/30 shrink-0"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ClipboardList className="mr-2 h-4 w-4" />
                Generate All
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
            <div className="flex gap-2 flex-wrap">
              <Badge className="bg-success/20 text-success border-success/30">
                <CheckCircle className="mr-1 h-3 w-3" />
                {successCount} lessons done
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

            {/* Live results log */}
            {results.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1 text-xs font-mono bg-background/50 rounded p-2 border border-primary/10">
                {results.slice(-15).map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {r.status === 'success' ? (
                      <CheckCircle className="h-3 w-3 text-success shrink-0" />
                    ) : (
                      <XCircle className="h-3 w-3 text-destructive shrink-0" />
                    )}
                    <span className="truncate flex-1">{r.title}</span>
                    {r.generated && (
                      <span className="text-muted-foreground shrink-0">
                        {r.generated.join(' + ')}
                      </span>
                    )}
                    {r.error && (
                      <span className="text-destructive shrink-0 truncate max-w-32">{r.error}</span>
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
