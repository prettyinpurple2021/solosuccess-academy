/**
 * FinalExamGenerator – Admin component to generate mixed-format final exams.
 * 
 * Supports MCQ + short answer + true/false questions with configurable count.
 * Generated exams are saved to the course_final_exams table.
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { FileText, Sparkles, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { useFinalExam, useGenerateFinalExam, type ExamQuestion } from '@/hooks/useFinalExam';

interface FinalExamGeneratorProps {
  courses: { id: string; title: string; description: string | null }[];
}

export function FinalExamGenerator({ courses }: FinalExamGeneratorProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [questionCount, setQuestionCount] = useState(15);
  const { data: existingExam, isLoading: examLoading } = useFinalExam(selectedCourseId || undefined);
  const generateExam = useGenerateFinalExam();

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  const handleGenerate = () => {
    if (!selectedCourse) return;
    generateExam.mutate({
      courseId: selectedCourse.id,
      courseTitle: selectedCourse.title,
      courseDescription: selectedCourse.description || '',
      questionCount,
    });
  };

  /** Icon for question type */
  const typeIcon = (type: string) => {
    switch (type) {
      case 'mcq': return <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">MCQ</Badge>;
      case 'true_false': return <Badge className="bg-warning/20 text-warning border-warning/30 text-xs">T/F</Badge>;
      case 'short_answer': return <Badge className="bg-info/20 text-info border-info/30 text-xs">Short</Badge>;
      default: return <Badge variant="outline" className="text-xs">{type}</Badge>;
    }
  };

  return (
    <Card className="glass-card border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <FileText className="h-5 w-5 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
          Final Exam Generator
        </CardTitle>
        <CardDescription>
          Generate mixed-format final exams (MCQ, short answer, true/false) with configurable question count.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Course selector */}
        <div className="space-y-2">
          <Label>Select Course</Label>
          <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
            <SelectTrigger className="bg-background/50 border-primary/30">
              <SelectValue placeholder="Choose a course..." />
            </SelectTrigger>
            <SelectContent className="bg-background border-primary/30">
              {courses.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Question count */}
        <div className="space-y-2">
          <Label>Number of Questions</Label>
          <Input
            type="number"
            min={5}
            max={50}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="w-32 bg-background/50 border-primary/30"
          />
          <p className="text-xs text-muted-foreground">Mix of MCQ, short answer, and true/false</p>
        </div>

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={!selectedCourseId || generateExam.isPending}
          className="w-full gap-2 bg-primary hover:bg-primary/90"
        >
          {generateExam.isPending ? (
            <>
              <NeonSpinner size="sm" />
              Generating Exam...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {existingExam ? 'Regenerate Exam' : 'Generate Final Exam'}
            </>
          )}
        </Button>

        {/* Existing exam preview */}
        {examLoading && selectedCourseId && (
          <div className="flex justify-center py-4">
            <NeonSpinner size="md" />
          </div>
        )}

        {existingExam && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{existingExam.title}</h3>
              <Badge variant="outline" className="border-success/50 text-success">
                {existingExam.questions.length} questions
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{existingExam.instructions}</p>
            <p className="text-xs text-muted-foreground">Passing score: {existingExam.passingScore}%</p>

            <Accordion type="single" collapsible className="space-y-2">
              {existingExam.questions.map((q, i) => (
                <AccordionItem key={q.id || i} value={`q-${i}`} className="border border-primary/10 rounded-lg px-4">
                  <AccordionTrigger className="text-sm hover:no-underline">
                    <div className="flex items-center gap-2 text-left">
                      {typeIcon(q.type)}
                      <span className="text-muted-foreground mr-1">Q{i + 1}.</span>
                      <span className="truncate max-w-[300px]">{q.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm space-y-2 pb-4">
                    {q.type === 'mcq' && q.options && (
                      <div className="space-y-1 pl-2">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className={`flex items-center gap-2 p-1.5 rounded ${
                            oi === q.correctIndex ? 'bg-success/10 text-success' : 'text-foreground/70'
                          }`}>
                            {oi === q.correctIndex ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground/50" />}
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}
                    {q.type === 'true_false' && (
                      <p className="pl-2">
                        Correct answer: <strong className="text-success">{q.correctBoolean ? 'True' : 'False'}</strong>
                      </p>
                    )}
                    {q.type === 'short_answer' && (
                      <p className="pl-2 text-muted-foreground">
                        <HelpCircle className="inline h-3.5 w-3.5 mr-1" />
                        Expected keywords: {q.correctAnswer}
                      </p>
                    )}
                    <p className="pl-2 text-muted-foreground italic">{q.explanation}</p>
                    <p className="pl-2 text-xs text-muted-foreground">Points: {q.points}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
