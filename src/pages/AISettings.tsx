import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles,
  Image,
  Video,
  MessageSquare,
  Check,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Info,
} from 'lucide-react';

interface AIProvider {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  capabilities: string[];
  envKey: string;
  docsUrl: string;
  isBuiltIn?: boolean;
  isConfigured?: boolean;
}

const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'lovable',
    name: 'Lovable AI',
    description: 'Built-in AI for text and image generation. No API key required.',
    icon: Sparkles,
    capabilities: ['Text Generation', 'Image Generation'],
    envKey: 'LOVABLE_API_KEY',
    docsUrl: 'https://docs.lovable.dev/features/ai',
    isBuiltIn: true,
    isConfigured: true,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, DALL-E, and Whisper models for text, image, and audio.',
    icon: MessageSquare,
    capabilities: ['Text Generation', 'Image Generation', 'Audio Transcription'],
    envKey: 'OPENAI_API_KEY',
    docsUrl: 'https://platform.openai.com/docs',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models for advanced reasoning and long-form content.',
    icon: MessageSquare,
    capabilities: ['Text Generation'],
    envKey: 'ANTHROPIC_API_KEY',
    docsUrl: 'https://docs.anthropic.com',
  },
  {
    id: 'runway',
    name: 'Runway',
    description: 'AI video generation and editing capabilities.',
    icon: Video,
    capabilities: ['Video Generation'],
    envKey: 'RUNWAY_API_KEY',
    docsUrl: 'https://docs.runwayml.com',
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'Voice synthesis and text-to-speech for audio lessons.',
    icon: MessageSquare,
    capabilities: ['Voice Synthesis', 'Text-to-Speech'],
    envKey: 'ELEVENLABS_API_KEY',
    docsUrl: 'https://docs.elevenlabs.io',
  },
];

export default function AISettings() {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [enabledProviders, setEnabledProviders] = useState<Record<string, boolean>>({
    lovable: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleKeyChange = (providerId: string, value: string) => {
    setApiKeys((prev) => ({ ...prev, [providerId]: value }));
  };

  const toggleShowKey = (providerId: string) => {
    setShowKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const toggleProvider = (providerId: string) => {
    setEnabledProviders((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // In a real implementation, these would be saved to Supabase secrets
    // For now, show a message about adding secrets through Lovable Cloud
    toast({
      title: 'API Keys Configuration',
      description: 'To add API keys securely, please use Lovable Cloud secrets. Contact support for assistance with adding custom AI provider keys.',
    });

    setIsSaving(false);
  };

  return (
    <div className="container max-w-4xl py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">AI Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure AI providers for content generation, image creation, and more.
          </p>
        </div>

        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Built-in AI Available</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your project includes <strong>Lovable AI</strong> with support for text generation
              (Gemini, GPT-5) and image generation (Gemini Image) — no API key required! 
              Add external providers below for video generation or alternative models.
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="providers" className="space-y-6">
          <TabsList>
            <TabsTrigger value="providers">AI Providers</TabsTrigger>
            <TabsTrigger value="defaults">Default Models</TabsTrigger>
            <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-4">
            {AI_PROVIDERS.map((provider) => (
              <Card key={provider.id} className={provider.isBuiltIn ? 'border-primary/50' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          provider.isBuiltIn
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <provider.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{provider.name}</CardTitle>
                          {provider.isBuiltIn && (
                            <Badge variant="secondary" className="text-xs">
                              Built-in
                            </Badge>
                          )}
                          {provider.isConfigured && (
                            <Badge className="text-xs bg-secondary/50 text-secondary-foreground border-secondary">
                              <Check className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1">{provider.description}</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={enabledProviders[provider.id] || false}
                      onCheckedChange={() => toggleProvider(provider.id)}
                      disabled={provider.isBuiltIn}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {provider.capabilities.map((cap) => (
                      <Badge key={cap} variant="outline" className="text-xs">
                        {cap === 'Text Generation' && <MessageSquare className="h-3 w-3 mr-1" />}
                        {cap === 'Image Generation' && <Image className="h-3 w-3 mr-1" />}
                        {cap === 'Video Generation' && <Video className="h-3 w-3 mr-1" />}
                        {cap}
                      </Badge>
                    ))}
                  </div>

                  {!provider.isBuiltIn && (
                    <div className="space-y-2">
                      <Label htmlFor={`key-${provider.id}`}>API Key</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id={`key-${provider.id}`}
                            type={showKeys[provider.id] ? 'text' : 'password'}
                            value={apiKeys[provider.id] || ''}
                            onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                            placeholder={`Enter your ${provider.name} API key`}
                            className="pr-10"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => toggleShowKey(provider.id)}
                          >
                            {showKeys[provider.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <Button variant="outline" size="icon" asChild>
                          <a href={provider.docsUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Your API key will be stored securely as a Lovable Cloud secret.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="defaults" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Default Models</CardTitle>
                <CardDescription>
                  Choose which models to use for different content types.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Text Generation (Lessons, Quizzes)</Label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3">
                      <option value="gemini-3-flash">Gemini 3 Flash (Recommended)</option>
                      <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                      <option value="gpt-5">GPT-5 (if configured)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Image Generation (Illustrations, Thumbnails)</Label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3">
                      <option value="gemini-flash-image">Gemini Flash Image (Fast)</option>
                      <option value="gemini-3-pro-image">Gemini 3 Pro Image (High Quality)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Video Generation</Label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3" disabled>
                      <option value="">Configure Runway API key first</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Add a Runway API key above to enable video generation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Usage & Limits</CardTitle>
                <CardDescription>
                  Monitor your AI usage across different providers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">Lovable AI</p>
                      <p className="text-sm text-muted-foreground">
                        Included with your Lovable plan
                      </p>
                    </div>
                    <Badge className="bg-secondary/50 text-secondary-foreground">Active</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>
                      Lovable AI usage is included in your plan. For heavy usage, you may need to
                      add credits in Settings → Workspace → Usage.
                    </p>
                    <a
                      href="https://docs.lovable.dev/features/ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 mt-2"
                    >
                      Learn more about AI limits
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
