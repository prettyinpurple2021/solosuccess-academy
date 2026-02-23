/**
 * @file ActivityEditor.tsx — Legacy Activity Builder (used in inline lesson editing)
 * Now wraps single activity editing within the multi-activity data format.
 */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ActivityData, SingleActivity, migrateActivityData } from '@/hooks/useAdmin';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { AIGenerateButton } from './AIGenerateButton';
import { GeneratedActivity } from '@/hooks/useContentGenerator';

interface ActivityEditorProps {
  data: ActivityData | null;
  onChange: (data: ActivityData) => void;
}

export function ActivityEditor({ data, onChange }: ActivityEditorProps) {
  const migrated = migrateActivityData(data);
  const activities = migrated?.activities || [];
  const act = activities[0] || { id: crypto.randomUUID(), title: 'Activity 1', instructions: '', type: 'exercise' as const, steps: [] };
  const instructions = act.instructions;
  const activityType = act.type;
  const steps = act.steps;

  const updateAct = (updates: Partial<SingleActivity>) => {
    const updated = { ...act, ...updates };
    const allActs = [...activities];
    allActs[0] = updated;
    onChange({ activities: allActs });
  };

  const handleAIGenerate = (result: GeneratedActivity) => {
    if (result) {
      const convertedSteps = result.steps?.map((step) => ({
        id: crypto.randomUUID(),
        title: step.title || '',
        description: step.instructions || '',
      })) || [];
      const newAct: SingleActivity = {
        id: crypto.randomUUID(),
        title: result.title || `Activity ${activities.length + 1}`,
        instructions: result.description || '',
        type: 'exercise',
        steps: convertedSteps,
      };
      onChange({ activities: [...activities, newAct] });
    }
  };

  const addStep = () => {
    updateAct({ steps: [...steps, { id: crypto.randomUUID(), title: '', description: '' }] });
  };

  const updateStep = (index: number, updates: Partial<typeof steps[0]>) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], ...updates };
    updateAct({ steps: updated });
  };

  const removeStep = (index: number) => {
    updateAct({ steps: steps.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <AIGenerateButton type="activity" onGenerated={handleAIGenerate} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Activity Type</Label>
          <Select
            value={activityType}
            onValueChange={(value: SingleActivity['type']) => updateAct({ type: value })}
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
        <Label>Activity Instructions</Label>
        <Textarea
          value={instructions}
          onChange={(e) => updateAct({ instructions: e.target.value })}
          placeholder="Describe the activity and what students should accomplish..."
          rows={4}
        />
      </div>

      <div className="space-y-4">
        <Label>Steps</Label>
        {steps.map((step, index) => (
          <Card key={step.id}>
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
                <Button variant="ghost" size="icon" onClick={() => removeStep(index)} className="text-destructive">
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
      </div>

      <Button variant="outline" onClick={addStep} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Add Step
      </Button>
    </div>
  );
}
