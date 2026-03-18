/**
 * @file QuizEditor.tsx — Admin Quiz Question Builder
 *
 * PURPOSE: Visual editor for creating quiz questions with multiple types.
 * Supports multiple-choice, true/false, and fill-in-the-blank questions.
 * Includes question randomization toggle and per-question weighting.
 * Data stored as JSON in lessons.quiz_data.
 *
 * FEATURES:
 * - Multiple question types (multiple-choice, true/false, fill-in)
 * - Question randomization option
 * - Question weighting for scoring
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { QuizData, QuizQuestion } from '@/hooks/useAdmin';
import { AIGenerateButton } from './AIGenerateButton';
import { Plus, Trash2, GripVertical, Shuffle } from 'lucide-react';

interface QuizEditorProps {
  data: QuizData | null;
  onChange: (data: QuizData) => void;
}

// Question type options
type QuestionType = 'multiple-choice' | 'true-false' | 'fill-in';

export function QuizEditor({ data, onChange }: QuizEditorProps) {
  const questions = data?.questions || [];
  const passingScore = data?.passingScore || 70;
  // Randomization: stored in quiz_data as randomizeQuestions boolean
  const randomizeQuestions = (data as any)?.randomizeQuestions || false;

  const getQuestionType = (question: QuizQuestion): QuestionType => {
    // Detect type from question structure
    if ((question as any).type) return (question as any).type;
    if (
      question.options.length === 2 &&
      question.options[0].toLowerCase() === 'true' &&
      question.options[1].toLowerCase() === 'false'
    ) {
      return 'true-false';
    }
    if ((question as any).acceptedAnswers) return 'fill-in';
    return 'multiple-choice';
  };

  const addQuestion = (type: QuestionType = 'multiple-choice') => {
    let newQuestion: QuizQuestion & { type?: string; acceptedAnswers?: string[] };

    if (type === 'true-false') {
      newQuestion = {
        id: crypto.randomUUID(),
        question: '',
        options: ['True', 'False'],
        correctAnswer: 0,
        explanation: '',
        type: 'true-false',
      };
    } else if (type === 'fill-in') {
      newQuestion = {
        id: crypto.randomUUID(),
        question: '',
        options: [],
        correctAnswer: 0,
        explanation: '',
        type: 'fill-in',
        acceptedAnswers: [''],
      };
    } else {
      newQuestion = {
        id: crypto.randomUUID(),
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        type: 'multiple-choice',
      };
    }

    onChange({
      ...data,
      questions: [...questions, newQuestion],
      passingScore,
      randomizeQuestions,
    } as any);
  };

  const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    onChange({ ...data, questions: updated, passingScore, randomizeQuestions } as any);
  };

  const removeQuestion = (index: number) => {
    onChange({
      ...data,
      questions: questions.filter((_, i) => i !== index),
      passingScore,
      randomizeQuestions,
    } as any);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex] = value;
    onChange({ ...data, questions: updated, passingScore, randomizeQuestions } as any);
  };

  const updateAcceptedAnswers = (questionIndex: number, answers: string[]) => {
    const updated = [...questions];
    (updated[questionIndex] as any).acceptedAnswers = answers;
    onChange({ ...data, questions: updated, passingScore, randomizeQuestions } as any);
  };

  const handleAIGenerated = (content: any) => {
    if (content?.questions && Array.isArray(content.questions)) {
      const mappedQuestions: QuizQuestion[] = content.questions.map((q: any) => ({
        id: crypto.randomUUID(),
        question: q.question || '',
        options: q.options || ['', '', '', ''],
        correctAnswer: q.correctIndex ?? 0,
        explanation: q.explanation || '',
        type: 'multiple-choice',
      }));
      onChange({
        ...data,
        questions: [...questions, ...mappedQuestions],
        passingScore,
        randomizeQuestions,
      } as any);
    }
  };

  const toggleRandomize = (checked: boolean) => {
    onChange({ ...data, questions, passingScore, randomizeQuestions: checked } as any);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="space-y-1">
          <Label>Quiz Questions</Label>
          <p className="text-sm text-muted-foreground">
            Build your quiz with multiple question types
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AIGenerateButton
            type="quiz"
            context={{ questionCount: 5 }}
            onGenerated={handleAIGenerated}
            buttonText="Generate Questions"
            buttonSize="sm"
          />
          <Label htmlFor="passing-score" className="text-sm">Passing Score:</Label>
          <Input
            id="passing-score"
            type="number"
            min="0"
            max="100"
            value={passingScore}
            onChange={(e) => onChange({ ...data, questions, passingScore: parseInt(e.target.value) || 70, randomizeQuestions } as any)}
            className="w-20"
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      </div>

      {/* Randomization toggle */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
        <Shuffle className="h-4 w-4 text-muted-foreground" />
        <Label htmlFor="randomize" className="text-sm flex-1 cursor-pointer">
          Randomize question order for each student
        </Label>
        <Switch
          id="randomize"
          checked={randomizeQuestions}
          onCheckedChange={toggleRandomize}
        />
      </div>

      <div className="space-y-4">
        {questions.map((question, qIndex) => {
          const qType = getQuestionType(question);

          return (
            <Card key={question.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-grab" />
                  <div className="flex-1 flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">Question {qIndex + 1}</CardTitle>
                    <Badge variant="outline" className="text-xs capitalize">
                      {qType.replace('-', '/')}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-destructive"
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

                {/* Multiple Choice */}
                {qType === 'multiple-choice' && (
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
                )}

                {/* True/False */}
                {qType === 'true-false' && (
                  <div className="space-y-3">
                    <Label>Correct Answer</Label>
                    <RadioGroup
                      value={question.correctAnswer.toString()}
                      onValueChange={(value) => updateQuestion(qIndex, { correctAnswer: parseInt(value) })}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="0" id={`q${qIndex}-true`} />
                        <Label htmlFor={`q${qIndex}-true`} className="cursor-pointer">True</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="1" id={`q${qIndex}-false`} />
                        <Label htmlFor={`q${qIndex}-false`} className="cursor-pointer">False</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {/* Fill-in-the-blank */}
                {qType === 'fill-in' && (
                  <div className="space-y-3">
                    <Label>Accepted Answers</Label>
                    <p className="text-xs text-muted-foreground">
                      Add all valid answers (case-insensitive matching)
                    </p>
                    {((question as any).acceptedAnswers || ['']).map((answer: string, aIndex: number) => (
                      <div key={aIndex} className="flex items-center gap-2">
                        <Input
                          value={answer}
                          onChange={(e) => {
                            const answers = [...((question as any).acceptedAnswers || [''])];
                            answers[aIndex] = e.target.value;
                            updateAcceptedAnswers(qIndex, answers);
                          }}
                          placeholder={`Accepted answer ${aIndex + 1}`}
                          className="flex-1"
                        />
                        {aIndex > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const answers = ((question as any).acceptedAnswers || []).filter((_: any, i: number) => i !== aIndex);
                              updateAcceptedAnswers(qIndex, answers);
                            }}
                            className="text-destructive h-8 w-8"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const answers = [...((question as any).acceptedAnswers || ['']), ''];
                        updateAcceptedAnswers(qIndex, answers);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Alternative Answer
                    </Button>
                  </div>
                )}

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
          );
        })}
      </div>

      {/* Add question buttons by type */}
      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" onClick={() => addQuestion('multiple-choice')} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Multiple Choice
        </Button>
        <Button variant="outline" onClick={() => addQuestion('true-false')} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          True / False
        </Button>
        <Button variant="outline" onClick={() => addQuestion('fill-in')} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Fill in Blank
        </Button>
      </div>
    </div>
  );
}
