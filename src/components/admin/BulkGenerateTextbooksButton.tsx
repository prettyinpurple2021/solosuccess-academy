/**
 * @file BulkGenerateTextbooksButton.tsx — Bulk Textbook Content Generator
 *
 * PURPOSE: Admin button that triggers AI generation of textbook chapters
 * and pages for courses that don't have any. Processes one course per call,
 * automatically continuing until all courses have textbook content.
 */
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BookText, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface CourseResult {
  course: string;
  chaptersCreated: number;
  pagesCreated: number;
  status: 'success' | 'error';
  error?: string;
}

export function BulkGenerateTextbooksButton() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<CourseResult[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const { toast } = useToast();

  const runBulkGenerate = useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    setRemaining(null);

    let consecutiveErrors = 0;

    try {
      while (true) {
        const { data, error } = await supabase.functions.invoke('bulk-generate-textbooks', {
          body: {},
        });

        if (error) {
          console.error('Bulk textbook generate error:', error);
          consecutiveErrors++;
          if (consecutiveErrors >= 3) {
            toast({
              title: 'Generation stopped',
              description: 'Too many consecutive errors. Please try again later.',
              variant: 'destructive',
            });
            break;
          }
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }

        consecutiveErrors = 0;

        if (data.error) {
          setResults(prev => [...prev, {
            course: 'Unknown',
            chaptersCreated: 0,
            pagesCreated: 0,
            status: 'error',
            error: data.error,
          }]);
          // If rate limited, wait longer
          if (data.error.includes('Rate limit')) {
            await new Promise(r => setTimeout(r, 15000));
            continue;
          }
          break;
        }

        setRemaining(data.remaining);

        if (data.chaptersCreated > 0) {
          setResults(prev => [...prev, {
            course: data.course,
            chaptersCreated: data.chaptersCreated,
            pagesCreated: data.pagesCreated,
            status: 'success',
          }]);
        }

        if (data.remaining === 0 || data.processed === 0) {
          toast({
            title: '🎉 Textbook generation complete!',
            description: `Generated textbooks for all courses.`,
          });
          break;
        }

        // Wait between courses to avoid rate limits
        await new Promise(r => setTimeout(r, 3000));
      }
    } catch (err) {
      console.error('Bulk textbook generation failed:', err);
      toast({
        title: 'Generation error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  }, [toast]);

  const successCount = results.filter(r => r.status === 'success').length;
  const totalChapters = results.reduce((sum, r) => sum + r.chaptersCreated, 0);
  const totalPages = results.reduce((sum, r) => sum + r.pagesCreated, 0);

  // 9 courses to fill (courses 2-10)
  const estimatedTotal = 9;
  const progressPercent = Math.round((successCount / estimatedTotal) * 100);

  return (
    <Card className="border-2 border-dashed border-secondary/40 bg-secondary/5 hover:border-secondary/60 transition-all">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/20 shadow-[0_0_15px_hsl(var(--secondary)/0.3)]">
              <BookText className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold">Bulk Generate Textbooks</h3>
              <p className="text-sm text-muted-foreground">
                AI-generate textbook chapters & pages for courses without content
              </p>
            </div>
          </div>
          <Button
            onClick={runBulkGenerate}
            disabled={isRunning}
            className="bg-secondary/20 text-secondary border-secondary/30 hover:bg-secondary/30"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <BookText className="mr-2 h-4 w-4" />
                Generate All Textbooks
              </>
            )}
          </Button>
        </div>

        {(isRunning || results.length > 0) && (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{successCount} of {estimatedTotal} courses</span>
                <span>{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Badge className="bg-success/20 text-success border-success/30">
                <CheckCircle className="mr-1 h-3 w-3" />
                {totalChapters} chapters, {totalPages} pages
              </Badge>
              {results.some(r => r.status === 'error') && (
                <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                  <XCircle className="mr-1 h-3 w-3" />
                  {results.filter(r => r.status === 'error').length} errors
                </Badge>
              )}
            </div>

            {results.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-1 text-xs font-mono bg-background/50 rounded p-2 border border-primary/10">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {r.status === 'success' ? (
                      <CheckCircle className="h-3 w-3 text-success shrink-0" />
                    ) : (
                      <XCircle className="h-3 w-3 text-destructive shrink-0" />
                    )}
                    <span className="truncate">{r.course}</span>
                    {r.status === 'success' && (
                      <span className="text-muted-foreground ml-auto shrink-0">
                        {r.chaptersCreated}ch / {r.pagesCreated}pg
                      </span>
                    )}
                    {r.error && (
                      <span className="text-destructive ml-auto shrink-0 truncate max-w-40">{r.error}</span>
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
