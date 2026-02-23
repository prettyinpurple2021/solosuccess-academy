/**
 * @file WorksheetEditor.tsx — Legacy Worksheet Builder (used in inline lesson editing)
 * Now wraps single worksheet editing within the multi-worksheet data format.
 */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { WorksheetData, migrateWorksheetData } from '@/hooks/useAdmin';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { AIGenerateButton } from './AIGenerateButton';
import { GeneratedWorksheet } from '@/hooks/useContentGenerator';

interface WorksheetEditorProps {
  data: WorksheetData | null;
  onChange: (data: WorksheetData) => void;
}

export function WorksheetEditor({ data, onChange }: WorksheetEditorProps) {
  // Migrate legacy data on first render
  const migrated = migrateWorksheetData(data);
  const worksheets = migrated?.worksheets || [];
  // Edit the first worksheet (this editor is the simple/inline version)
  const ws = worksheets[0] || { id: crypto.randomUUID(), title: 'Worksheet 1', instructions: '', sections: [] };
  const instructions = ws.instructions;
  const sections = ws.sections;

  const updateWs = (updates: Partial<typeof ws>) => {
    const updated = { ...ws, ...updates };
    const allWs = [...worksheets];
    allWs[0] = updated;
    onChange({ worksheets: allWs });
  };

  const handleAIGenerate = (result: GeneratedWorksheet) => {
    if (result) {
      const convertedSections = result.sections?.map((section) => ({
        id: crypto.randomUUID(),
        title: section.title || '',
        prompts: section.exercises?.map((ex) => ex.prompt) || [''],
      })) || [];
      const newWs = {
        id: crypto.randomUUID(),
        title: result.title || `Worksheet ${worksheets.length + 1}`,
        instructions: result.instructions || '',
        sections: convertedSections,
      };
      onChange({ worksheets: [...worksheets, newWs] });
    }
  };

  const addSection = () => {
    updateWs({ sections: [...sections, { id: crypto.randomUUID(), title: '', prompts: [''] }] });
  };

  const updateSection = (index: number, updates: Partial<typeof sections[0]>) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], ...updates };
    updateWs({ sections: updated });
  };

  const removeSection = (index: number) => {
    updateWs({ sections: sections.filter((_, i) => i !== index) });
  };

  const addPrompt = (sectionIndex: number) => {
    const updated = [...sections];
    updated[sectionIndex] = { ...updated[sectionIndex], prompts: [...updated[sectionIndex].prompts, ''] };
    updateWs({ sections: updated });
  };

  const updatePrompt = (sectionIndex: number, promptIndex: number, value: string) => {
    const updated = [...sections];
    const prompts = [...updated[sectionIndex].prompts];
    prompts[promptIndex] = value;
    updated[sectionIndex] = { ...updated[sectionIndex], prompts };
    updateWs({ sections: updated });
  };

  const removePrompt = (sectionIndex: number, promptIndex: number) => {
    const updated = [...sections];
    updated[sectionIndex] = { ...updated[sectionIndex], prompts: updated[sectionIndex].prompts.filter((_, i) => i !== promptIndex) };
    updateWs({ sections: updated });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <AIGenerateButton type="worksheet" onGenerated={handleAIGenerate} />
      </div>

      <div className="space-y-2">
        <Label>Worksheet Instructions</Label>
        <Textarea
          value={instructions}
          onChange={(e) => updateWs({ instructions: e.target.value })}
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
                <Button variant="ghost" size="icon" onClick={() => removeSection(sIndex)} className="text-destructive">
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
                    <Button variant="ghost" size="icon" onClick={() => removePrompt(sIndex, pIndex)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => addPrompt(sIndex)}>
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
