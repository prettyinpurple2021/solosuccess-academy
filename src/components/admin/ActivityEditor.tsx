import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ActivityData } from '@/hooks/useAdmin';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface ActivityEditorProps {
  data: ActivityData | null;
  onChange: (data: ActivityData) => void;
}

export function ActivityEditor({ data, onChange }: ActivityEditorProps) {
  const instructions = data?.instructions || '';
  const activityType = data?.type || 'exercise';
  const steps = data?.steps || [];

  const addStep = () => {
    const newStep = {
      id: crypto.randomUUID(),
      title: '',
      description: '',
    };
    onChange({
      instructions,
      type: activityType,
      steps: [...steps, newStep],
    });
  };

  const updateStep = (index: number, updates: Partial<typeof steps[0]>) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], ...updates };
    onChange({ instructions, type: activityType, steps: updated });
  };

  const removeStep = (index: number) => {
    onChange({
      instructions,
      type: activityType,
      steps: steps.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Activity Type</Label>
          <Select
            value={activityType}
            onValueChange={(value: ActivityData['type']) =>
              onChange({ instructions, type: value, steps })
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
          onChange={(e) => onChange({ instructions: e.target.value, type: activityType, steps })}
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeStep(index)}
                  className="text-destructive"
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
      </div>

      <Button variant="outline" onClick={addStep} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Add Step
      </Button>
    </div>
  );
}
