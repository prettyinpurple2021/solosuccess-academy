import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Loader2, 
  Edit, 
  RotateCcw, 
  Wand2,
  FileText,
  MessageSquare,
  Zap,
  Target,
  BookOpen,
  Lightbulb,
  Copy,
  Check,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ContentTone = 'professional' | 'conversational' | 'motivational' | 'academic';
export type ContentLength = 'concise' | 'standard' | 'detailed';

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  promptModifier: string;
}

interface SmartPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  defaultPrompt: string;
  onGenerate: (prompt: string) => Promise<void>;
  isGenerating: boolean;
  contentType?: 'content' | 'quiz' | 'worksheet' | 'activity' | 'textbook';
}

const toneOptions: { value: ContentTone; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'professional', label: 'Professional', description: 'Formal, business-focused', icon: <Target className="h-4 w-4" /> },
  { value: 'conversational', label: 'Conversational', description: 'Friendly, approachable', icon: <MessageSquare className="h-4 w-4" /> },
  { value: 'motivational', label: 'Motivational', description: 'Inspiring, action-driven', icon: <Zap className="h-4 w-4" /> },
  { value: 'academic', label: 'Academic', description: 'Educational, thorough', icon: <BookOpen className="h-4 w-4" /> },
];

const lengthOptions: { value: ContentLength; label: string; wordRange: string }[] = [
  { value: 'concise', label: 'Concise', wordRange: '300-500 words' },
  { value: 'standard', label: 'Standard', wordRange: '800-1200 words' },
  { value: 'detailed', label: 'Detailed', wordRange: '1500-2500 words' },
];

const promptTemplates: Record<string, PromptTemplate[]> = {
  content: [
    {
      id: 'step-by-step',
      name: 'Step-by-Step Guide',
      description: 'Structured tutorial with numbered steps',
      icon: <FileText className="h-4 w-4" />,
      promptModifier: 'Format as a step-by-step guide with numbered steps, clear instructions, and practical examples for each step.',
    },
    {
      id: 'case-study',
      name: 'Case Study Style',
      description: 'Real-world examples and analysis',
      icon: <Lightbulb className="h-4 w-4" />,
      promptModifier: 'Include 2-3 real-world case studies or examples. Analyze what worked, what didn\'t, and key takeaways from each.',
    },
    {
      id: 'problem-solution',
      name: 'Problem-Solution',
      description: 'Address challenges with solutions',
      icon: <Target className="h-4 w-4" />,
      promptModifier: 'Structure around common problems/challenges and provide actionable solutions for each. Include "before and after" scenarios.',
    },
    {
      id: 'checklist',
      name: 'Checklist Format',
      description: 'Actionable checklist style',
      icon: <Check className="h-4 w-4" />,
      promptModifier: 'Include actionable checklists that learners can use immediately. Break down complex tasks into checkbox items.',
    },
  ],
  quiz: [
    {
      id: 'knowledge-check',
      name: 'Knowledge Check',
      description: 'Basic comprehension questions',
      icon: <FileText className="h-4 w-4" />,
      promptModifier: 'Create straightforward questions that test basic understanding and recall of key concepts.',
    },
    {
      id: 'scenario-based',
      name: 'Scenario-Based',
      description: 'Real-world application questions',
      icon: <Lightbulb className="h-4 w-4" />,
      promptModifier: 'Create scenario-based questions where learners apply concepts to realistic business situations.',
    },
    {
      id: 'critical-thinking',
      name: 'Critical Thinking',
      description: 'Analysis and evaluation questions',
      icon: <Target className="h-4 w-4" />,
      promptModifier: 'Create questions that require critical thinking, analysis, and evaluation rather than simple recall.',
    },
  ],
  worksheet: [
    {
      id: 'reflection',
      name: 'Reflection Journal',
      description: 'Self-reflection prompts',
      icon: <MessageSquare className="h-4 w-4" />,
      promptModifier: 'Focus on self-reflection questions that help learners connect concepts to their own business situation.',
    },
    {
      id: 'planning',
      name: 'Action Planner',
      description: 'Strategic planning exercises',
      icon: <Target className="h-4 w-4" />,
      promptModifier: 'Create planning templates and exercises that result in a concrete action plan the learner can implement.',
    },
    {
      id: 'assessment',
      name: 'Self-Assessment',
      description: 'Evaluate current state',
      icon: <FileText className="h-4 w-4" />,
      promptModifier: 'Include self-assessment rubrics and rating scales so learners can evaluate their current situation.',
    },
  ],
  activity: [
    {
      id: 'hands-on',
      name: 'Hands-On Project',
      description: 'Create something tangible',
      icon: <Wand2 className="h-4 w-4" />,
      promptModifier: 'Design an activity where learners create a tangible deliverable they can use in their business immediately.',
    },
    {
      id: 'research',
      name: 'Research & Analyze',
      description: 'Investigate and report',
      icon: <Lightbulb className="h-4 w-4" />,
      promptModifier: 'Create a research activity where learners investigate their market, competitors, or customers and document findings.',
    },
    {
      id: 'practice',
      name: 'Skill Practice',
      description: 'Repeated skill exercises',
      icon: <Target className="h-4 w-4" />,
      promptModifier: 'Design practice exercises that build specific skills through repetition and progressive difficulty.',
    },
  ],
  textbook: [
    {
      id: 'comprehensive',
      name: 'Comprehensive Guide',
      description: 'In-depth coverage',
      icon: <BookOpen className="h-4 w-4" />,
      promptModifier: 'Create comprehensive, textbook-style content with thorough explanations, examples, and references.',
    },
    {
      id: 'quick-reference',
      name: 'Quick Reference',
      description: 'Scannable key points',
      icon: <FileText className="h-4 w-4" />,
      promptModifier: 'Format as a quick-reference guide with bullet points, tables, and easily scannable information.',
    },
  ],
};

