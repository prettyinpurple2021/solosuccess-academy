import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, ClipboardList, Plus, Trash2, GripVertical } from 'lucide-react';
import { WorksheetData } from '@/hooks/useAdmin';
import { useContentGenerator, GeneratedWorksheet } from '@/hooks/useContentGenerator';
import { SmartPromptDialog } from './SmartPromptDialog';

interface LessonWorksheetSectionProps {
  lessonTitle: string;
  courseTitle: string;
  worksheetData: WorksheetData | null;
  onWorksheetDataChange: (data: WorksheetData | null) => void;
  smartPrompt: string;
}

export function LessonWorksheetSection({
  lessonTitle,
  courseTitle,
  worksheetData,
  onWorksheetDataChange,
  smartPrompt,
}: LessonWorksheetSectionProps) {
  const { generateContent, isGenerating } = useContentGenerator();
  const [showPromptDialog, setShowPromptDialog] = useState(false);

  const instructions = worksheetData?.instructions || '';
  const sections = worksheetData?.sections || [];

  const handleGenerate = async (customPrompt: string) => {
    const result = await generateContent<GeneratedWorksheet>('worksheet', {
      lessonTitle,
      courseTitle,
      topic: lessonTitle,
    }, customPrompt);
    
    if (result) {
      const convertedSections = result.sections?.map((section) => ({
        id: crypto.randomUUID(),
        title: section.title || '',
        prompts: section.exercises?.map((ex) => ex.prompt) || [''],
      })) || [];
      
      onWorksheetDataChange({
        instructions: result.instructions || '',
        sections: convertedSections,
      });
    }
    setShowPromptDialog(false);
  };

  const addSection = () => {
    const newSection = {
      id: crypto.randomUUID(),
      title: '',
      prompts: [''],
    };
    onWorksheetDataChange({
      instructions,
      sections: [...sections, newSection],
    });
  };

  const updateSection = (index: number, updates: Partial<typeof sections[0]>) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], ...updates };
    onWorksheetDataChange({ instructions, sections: updated });
  };

  const removeSection = (index: number) => {
    onWorksheetDataChange({
      instructions,
      sections: sections.filter((_, i) => i !== index),
    });
  };

  const addPrompt = (sectionIndex: number) => {
    const updated = [...sections];
    updated[sectionIndex].prompts.push('');
    onWorksheetDataChange({ instructions, sections: updated });
  };

  const updatePrompt = (sectionIndex: number, promptIndex: number, value: string) => {
    const updated = [...sections];
    updated[sectionIndex].prompts[promptIndex] = value;
    onWorksheetDataChange({ instructions, sections: updated });
  };

  const removePrompt = (sectionIndex: number, promptIndex: number) => {
    const updated = [...sections];
    updated[sectionIndex].prompts = updated[sectionIndex].prompts.filter((_, i) => i !== promptIndex);
    onWorksheetDataChange({ instructions, sections: updated });
  };

  return (
    <>
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/20">
                <ClipboardList className="h-5 w-5 text-info" />
              </div>
              <div>
                <CardTitle>Worksheet</CardTitle>
                <CardDescription>
                  {sections.length} section{sections.length !== 1 ? 's' : ''} with practical exercises
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
          <div className="space-y-2">
            <Label>Worksheet Instructions</Label>
            <Textarea
              value={instructions}
              onChange={(e) => onWorksheetDataChange({ instructions: e.target.value, sections })}
              placeholder="Provide overall instructions for this worksheet..."
              rows={3}
            />
          </div>

          {sections.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-muted-foreground/30 rounded-lg">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No worksheet sections yet</p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" onClick={addSection}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Section
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
              <Label>Sections</Label>
              {sections.map((section, sIndex) => (
                <Card key={section.id} className="border-border/50">
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
                        className="text-destructive hover:text-destructive"
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
                            className="text-destructive hover:text-destructive"
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

              <Button variant="outline" onClick={addSection} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Section
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <SmartPromptDialog
        open={showPromptDialog}
        onOpenChange={setShowPromptDialog}
        title="Generate Worksheet"
        description="AI will create a practical worksheet with exercises."
        defaultPrompt={smartPrompt}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />
    </>
  );
}
