/**
 * @file BulkGeneratePracticeLabsButton.tsx — Admin Bulk Generate Practice Labs
 * 
 * Generates hands-on practice lab exercises for all lessons that don't
 * already have one. Uses the generate-content edge function with a
 * specialized 'practice_lab' content type.
 * 
 * Each practice lab includes:
 * - Title: what the student will practice
 * - Instructions: step-by-step guidance for the hands-on exercise
 * - Deliverable Description: exactly what to submit
 * - Estimated Minutes: how long the exercise should take
 * - Difficulty: beginner/intermediate/advanced
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Wrench, Loader2, CheckCircle2, XCircle, Play } from 'lucide-react';

interface LogEntry {
  message: string;
  type: 'info' | 'success' | 'error';
  timestamp: Date;
}

export function BulkGeneratePracticeLabsButton() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const { toast } = useToast();

  /** Add a log entry */
  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date() }]);
  };

  /** Main generation function */
  const handleGenerate = async () => {
    setIsGenerating(true);
    setLogs([]);
    addLog('Starting practice lab generation...');

    try {
      // 1. Fetch all lessons
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title, type, course_id, courses(title)')
        .order('course_id')
        .order('order_number');

      if (lessonsError) throw lessonsError;
      if (!lessons?.length) {
        addLog('No lessons found', 'error');
        return;
      }

      // 2. Fetch existing practice labs to skip
      const { data: existingLabs } = await supabase
        .from('practice_labs')
        .select('lesson_id');

      const existingLessonIds = new Set(existingLabs?.map(l => l.lesson_id) || []);

      // 3. Filter to lessons that need practice labs
      const lessonsToGenerate = lessons.filter(l => !existingLessonIds.has(l.id));

      if (lessonsToGenerate.length === 0) {
        addLog('All lessons already have practice labs!', 'success');
        toast({ title: 'All done!', description: 'Every lesson already has a practice lab.' });
        return;
      }

      setProgress({ current: 0, total: lessonsToGenerate.length });
      addLog(`Found ${lessonsToGenerate.length} lessons needing practice labs`);

      // 4. Generate practice labs one by one
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < lessonsToGenerate.length; i++) {
        const lesson = lessonsToGenerate[i];
        const courseTitle = (lesson as any).courses?.title || 'Unknown Course';

        addLog(`[${i + 1}/${lessonsToGenerate.length}] Generating for: ${lesson.title}`);
        setProgress({ current: i + 1, total: lessonsToGenerate.length });

        try {
          // Call generate-content with practice_lab type
          const { data, error } = await supabase.functions.invoke('generate-content', {
            body: {
              type: 'practice_lab',
              context: {
                courseTitle,
                lessonTitle: lesson.title,
                lessonType: lesson.type,
              },
            },
          });

          if (error) throw error;
          if (data?.error) throw new Error(data.error);

          const labContent = data.content;
          if (!labContent?.title || !labContent?.instructions) {
            throw new Error('Invalid practice lab format returned');
          }

          // Insert into practice_labs table
          const { error: insertError } = await supabase
            .from('practice_labs')
            .insert({
              lesson_id: lesson.id,
              title: labContent.title,
              instructions: labContent.instructions,
              deliverable_description: labContent.deliverable_description || labContent.deliverable || 'Submit your completed work.',
              estimated_minutes: labContent.estimated_minutes || 15,
              difficulty: labContent.difficulty || 'intermediate',
            });

          if (insertError) throw insertError;

          addLog(`✅ ${lesson.title}`, 'success');
          successCount++;
        } catch (err: any) {
          addLog(`❌ ${lesson.title}: ${err.message}`, 'error');
          errorCount++;
        }

        // Small delay to avoid rate limiting
        if (i < lessonsToGenerate.length - 1) {
          await new Promise(r => setTimeout(r, 1500));
        }
      }

      addLog(`\nComplete! ${successCount} generated, ${errorCount} errors.`, successCount > 0 ? 'success' : 'error');
      toast({
        title: 'Practice Labs Generated',
        description: `${successCount} labs created, ${errorCount} errors.`,
      });
    } catch (err: any) {
      addLog(`Fatal error: ${err.message}`, 'error');
      toast({ title: 'Generation failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          variant="neon"
          className="gap-2"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wrench className="h-4 w-4" />
          )}
          {isGenerating
            ? `Generating (${progress.current}/${progress.total})...`
            : 'Bulk Generate Practice Labs'}
        </Button>
        {progress.total > 0 && (
          <Badge variant="outline" className="border-primary/50">
            {progress.current}/{progress.total}
          </Badge>
        )}
      </div>

      {/* Generation Logs */}
      {logs.length > 0 && (
        <ScrollArea className="h-64 rounded-lg border border-primary/20 bg-background/50 p-4">
          <div className="space-y-1 font-mono text-xs">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start gap-2">
                {log.type === 'success' && <CheckCircle2 className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />}
                {log.type === 'error' && <XCircle className="h-3 w-3 text-destructive mt-0.5 flex-shrink-0" />}
                {log.type === 'info' && <Play className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />}
                <span className={
                  log.type === 'success' ? 'text-success' :
                  log.type === 'error' ? 'text-destructive' :
                  'text-muted-foreground'
                }>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