export function SmartPromptDialog({
  open,
  onOpenChange,
  title,
  description,
  defaultPrompt,
  onGenerate,
  isGenerating,
  contentType = 'content',
}: SmartPromptDialogProps) {
  const [customPrompt, setCustomPrompt] = useState(defaultPrompt);
  const [isEdited, setIsEdited] = useState(false);
  const [selectedTone, setSelectedTone] = useState<ContentTone>('professional');
  const [selectedLength, setSelectedLength] = useState<ContentLength>('standard');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'quick' | 'advanced'>('quick');
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

  const templates = promptTemplates[contentType] || promptTemplates.content;

  // Reset to default prompt when dialog opens
  useEffect(() => {
    if (open) {
      setCustomPrompt(defaultPrompt);
      setIsEdited(false);
      setSelectedTemplate(null);
      setActiveTab('quick');
    }
  }, [open, defaultPrompt]);

  const handlePromptChange = (value: string) => {
    setCustomPrompt(value);
    setIsEdited(value !== defaultPrompt);
  };

  const handleReset = () => {
    setCustomPrompt(defaultPrompt);
    setIsEdited(false);
    setSelectedTemplate(null);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId === selectedTemplate ? null : templateId);
  };

  const handleCopyTemplate = (template: PromptTemplate) => {
    navigator.clipboard.writeText(template.promptModifier);
    setCopiedTemplate(template.id);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  const handleApplyTemplate = (template: PromptTemplate) => {
    const newPrompt = `${customPrompt}\n\n${template.promptModifier}`;
    setCustomPrompt(newPrompt);
    setIsEdited(true);
    setActiveTab('advanced');
  };

  const buildFinalPrompt = () => {
    let finalPrompt = customPrompt;
    
    // Add tone modifier
    const toneModifiers: Record<ContentTone, string> = {
      professional: 'Use a professional, business-focused tone.',
      conversational: 'Use a friendly, conversational tone that feels approachable.',
      motivational: 'Use an inspiring, motivational tone that drives action.',
      academic: 'Use an educational, thorough academic tone.',
    };
    
    // Add length modifier
    const lengthModifiers: Record<ContentLength, string> = {
      concise: 'Keep the content concise and focused (300-500 words).',
      standard: 'Use standard length with good detail (800-1200 words).',
      detailed: 'Create comprehensive, detailed content (1500-2500 words).',
    };

    // Add selected template modifier if any
    const template = templates.find(t => t.id === selectedTemplate);
    
    finalPrompt += `\n\n${toneModifiers[selectedTone]} ${lengthModifiers[selectedLength]}`;
    
    if (template) {
      finalPrompt += `\n\n${template.promptModifier}`;
    }

    return finalPrompt;
  };

  const handleGenerate = async () => {
    const finalPrompt = activeTab === 'quick' ? buildFinalPrompt() : customPrompt;
    await onGenerate(finalPrompt);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'quick' | 'advanced')} className="min-h-0 flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-2 w-full shrink-0">
            <TabsTrigger value="quick" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Quick Generate
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 min-h-0 mt-4">
            <TabsContent value="quick" className="space-y-6 m-0 pr-4">
              {/* Tone Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Tone & Style</Label>
                <div className="grid grid-cols-2 gap-2">
                  {toneOptions.map((tone) => (
                    <button
                      key={tone.value}
                      onClick={() => setSelectedTone(tone.value)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                        selectedTone === tone.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-md",
                        selectedTone === tone.value ? "bg-primary/20" : "bg-muted"
                      )}>
                        {tone.icon}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{tone.label}</div>
                        <div className="text-xs text-muted-foreground">{tone.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Length Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Content Length</Label>
                <div className="flex gap-2">
                  {lengthOptions.map((length) => (
                    <button
                      key={length.value}
                      onClick={() => setSelectedLength(length.value)}
                      className={cn(
                        "flex-1 py-2 px-4 rounded-lg border text-center transition-all",
                        selectedLength === length.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <div className="font-medium text-sm">{length.label}</div>
                      <div className="text-xs text-muted-foreground">{length.wordRange}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Format Template (optional)</Label>
                <div className="grid gap-2">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border text-left transition-all group",
                        selectedTemplate === template.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-md shrink-0",
                        selectedTemplate === template.id ? "bg-primary/20 text-primary" : "bg-muted"
                      )}>
                        {template.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{template.description}</div>
                      </div>
                      {selectedTemplate === template.id && (
                        <Badge variant="secondary" className="bg-primary/20 text-primary shrink-0">
                          Selected
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview Summary */}
              <div className="p-4 rounded-lg bg-muted/50 border border-dashed border-muted-foreground/30">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Generation Settings</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{toneOptions.find(t => t.value === selectedTone)?.label}</Badge>
                  <Badge variant="outline">{lengthOptions.find(l => l.value === selectedLength)?.label}</Badge>
                  {selectedTemplate && (
                    <Badge variant="outline">{templates.find(t => t.id === selectedTemplate)?.name}</Badge>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 m-0 pr-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prompt" className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Custom Prompt
                    {isEdited && (
                      <span className="text-xs text-muted-foreground">(edited)</span>
                    )}
                  </Label>
                  {isEdited && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                      className="h-7 text-xs"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reset
                    </Button>
                  )}
                </div>
                <Textarea
                  id="prompt"
                  value={customPrompt}
                  onChange={(e) => handlePromptChange(e.target.value)}
                  placeholder="Describe what you want the AI to generate..."
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              {/* Quick Insert Templates */}
              <div className="space-y-2">
                <Label className="text-sm">Quick Insert</Label>
                <div className="flex flex-wrap gap-2">
                  {templates.map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyTemplate(template)}
                      className="text-xs"
                    >
                      {template.icon}
                      <span className="ml-1">{template.name}</span>
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                💡 The prompt is pre-populated with lesson context. Customize it for specific output or use the Quick Generate tab for guided options.
              </p>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            variant="neon"
            onClick={handleGenerate}
            disabled={isGenerating || !customPrompt.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
