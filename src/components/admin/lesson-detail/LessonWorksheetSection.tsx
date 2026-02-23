/**
 * @file LessonWorksheetSection.tsx — Multi-Worksheet Editor
 * 
 * Supports adding, removing, and editing multiple worksheets per lesson.
 * Each worksheet has its own title, instructions, and sections with prompts.
 * AI generation adds a new worksheet (doesn't replace existing ones).
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, ClipboardList, Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { WorksheetData, SingleWorksheet } from '@/hooks/useAdmin';
import { useContentGenerator, GeneratedWorksheet } from '@/hooks/useContentGenerator';
import { SmartPromptDialog } from './SmartPromptDialog';
import { GenerationPreview } from './GenerationPreview';

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
  const [previewContent, setPreviewContent] = useState<GeneratedWorksheet | null>(null);
  // Track which worksheet is expanded (-1 = none)
  const [expandedIndex, setExpandedIndex] = useState<number>(0);

  const worksheets = worksheetData?.worksheets || [];

  // --- AI Generation handlers ---
  const handleGenerate = async (customPrompt: string) => {
    const result = await generateContent<GeneratedWorksheet>('worksheet', {
      lessonTitle,
      courseTitle,
      topic: lessonTitle,
    }, customPrompt);
    if (result) setPreviewContent(result);
    setShowPromptDialog(false);
  };

  const handleApplyPreview = () => {
    if (previewContent) {
      const newWorksheet: SingleWorksheet = {
        id: crypto.randomUUID(),
        title: previewContent.title || `Worksheet ${worksheets.length + 1}`,
        instructions: previewContent.instructions || '',
        sections: previewContent.sections?.map((section) => ({
          id: crypto.randomUUID(),
          title: section.title || '',
          prompts: section.exercises?.map((ex) => ex.prompt) || [''],
        })) || [],
      };
      const updated = [...worksheets, newWorksheet];
      onWorksheetDataChange({ worksheets: updated });
      setExpandedIndex(updated.length - 1);
      setPreviewContent(null);
    }
  };

  const handleDiscardPreview = () => setPreviewContent(null);
  const handleRegenerate = () => { setPreviewContent(null); setShowPromptDialog(true); };

  // --- CRUD for worksheets ---
  const addWorksheet = () => {
    const newWorksheet: SingleWorksheet = {
      id: crypto.randomUUID(),
      title: `Worksheet ${worksheets.length + 1}`,
      instructions: '',
      sections: [],
    };
    const updated = [...worksheets, newWorksheet];
    onWorksheetDataChange({ worksheets: updated });
    setExpandedIndex(updated.length - 1);
  };

  const removeWorksheet = (index: number) => {
    const updated = worksheets.filter((_, i) => i !== index);
    onWorksheetDataChange({ worksheets: updated });
    if (expandedIndex >= updated.length) setExpandedIndex(Math.max(0, updated.length - 1));
  };

  const updateWorksheet = (index: number, updates: Partial<SingleWorksheet>) => {
    const updated = [...worksheets];
    updated[index] = { ...updated[index], ...updates };
    onWorksheetDataChange({ worksheets: updated });
  };

  // --- Section/prompt helpers for a specific worksheet ---
  const addSection = (wIndex: number) => {
    const ws = worksheets[wIndex];
    updateWorksheet(wIndex, {
      sections: [...ws.sections, { id: crypto.randomUUID(), title: '', prompts: [''] }],
    });
  };

  const updateSection = (wIndex: number, sIndex: number, updates: Partial<SingleWorksheet['sections'][0]>) => {
    const ws = { ...worksheets[wIndex] };
    const sections = [...ws.sections];
    sections[sIndex] = { ...sections[sIndex], ...updates };
    updateWorksheet(wIndex, { sections });
  };

  const removeSection = (wIndex: number, sIndex: number) => {
    const ws = worksheets[wIndex];
    updateWorksheet(wIndex, { sections: ws.sections.filter((_, i) => i !== sIndex) });
  };

  const addPrompt = (wIndex: number, sIndex: number) => {
    const ws = { ...worksheets[wIndex] };
    const sections = [...ws.sections];
    sections[sIndex] = { ...sections[sIndex], prompts: [...sections[sIndex].prompts, ''] };
    updateWorksheet(wIndex, { sections });
  };

  const updatePrompt = (wIndex: number, sIndex: number, pIndex: number, value: string) => {
    const ws = { ...worksheets[wIndex] };
    const sections = [...ws.sections];
    const prompts = [...sections[sIndex].prompts];
    prompts[pIndex] = value;
    sections[sIndex] = { ...sections[sIndex], prompts };
    updateWorksheet(wIndex, { sections });
  };

  const removePrompt = (wIndex: number, sIndex: number, pIndex: number) => {
    const ws = { ...worksheets[wIndex] };
    const sections = [...ws.sections];
    sections[sIndex] = { ...sections[sIndex], prompts: sections[sIndex].prompts.filter((_, i) => i !== pIndex) };
    updateWorksheet(wIndex, { sections });
  };

  return (
    <>
      {/* Generation Preview */}
      {previewContent && (
        <GenerationPreview
          type="worksheet"
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
              <div className="p-2 rounded-lg bg-info/20">
                <ClipboardList className="h-5 w-5 text-info" />
              </div>
              <div>
                <CardTitle>Worksheets</CardTitle>
                <CardDescription>
                  {worksheets.length} worksheet{worksheets.length !== 1 ? 's' : ''} for this lesson
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={addWorksheet}>
                <Plus className="mr-2 h-4 w-4" />
                Add Worksheet
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
          {worksheets.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-muted-foreground/30 rounded-lg">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No worksheets yet</p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" onClick={addWorksheet}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Worksheet
                </Button>
                <Button variant="neon" onClick={() => setShowPromptDialog(true)} disabled={isGenerating}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate with AI
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {worksheets.map((worksheet, wIndex) => (
                <Card key={worksheet.id} className={`border-border/50 ${expandedIndex === wIndex ? 'border-primary/40' : ''}`}>
                  {/* Worksheet header — click to expand/collapse */}
                  <CardHeader
                    className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedIndex(expandedIndex === wIndex ? -1 : wIndex)}
                  >
                    <div className="flex items-center gap-2">
                      {expandedIndex === wIndex ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      <Badge variant="outline" className="shrink-0">#{wIndex + 1}</Badge>
                      <span className="font-medium flex-1 truncate">{worksheet.title || 'Untitled Worksheet'}</span>
                      <span className="text-xs text-muted-foreground">{worksheet.sections.length} section{worksheet.sections.length !== 1 ? 's' : ''}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); removeWorksheet(wIndex); }}
                        className="text-destructive hover:text-destructive shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  {/* Expanded worksheet editor */}
                  {expandedIndex === wIndex && (
                    <CardContent className="space-y-4 pt-0">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Worksheet Title</Label>
                          <Input
                            value={worksheet.title}
                            onChange={(e) => updateWorksheet(wIndex, { title: e.target.value })}
                            placeholder="e.g., Brand Audit Worksheet"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Instructions</Label>
                        <Textarea
                          value={worksheet.instructions}
                          onChange={(e) => updateWorksheet(wIndex, { instructions: e.target.value })}
                          placeholder="Overall instructions for this worksheet..."
                          rows={3}
                        />
                      </div>

                      {/* Sections */}
                      <div className="space-y-3">
                        <Label>Sections</Label>
                        {worksheet.sections.map((section, sIndex) => (
                          <Card key={section.id} className="border-border/30">
                            <CardHeader className="pb-2">
                              <div className="flex items-start gap-2">
                                <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-grab" />
                                <Input
                                  value={section.title}
                                  onChange={(e) => updateSection(wIndex, sIndex, { title: e.target.value })}
                                  placeholder="Section title..."
                                  className="flex-1"
                                />
                                <Button variant="ghost" size="icon" onClick={() => removeSection(wIndex, sIndex)} className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              {section.prompts.map((prompt, pIndex) => (
                                <div key={pIndex} className="flex items-start gap-2">
                                  <span className="text-sm text-muted-foreground mt-2">{pIndex + 1}.</span>
                                  <Textarea
                                    value={prompt}
                                    onChange={(e) => updatePrompt(wIndex, sIndex, pIndex, e.target.value)}
                                    placeholder="Enter a prompt or question..."
                                    rows={2}
                                    className="flex-1"
                                  />
                                  {section.prompts.length > 1 && (
                                    <Button variant="ghost" size="icon" onClick={() => removePrompt(wIndex, sIndex, pIndex)} className="text-destructive hover:text-destructive">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                              <Button variant="ghost" size="sm" onClick={() => addPrompt(wIndex, sIndex)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Prompt
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => addSection(wIndex)} className="w-full">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Section
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
        title="Generate Worksheet"
        description="AI will create a practical worksheet with exercises. It will be added as a new worksheet."
        defaultPrompt={smartPrompt}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        contentType="worksheet"
      />
    </>
  );
}
