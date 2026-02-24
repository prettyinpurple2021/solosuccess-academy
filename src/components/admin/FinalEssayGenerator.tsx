/**
 * FinalEssayGenerator – Admin component to generate essay prompts + rubrics.
 * 
 * Generates 3-5 essay topic options with guiding questions and a detailed
 * grading rubric. Supports AI auto-grading of student submissions.
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { NeonSpinner } from '@/components/ui/neon-spinner';
import { PenLine, Sparkles, BookOpen, Target, Star } from 'lucide-react';
import { useCourseEssay, useGenerateEssay } from '@/hooks/useFinalEssay';

interface FinalEssayGeneratorProps {
  courses: { id: string; title: string; description: string | null }[];
}

export function FinalEssayGenerator({ courses }: FinalEssayGeneratorProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const { data: existingEssay, isLoading: essayLoading } = useCourseEssay(selectedCourseId || undefined);
  const generateEssay = useGenerateEssay();

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  const handleGenerate = () => {
    if (!selectedCourse) return;
    generateEssay.mutate({
      courseId: selectedCourse.id,
      courseTitle: selectedCourse.title,
      courseDescription: selectedCourse.description || '',
    });
  };

  return (
    <Card className="glass-card border-secondary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <PenLine className="h-5 w-5 text-secondary drop-shadow-[0_0_8px_hsl(var(--secondary)/0.5)]" />
          Final Essay Generator
        </CardTitle>
        <CardDescription>
          Generate 3-5 essay topic options with rubrics. Students pick one and get AI-graded feedback.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Course selector */}
        <div className="space-y-2">
          <Label>Select Course</Label>
          <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
            <SelectTrigger className="bg-background/50 border-secondary/30">
              <SelectValue placeholder="Choose a course..." />
            </SelectTrigger>
            <SelectContent className="bg-background border-secondary/30">
              {courses.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={!selectedCourseId || generateEssay.isPending}
          className="w-full gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          {generateEssay.isPending ? (
            <>
              <NeonSpinner size="sm" />
              Generating Essay Prompts...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {existingEssay ? 'Regenerate Prompts' : 'Generate Essay Prompts'}
            </>
          )}
        </Button>

        {/* Loading */}
        {essayLoading && selectedCourseId && (
          <div className="flex justify-center py-4">
            <NeonSpinner size="md" />
          </div>
        )}

        {/* Existing essay config preview */}
        {existingEssay && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{existingEssay.title}</h3>
              <Badge variant="outline" className="border-secondary/50 text-secondary">
                {existingEssay.prompts.length} prompts · {existingEssay.wordLimit} word limit
              </Badge>
            </div>

            {/* Essay Prompts */}
            <div>
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-secondary" />
                Essay Topics (students choose one)
              </h4>
              <Accordion type="single" collapsible className="space-y-2">
                {existingEssay.prompts.map((prompt, i) => (
                  <AccordionItem key={i} value={`p-${i}`} className="border border-secondary/10 rounded-lg px-4">
                    <AccordionTrigger className="text-sm hover:no-underline">
                      <div className="flex items-center gap-2 text-left">
                        <Badge className="bg-secondary/20 text-secondary border-secondary/30 text-xs">
                          Option {i + 1}
                        </Badge>
                        <span className="truncate max-w-[300px]">{prompt.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm space-y-3 pb-4">
                      <p className="text-foreground/80">{prompt.description}</p>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Guiding Questions</p>
                        <ul className="space-y-1 pl-4">
                          {prompt.guiding_questions?.map((gq, gi) => (
                            <li key={gi} className="text-muted-foreground list-disc">{gq}</li>
                          ))}
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Rubric */}
            {existingEssay.rubric?.criteria && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-secondary" />
                  Grading Rubric ({existingEssay.rubric.totalPoints} points)
                </h4>
                <div className="space-y-2">
                  {existingEssay.rubric.criteria.map((criterion, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-secondary/10">
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="h-3.5 w-3.5 text-secondary" />
                        <span className="text-xs font-mono text-secondary">{criterion.maxPoints}pts</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{criterion.name}</p>
                        <p className="text-xs text-muted-foreground">{criterion.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
