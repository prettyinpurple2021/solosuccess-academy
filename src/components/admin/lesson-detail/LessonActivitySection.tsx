import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, Zap, Plus, Trash2, GripVertical } from 'lucide-react';
import { ActivityData } from '@/hooks/useAdmin';
import { useContentGenerator, GeneratedActivity } from '@/hooks/useContentGenerator';
import { SmartPromptDialog } from './SmartPromptDialog';

interface LessonActivitySectionProps {
  lessonTitle: string;
  courseTitle: string;
  activityData: ActivityData | null;
  onActivityDataChange: (data: ActivityData | null) => void;
  smartPrompt: string;
}

export function LessonActivitySection({
  lessonTitle,
  courseTitle,
  activityData,
  onActivityDataChange,
  smartPrompt,
}: LessonActivitySectionProps) {
  const { generateContent, isGenerating } = useContentGenerator();
  const [showPromptDialog, setShowPromptDialog] = useState(false);

  const instructions = activityData?.instructions || '';
  const activityType = activityData?.type || 'exercise';
  const steps = activityData?.steps || [];

  const handleGenerate = async (customPrompt: string) => {
    const result = await generateContent<GeneratedActivity>('activity', {
      lessonTitle,
      courseTitle,
      topic: lessonTitle,
    }, customPrompt);
    
    if (result) {
      const convertedSteps = result.steps?.map((step) => ({
        id: crypto.randomUUID(),
        title: step.title || '',
        description: step.instructions || '',
      })) || [];
      
      onActivityDataChange({
        instructions: result.description || '',
        type: activityType,
        steps: convertedSteps,
      });
    }
    setShowPromptDialog(false);
  };

  const addStep = () => {
    const newStep = {
      id: crypto.randomUUID(),
      title: '',
      description: '',
    };
    onActivityDataChange({
      instructions,
      type: activityType,
      steps: [...steps, newStep],
    });
  };

  const updateStep = (index: number, updates: Partial<typeof steps[0]>) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], ...updates };
    onActivityDataChange({ instructions, type: activityType, steps: updated });
  };

  const removeStep = (index: number) => {
    onActivityDataChange({
      instructions,
      type: activityType,
      steps: steps.filter((_, i) => i !== index),
    });
  };

  return (
    <>
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/20">
                <Zap className="h-5 w-5 text-warning" />
              </div>
              <div>
                <CardTitle>Activity</CardTitle>
                <CardDescription>
                  {steps.length} step{steps.length !== 1 ? 's' : ''} • {activityType} type
                </CardDescription>
              </div>
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
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Activity Type</Label>
              <Select
                value={activityType}
                onValueChange={(value: ActivityData['type']) =>
                  onActivityDataChange({ instructions, type: value, steps })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reflection">Reflection</SelectItem>
                  <SelectItem value="exercise">Exercise</SelectItem>
                  <SelectItem value="case-study">Case Study</SelectItem>
                  <SelectItem value="brainstorm">Brainstorm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Activity Instructions</Label>
            <Textarea
              value={instructions}
              onChange={(e) => onActivityDataChange({ instructions: e.target.value, type: activityType, steps })}
              placeholder="Describe the activity and what students should accomplish..."
              rows={4}
            />
          </div>

          {steps.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-muted-foreground/30 rounded-lg">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No activity steps yet</p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" onClick={addStep}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Step
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
              <Label>Steps</Label>
              {steps.map((step, index) => (
                <Card key={step.id} className="border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-grab" />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">Step {index + 1}</span>
                          <Input
                            value={step.title}
                            onChange={(e) => updateStep(index, { title: e.target.value })}
                            placeholder="Step title..."
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStep(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={step.description}
                      onChange={(e) => updateStep(index, { description: e.target.value })}
                      placeholder="Describe what the student should do in this step..."
                      rows={3}
                    />
                  </CardContent>
                </Card>
              ))}

              <Button variant="outline" onClick={addStep} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Step
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <SmartPromptDialog
        open={showPromptDialog}
        onOpenChange={setShowPromptDialog}
        title="Generate Activity"
        description="AI will create a hands-on activity with clear steps."
        defaultPrompt={smartPrompt}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />
    </>
  );
}
