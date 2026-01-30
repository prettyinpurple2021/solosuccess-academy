import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sparkles, Loader2, HelpCircle, Plus, Trash2, GripVertical } from 'lucide-react';
import { QuizData, QuizQuestion } from '@/hooks/useAdmin';
import { useContentGenerator } from '@/hooks/useContentGenerator';
import { SmartPromptDialog } from './SmartPromptDialog';

interface LessonQuizSectionProps {
  lessonTitle: string;
  courseTitle: string;
  quizData: QuizData | null;
  onQuizDataChange: (data: QuizData | null) => void;
  smartPrompt: string;
}

export function LessonQuizSection({
  lessonTitle,
  courseTitle,
  quizData,
  onQuizDataChange,
  smartPrompt,
}: LessonQuizSectionProps) {
  const { generateContent, isGenerating } = useContentGenerator();
  const [showPromptDialog, setShowPromptDialog] = useState(false);

  const questions = quizData?.questions || [];
  const passingScore = quizData?.passingScore || 70;

  const handleGenerate = async (customPrompt: string) => {
    const result = await generateContent<{ questions: Array<{ question: string; options: string[]; correctIndex: number; explanation?: string }> }>('quiz', {
      lessonTitle,
      courseTitle,
      topic: lessonTitle,
      questionCount: 5,
    }, customPrompt);
    
    if (result && 'questions' in result && Array.isArray(result.questions)) {
      const mappedQuestions: QuizQuestion[] = result.questions.map((q) => ({
        id: crypto.randomUUID(),
        question: q.question || '',
        options: q.options || ['', '', '', ''],
        correctAnswer: q.correctIndex ?? 0,
        explanation: q.explanation || '',
      }));
      onQuizDataChange({
        questions: [...questions, ...mappedQuestions],
        passingScore,
      });
    }
    setShowPromptDialog(false);
  };

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: crypto.randomUUID(),
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
    };
    onQuizDataChange({
      questions: [...questions, newQuestion],
      passingScore,
    });
  };

  const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    onQuizDataChange({ questions: updated, passingScore });
  };

  const removeQuestion = (index: number) => {
    onQuizDataChange({
      questions: questions.filter((_, i) => i !== index),
      passingScore,
    });
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex] = value;
    onQuizDataChange({ questions: updated, passingScore });
  };

  return (
    <>
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <HelpCircle className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle>Quiz Questions</CardTitle>
                <CardDescription>
                  {questions.length} question{questions.length !== 1 ? 's' : ''} • Passing score: {passingScore}%
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="passing-score" className="text-sm whitespace-nowrap">Passing:</Label>
                <Input
                  id="passing-score"
                  type="number"
                  min="0"
                  max="100"
                  value={passingScore}
                  onChange={(e) => onQuizDataChange({ questions, passingScore: parseInt(e.target.value) || 70 })}
                  className="w-16"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPromptDialog(true)}
                disabled={isGenerating}
                className="border-primary/50 hover:border-primary hover:bg-primary/10 hover:text-primary"
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate with AI
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-muted-foreground/30 rounded-lg">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No quiz questions yet</p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" onClick={addQuestion}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
                <Button 
                  variant="neon" 
                  onClick={() => setShowPromptDialog(true)}
                  disabled={isGenerating}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate with AI
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, qIndex) => (
                <Card key={question.id} className="border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-grab" />
                      <div className="flex-1">
                        <CardTitle className="text-sm font-medium">Question {qIndex + 1}</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestion(qIndex)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Question</Label>
                      <Textarea
                        value={question.question}
                        onChange={(e) => updateQuestion(qIndex, { question: e.target.value })}
                        placeholder="Enter your question..."
                        rows={2}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Answer Options</Label>
                      <RadioGroup
                        value={question.correctAnswer.toString()}
                        onValueChange={(value) => updateQuestion(qIndex, { correctAnswer: parseInt(value) })}
                      >
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-o${oIndex}`} />
                            <Input
                              value={option}
                              onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                              placeholder={`Option ${oIndex + 1}`}
                              className="flex-1"
                            />
                          </div>
                        ))}
                      </RadioGroup>
                      <p className="text-xs text-muted-foreground">
                        Select the radio button next to the correct answer
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Explanation (shown after answer)</Label>
                      <Textarea
                        value={question.explanation || ''}
                        onChange={(e) => updateQuestion(qIndex, { explanation: e.target.value })}
                        placeholder="Explain why this is the correct answer..."
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button variant="outline" onClick={addQuestion} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <SmartPromptDialog
        open={showPromptDialog}
        onOpenChange={setShowPromptDialog}
        title="Generate Quiz Questions"
        description="AI will create quiz questions based on the lesson content."
        defaultPrompt={smartPrompt}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />
    </>
  );
}
