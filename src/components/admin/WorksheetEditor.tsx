import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorksheetData } from '@/hooks/useAdmin';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface WorksheetEditorProps {
  data: WorksheetData | null;
  onChange: (data: WorksheetData) => void;
}

export function WorksheetEditor({ data, onChange }: WorksheetEditorProps) {
  const instructions = data?.instructions || '';
  const sections = data?.sections || [];

  const addSection = () => {
    const newSection = {
      id: crypto.randomUUID(),
      title: '',
      prompts: [''],
    };
    onChange({
      instructions,
      sections: [...sections, newSection],
    });
  };

  const updateSection = (index: number, updates: Partial<typeof sections[0]>) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], ...updates };
    onChange({ instructions, sections: updated });
  };

  const removeSection = (index: number) => {
    onChange({
      instructions,
      sections: sections.filter((_, i) => i !== index),
    });
  };

  const addPrompt = (sectionIndex: number) => {
    const updated = [...sections];
    updated[sectionIndex].prompts.push('');
    onChange({ instructions, sections: updated });
  };

  const updatePrompt = (sectionIndex: number, promptIndex: number, value: string) => {
    const updated = [...sections];
    updated[sectionIndex].prompts[promptIndex] = value;
    onChange({ instructions, sections: updated });
  };

  const removePrompt = (sectionIndex: number, promptIndex: number) => {
    const updated = [...sections];
    updated[sectionIndex].prompts = updated[sectionIndex].prompts.filter((_, i) => i !== promptIndex);
    onChange({ instructions, sections: updated });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Worksheet Instructions</Label>
        <Textarea
          value={instructions}
          onChange={(e) => onChange({ instructions: e.target.value, sections })}
          placeholder="Provide overall instructions for this worksheet..."
          rows={3}
        />
      </div>

      <div className="space-y-4">
        <Label>Sections</Label>
        {sections.map((section, sIndex) => (
          <Card key={section.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-2">
                <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-grab" />
                <Input
                  value={section.title}
                  onChange={(e) => updateSection(sIndex, { title: e.target.value })}
                  placeholder="Section title..."
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSection(sIndex)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label className="text-sm">Prompts / Questions</Label>
              {section.prompts.map((prompt, pIndex) => (
                <div key={pIndex} className="flex items-start gap-2">
                  <span className="text-sm text-muted-foreground mt-2">{pIndex + 1}.</span>
                  <Textarea
                    value={prompt}
                    onChange={(e) => updatePrompt(sIndex, pIndex, e.target.value)}
                    placeholder="Enter a prompt or question..."
                    rows={2}
                    className="flex-1"
                  />
                  {section.prompts.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePrompt(sIndex, pIndex)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addPrompt(sIndex)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Prompt
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" onClick={addSection} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Add Section
      </Button>
    </div>
  );
}
