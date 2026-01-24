import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuizData, QuizQuestion } from '@/hooks/useAdmin';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface QuizEditorProps {
  data: QuizData | null;
  onChange: (data: QuizData) => void;
}

export function QuizEditor({ data, onChange }: QuizEditorProps) {
  const questions = data?.questions || [];
  const passingScore = data?.passingScore || 70;

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: crypto.randomUUID(),
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
    };
    onChange({
      questions: [...questions, newQuestion],
      passingScore,
    });
  };

  const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    onChange({ questions: updated, passingScore });
  };

  const removeQuestion = (index: number) => {
    onChange({
      questions: questions.filter((_, i) => i !== index),
      passingScore,
    });
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex] = value;
    onChange({ questions: updated, passingScore });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>Quiz Questions</Label>
          <p className="text-sm text-muted-foreground">
            Add multiple choice questions for this quiz
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="passing-score" className="text-sm">Passing Score:</Label>
          <Input
            id="passing-score"
            type="number"
            min="0"
            max="100"
            value={passingScore}
            onChange={(e) => onChange({ questions, passingScore: parseInt(e.target.value) || 70 })}
            className="w-20"
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((question, qIndex) => (
          <Card key={question.id}>
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
      </div>

      <Button variant="outline" onClick={addQuestion} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Add Question
      </Button>
    </div>
  );
}
