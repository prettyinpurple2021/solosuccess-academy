/**
 * @file EnrichLessonsButton.tsx — AI Lesson Enrichment Tool
 *
 * PURPOSE: Scans lessons in a selected course and uses AI to generate
 * supplemental enrichment content (case studies, pro tips, common mistakes,
 * deeper dives, resources, and quick challenges). The enrichment is appended
 * to the lesson's existing text content to increase educational value.
 *
 * FLOW: Select course → AI generates enrichment per lesson → Preview → Save
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAdminCourses, useAdminLessons } from '@/hooks/useAdmin';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Zap, BookOpen } from 'lucide-react';

/** Shape of AI-generated enrichment content */
interface EnrichmentData {
  case_study?: {
    title: string;
    scenario: string;
    key_lesson: string;
  };
  pro_tips?: string[];
  common_mistakes?: { mistake: string; fix: string }[];
  deeper_dive?: string;
  resource_recommendations?: { title: string; type: string; why: string }[];
  quick_challenge?: {
    title: string;
    description: string;
    success_criteria: string;
  };
}

/** Progress tracking for the enrichment process */
interface EnrichProgress {
  currentLesson: string;
  completedLessons: number;
  totalLessons: number;
  enrichedCount: number;
  skippedCount: number;
}

export function EnrichLessonsButton() {
  const { toast } = useToast();
  const { data: courses } = useAdminCourses();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [isEnriching, setIsEnriching] = useState(false);
  const [progress, setProgress] = useState<EnrichProgress | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Fetch lessons for the selected course
  const { data: lessons } = useAdminLessons(selectedCourseId || undefined);

  /**
   * Formats enrichment data into markdown to append to lesson content.
   * This creates visually appealing sections students will actually read.
   */
  const formatEnrichmentMarkdown = (data: EnrichmentData): string => {
    const sections: string[] = [];

    // Case Study section
    if (data.case_study) {
      sections.push(`\n\n---\n\n## 📖 Real-World Case Study: ${data.case_study.title}\n\n${data.case_study.scenario}\n\n**Key Lesson:** ${data.case_study.key_lesson}`);
    }

    // Pro Tips section
    if (data.pro_tips?.length) {
      sections.push(`\n\n---\n\n## 💡 Pro Tips\n\n${data.pro_tips.map(tip => `*   🔥 ${tip}`).join('\n')}`);
    }

    // Common Mistakes section
    if (data.common_mistakes?.length) {
      sections.push(`\n\n---\n\n## ⚠️ Common Mistakes to Avoid\n\n${data.common_mistakes.map(m => `*   **${m.mistake}** — *Fix:* ${m.fix}`).join('\n')}`);
    }

    // Deeper Dive section
    if (data.deeper_dive) {
      sections.push(`\n\n---\n\n## 🔬 Deeper Dive\n\n${data.deeper_dive}`);
    }

    // Resource Recommendations
    if (data.resource_recommendations?.length) {
      sections.push(`\n\n---\n\n## 📚 Recommended Resources\n\n${data.resource_recommendations.map(r => `*   **${r.title}** (${r.type}) — ${r.why}`).join('\n')}`);
    }

    // Quick Challenge
    if (data.quick_challenge) {
      sections.push(`\n\n---\n\n## 🎯 Quick Challenge: ${data.quick_challenge.title}\n\n${data.quick_challenge.description}\n\n**Success Criteria:** ${data.quick_challenge.success_criteria}`);
    }

    return sections.join('');
  };

  /** Main enrichment process — iterates through lessons and generates content */
  const enrichLessons = async () => {
    if (!selectedCourseId || !lessons?.length) return;

    setIsEnriching(true);
    setResult(null);

    // Only enrich text-type lessons that have existing content
    const eligibleLessons = lessons.filter(
      (l) => l.type === 'text' && l.content && l.content.length > 100
    );

    // Skip lessons that already have enrichment markers
    const unenrichedLessons = eligibleLessons.filter(
      (l) => !l.content?.includes('## 📖 Real-World Case Study') && !l.content?.includes('## 💡 Pro Tips')
    );

    if (unenrichedLessons.length === 0) {
      setResult({
        success: true,
        message: 'All eligible lessons are already enriched! Nothing to do.',
      });
      setIsEnriching(false);
      return;
    }

    setProgress({
      currentLesson: '',
      completedLessons: 0,
      totalLessons: unenrichedLessons.length,
      enrichedCount: 0,
      skippedCount: 0,
    });

    const selectedCourse = courses?.find((c) => c.id === selectedCourseId);
    let enrichedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < unenrichedLessons.length; i++) {
      const lesson = unenrichedLessons[i];

      setProgress({
        currentLesson: lesson.title,
        completedLessons: i,
        totalLessons: unenrichedLessons.length,
        enrichedCount,
        skippedCount,
      });

      try {
        // Call AI to generate enrichment content
        const { data: aiData, error: aiError } = await supabase.functions.invoke(
          'generate-content',
          {
            body: {
              type: 'lesson_enrichment',
              context: {
                courseTitle: selectedCourse?.title || '',
                lessonTitle: lesson.title,
                documentContent: lesson.content,
              },
            },
          }
        );

        if (aiError) throw aiError;

        const enrichment: EnrichmentData = aiData?.content;
        if (!enrichment || typeof enrichment !== 'object') {
          skippedCount++;
          continue;
        }

        // Format enrichment as markdown and append to existing content
        const enrichmentMarkdown = formatEnrichmentMarkdown(enrichment);
        const updatedContent = (lesson.content || '') + enrichmentMarkdown;

        // Save enriched content back to the database
        const { error: updateError } = await supabase
          .from('lessons')
          .update({ content: updatedContent })
          .eq('id', lesson.id);

        if (updateError) throw updateError;

        enrichedCount++;
      } catch (err: any) {
        console.error(`Failed to enrich "${lesson.title}":`, err);
        skippedCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 2000));
    }

    setProgress({
      currentLesson: 'Complete!',
      completedLessons: unenrichedLessons.length,
      totalLessons: unenrichedLessons.length,
      enrichedCount,
      skippedCount,
    });

    setResult({
      success: true,
      message: `Enriched ${enrichedCount} lessons! ${skippedCount > 0 ? `(${skippedCount} skipped)` : ''}`,
    });

    toast({
      title: 'Lessons enriched!',
      description: `${enrichedCount} lessons now have case studies, pro tips, and more.`,
    });

    setIsEnriching(false);
  };

  const progressPercent = progress
    ? (progress.completedLessons / progress.totalLessons) * 100
    : 0;

  // Count eligible lessons for the selected course
  const eligibleCount = lessons?.filter(
    (l) =>
      l.type === 'text' &&
      l.content &&
      l.content.length > 100 &&
      !l.content.includes('## 📖 Real-World Case Study') &&
      !l.content.includes('## 💡 Pro Tips')
  ).length ?? 0;

  const alreadyEnrichedCount = lessons?.filter(
    (l) =>
      l.content?.includes('## 📖 Real-World Case Study') ||
      l.content?.includes('## 💡 Pro Tips')
  ).length ?? 0;

  return (
    <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">AI Lesson Enricher</CardTitle>
        </div>
        <CardDescription>
          Add case studies, pro tips, common mistakes, deeper dives, and quick challenges
          to your lessons using AI — boosting educational value for every student.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Course Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Select a course to enrich</label>
          <Select value={selectedCourseId} onValueChange={setSelectedCourseId} disabled={isEnriching}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder="Choose a course..." />
            </SelectTrigger>
            <SelectContent>
              {courses?.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats for selected course */}
        {selectedCourseId && lessons && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              <BookOpen className="h-3 w-3 mr-1" />
              {lessons.length} total lessons
            </Badge>
            <Badge variant="outline" className="border-primary/50 text-primary">
              <Zap className="h-3 w-3 mr-1" />
              {eligibleCount} ready to enrich
            </Badge>
            {alreadyEnrichedCount > 0 && (
              <Badge variant="outline" className="border-success/50 text-success">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {alreadyEnrichedCount} already enriched
              </Badge>
            )}
          </div>
        )}

        {/* Progress Display */}
        {progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate max-w-[200px]">
                {progress.currentLesson}
              </span>
              <span className="font-medium">
                {progress.completedLessons}/{progress.totalLessons} lessons
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {progress.enrichedCount} enriched · {progress.skippedCount} skipped
            </p>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg ${
              result.success
                ? 'bg-green-500/10 text-green-600'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0" />
            )}
            <span className="text-sm font-medium">{result.message}</span>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={enrichLessons}
          disabled={isEnriching || !selectedCourseId || eligibleCount === 0}
          className="w-full"
          size="lg"
        >
          {isEnriching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enriching Lessons...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {eligibleCount > 0
                ? `Enrich ${eligibleCount} Lessons with AI`
                : selectedCourseId
                  ? 'All lessons already enriched!'
                  : 'Select a course first'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
