/**
 * @file LessonActivitySection.tsx — Multi-Activity Editor
 *
 * Supports adding, removing, and editing multiple activities per lesson.
 * Each activity has its own title, type, instructions, and steps.
 * AI generation adds a new activity (doesn't replace existing ones).
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, Zap, Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { ActivityData, SingleActivity } from '@/hooks/useAdmin';
import { useContentGenerator, GeneratedActivity } from '@/hooks/useContentGenerator';
import { SmartPromptDialog } from './SmartPromptDialog';
import { GenerationPreview } from './GenerationPreview';

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
  const [previewContent, setPreviewContent] = useState<GeneratedActivity | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number>(0);

  const activities = activityData?.activities || [];

  // --- AI Generation ---
  const handleGenerate = async (customPrompt: string) => {
    const result = await generateContent<GeneratedActivity>('activity', {
      lessonTitle,
      courseTitle,
      topic: lessonTitle,
    }, customPrompt);
    if (result) setPreviewContent(result);
    setShowPromptDialog(false);
  };

  const handleApplyPreview = () => {
    if (previewContent) {
      const newActivity: SingleActivity = {
        id: crypto.randomUUID(),
        title: previewContent.title || `Activity ${activities.length + 1}`,
        instructions: previewContent.description || '',
        type: 'exercise',
        steps: previewContent.steps?.map((step) => ({
          id: crypto.randomUUID(),
          title: step.title || '',
          description: step.instructions || '',
        })) || [],
      };
      const updated = [...activities, newActivity];
      onActivityDataChange({ activities: updated });
      setExpandedIndex(updated.length - 1);
      setPreviewContent(null);
    }
  };

  const handleDiscardPreview = () => setPreviewContent(null);
  const handleRegenerate = () => { setPreviewContent(null); setShowPromptDialog(true); };

  // --- CRUD ---
  const addActivity = () => {
    const newActivity: SingleActivity = {
      id: crypto.randomUUID(),
      title: `Activity ${activities.length + 1}`,
      instructions: '',
      type: 'exercise',
      steps: [],
    };
    const updated = [...activities, newActivity];
    onActivityDataChange({ activities: updated });
    setExpandedIndex(updated.length - 1);
  };

  const removeActivity = (index: number) => {
    const updated = activities.filter((_, i) => i !== index);
    onActivityDataChange({ activities: updated });
    if (expandedIndex >= updated.length) setExpandedIndex(Math.max(0, updated.length - 1));
  };

  const updateActivity = (index: number, updates: Partial<SingleActivity>) => {
    const updated = [...activities];
    updated[index] = { ...updated[index], ...updates };
    onActivityDataChange({ activities: updated });
  };

  const addStep = (aIndex: number) => {
    const act = activities[aIndex];
    updateActivity(aIndex, {
      steps: [...act.steps, { id: crypto.randomUUID(), title: '', description: '' }],
    });
  };

  const updateStep = (aIndex: number, sIndex: number, updates: Partial<SingleActivity['steps'][0]>) => {
    const act = { ...activities[aIndex] };
    const steps = [...act.steps];
    steps[sIndex] = { ...steps[sIndex], ...updates };
    updateActivity(aIndex, { steps });
  };

  const removeStep = (aIndex: number, sIndex: number) => {
    const act = activities[aIndex];
    updateActivity(aIndex, { steps: act.steps.filter((_, i) => i !== sIndex) });
  };

  return (
    <>
      {previewContent && (
        <GenerationPreview
          type="activity"
          generatedContent={previewContent}
          onApply={handleApplyPreview}
          onDiscard={handleDiscardPreview}
          onRegenerate={handleRegenerate}
        />
      )}

      <Card className="glass-card border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/20">
                <Zap className="h-5 w-5 text-warning" />
              </div>
              <div>
                <CardTitle>Activities</CardTitle>
                <CardDescription>
                  {activities.length} activit{activities.length !== 1 ? 'ies' : 'y'} for this lesson
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={addActivity}>
                <Plus className="mr-2 h-4 w-4" />
                Add Activity
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPromptDialog(true)}
                disabled={isGenerating}
                className="border-primary/50 hover:border-primary hover:bg-primary/10 hover:text-primary"
              >
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate with AI
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-muted-foreground/30 rounded-lg">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No activities yet</p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" onClick={addActivity}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Activity
                </Button>
                <Button variant="neon" onClick={() => setShowPromptDialog(true)} disabled={isGenerating}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate with AI
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity, aIndex) => (
                <Card key={activity.id} className={`border-border/50 ${expandedIndex === aIndex ? 'border-primary/40' : ''}`}>
                  <CardHeader
                    className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedIndex(expandedIndex === aIndex ? -1 : aIndex)}
                  >
                    <div className="flex items-center gap-2">
                      {expandedIndex === aIndex ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      <Badge variant="outline" className="shrink-0">#{aIndex + 1}</Badge>
                      <span className="font-medium flex-1 truncate">{activity.title || 'Untitled Activity'}</span>
                      <Badge variant="secondary" className="text-xs">{activity.type}</Badge>
                      <span className="text-xs text-muted-foreground">{activity.steps.length} step{activity.steps.length !== 1 ? 's' : ''}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); removeActivity(aIndex); }}
                        className="text-destructive hover:text-destructive shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  {expandedIndex === aIndex && (
                    <CardContent className="space-y-4 pt-0">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Activity Title</Label>
                          <Input
                            value={activity.title}
                            onChange={(e) => updateActivity(aIndex, { title: e.target.value })}
                            placeholder="e.g., Competitor Research Sprint"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Activity Type</Label>
                          <Select
                            value={activity.type}
                            onValueChange={(value: SingleActivity['type']) => updateActivity(aIndex, { type: value })}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
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
                        <Label>Instructions</Label>
                        <Textarea
                          value={activity.instructions}
                          onChange={(e) => updateActivity(aIndex, { instructions: e.target.value })}
                          placeholder="Describe the activity and what students should accomplish..."
                          rows={3}
                        />
                      </div>

                      {/* Steps */}
                      <div className="space-y-3">
                        <Label>Steps</Label>
                        {activity.steps.map((step, sIndex) => (
                          <Card key={step.id} className="border-border/30">
                            <CardHeader className="pb-2">
                              <div className="flex items-start gap-2">
                                <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-grab" />
                                <div className="flex-1 flex items-center gap-2">
                                  <span className="text-sm font-medium text-muted-foreground">Step {sIndex + 1}</span>
                                  <Input
                                    value={step.title}
                                    onChange={(e) => updateStep(aIndex, sIndex, { title: e.target.value })}
                                    placeholder="Step title..."
                                    className="flex-1"
                                  />
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeStep(aIndex, sIndex)} className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <Textarea
                                value={step.description}
                                onChange={(e) => updateStep(aIndex, sIndex, { description: e.target.value })}
                                placeholder="Describe what the student should do..."
                                rows={3}
                              />
                            </CardContent>
                          </Card>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => addStep(aIndex)} className="w-full">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Step
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SmartPromptDialog
        open={showPromptDialog}
        onOpenChange={setShowPromptDialog}
        title="Generate Activity"
        description="AI will create a hands-on activity with clear steps. It will be added as a new activity."
        defaultPrompt={smartPrompt}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        contentType="activity"
      />
    </>
  );
}
