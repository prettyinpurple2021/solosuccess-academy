/**
 * @file AISettings.tsx — Admin AI Provider Configuration
 *
 * PURPOSE: Allows the admin to configure API keys for external AI providers
 * (OpenAI, Anthropic, Runway, ElevenLabs). Keys are stored securely in the
 * admin_api_keys database table and read by edge functions at runtime.
 *
 * SECURITY: This page is only accessible to admin users. API keys are stored
 * in the database with RLS policies restricting access to admins only.
 *
 * HOW IT WORKS:
 * 1. On mount, fetches current key status from the manage-api-keys edge function
 * 2. Admin can add/update/delete keys per provider
 * 3. Keys are masked in the UI — only first/last 4 chars shown
 * 4. Edge functions read from admin_api_keys table as fallback for env vars
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Sparkles,
  Image,
  Video,
  MessageSquare,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Trash2,
  Save,
} from 'lucide-react';

// --- Provider definitions ---
interface AIProvider {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  capabilities: string[];
  envKey: string;
  docsUrl: string;
  isBuiltIn?: boolean;
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

// --- Stored key shape from the edge function ---
interface StoredKey {
  provider_id: string;
  is_enabled: boolean;
  updated_at: string;
  key_preview: string;
}

export default function AISettings() {
  // State for new key input per provider
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  // State for show/hide key input
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  // State for enable/disable toggles
  const [enabledProviders, setEnabledProviders] = useState<Record<string, boolean>>({
    lovable: true,
  });
  // Stored keys fetched from DB (masked)
  const [storedKeys, setStoredKeys] = useState<Record<string, StoredKey>>({});
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [deletingProvider, setDeletingProvider] = useState<string | null>(null);

  const { toast } = useToast();

  // --- Fetch stored keys on mount ---
  const fetchKeys = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-api-keys', {
        method: 'GET',
      });

      if (error) throw error;

      const keysMap: Record<string, StoredKey> = {};
      const enabledMap: Record<string, boolean> = { lovable: true };

      for (const key of data.keys || []) {
        keysMap[key.provider_id] = key;
        enabledMap[key.provider_id] = key.is_enabled;
      }

      setStoredKeys(keysMap);
      setEnabledProviders((prev) => ({ ...prev, ...enabledMap }));
    } catch (err) {
      console.error('Failed to fetch API keys:', err);
      toast({
        title: 'Error',
        description: 'Failed to load API key configuration.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  // --- Save a single provider's key ---
  const handleSaveProvider = async (providerId: string) => {
    setSavingProvider(providerId);

    try {
      const payload: Record<string, unknown> = {
        provider_id: providerId,
        is_enabled: enabledProviders[providerId] ?? true,
      };

      // Only include the key if the admin typed a new one
      const newKey = apiKeys[providerId]?.trim();
      if (newKey) {
        payload.api_key = newKey;
      } else if (!storedKeys[providerId]) {
        // No existing key and no new key entered
        toast({
          title: 'No API key entered',
          description: 'Please enter an API key before saving.',
          variant: 'destructive',
        });
        setSavingProvider(null);
        return;
      }

      const { error } = await supabase.functions.invoke('manage-api-keys', {
        method: 'POST',
        body: payload,
      });

      if (error) throw error;

      toast({
        title: 'Saved',
        description: `${AI_PROVIDERS.find((p) => p.id === providerId)?.name} configuration saved successfully.`,
      });

      // Clear the input and refresh stored keys
      setApiKeys((prev) => ({ ...prev, [providerId]: '' }));
      await fetchKeys();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSavingProvider(null);
    }
  };

  // --- Delete a provider's key ---
  const handleDeleteKey = async (providerId: string) => {
    setDeletingProvider(providerId);

    try {
      const { error } = await supabase.functions.invoke('manage-api-keys', {
        method: 'DELETE',
        body: { provider_id: providerId },
      });

      if (error) throw error;

      toast({
        title: 'Removed',
        description: `${AI_PROVIDERS.find((p) => p.id === providerId)?.name} API key removed.`,
      });

      await fetchKeys();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setDeletingProvider(null);
    }
  };

  // --- Toggle provider enabled/disabled ---
  const handleToggleProvider = async (providerId: string) => {
    const newEnabled = !enabledProviders[providerId];
    setEnabledProviders((prev) => ({ ...prev, [providerId]: newEnabled }));

    // If this provider has a stored key, update the enabled status immediately
    if (storedKeys[providerId]) {
      try {
        await supabase.functions.invoke('manage-api-keys', {
          method: 'POST',
          body: { provider_id: providerId, is_enabled: newEnabled },
        });
      } catch {
        // Revert on failure
        setEnabledProviders((prev) => ({ ...prev, [providerId]: !newEnabled }));
      }
    }
  };

  const toggleShowKey = (providerId: string) => {
    setShowKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">AI Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure AI providers for content generation, image creation, and more.
        </p>
      </div>

      {/* Built-in AI info card */}
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
            (Gemini, GPT-5) and image generation — no API key required!
            Add external providers below for video generation, voice synthesis, or alternative models.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="providers">AI Providers</TabsTrigger>
          <TabsTrigger value="defaults">Default Models</TabsTrigger>
          <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
        </TabsList>

        {/* ── Providers Tab ─────────────────────────────────────────────── */}
        <TabsContent value="providers" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading configuration...</span>
            </div>
          ) : (
            AI_PROVIDERS.map((provider) => {
              const stored = storedKeys[provider.id];
              const isConfigured = provider.isBuiltIn || !!stored;
              const isSaving = savingProvider === provider.id;
              const isDeleting = deletingProvider === provider.id;

              return (
                <Card key={provider.id} className={provider.isBuiltIn ? 'border-primary/50' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            isConfigured
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
                            {isConfigured && (
                              <Badge className="text-xs bg-secondary/50 text-secondary-foreground border-secondary">
                                <Check className="h-3 w-3 mr-1" />
                                {stored?.is_enabled !== false ? 'Active' : 'Disabled'}
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="mt-1">{provider.description}</CardDescription>
                        </div>
                      </div>
                      <Switch
                        checked={enabledProviders[provider.id] || false}
                        onCheckedChange={() => handleToggleProvider(provider.id)}
                        disabled={provider.isBuiltIn}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Capability badges */}
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

                    {/* API key input — only for non-built-in providers */}
                    {!provider.isBuiltIn && (
                      <div className="space-y-3">
                        {/* Show existing key preview if saved */}
                        {stored && (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                            <Check className="h-4 w-4 text-secondary shrink-0" />
                            <span className="text-sm font-mono text-muted-foreground flex-1">
                              {stored.key_preview}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteKey(provider.id)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )}

                        <Label htmlFor={`key-${provider.id}`}>
                          {stored ? 'Update API Key' : 'API Key'}
                        </Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              id={`key-${provider.id}`}
                              type={showKeys[provider.id] ? 'text' : 'password'}
                              value={apiKeys[provider.id] || ''}
                              onChange={(e) =>
                                setApiKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))
                              }
                              placeholder={
                                stored
                                  ? `Enter new key to replace existing`
                                  : `Enter your ${provider.name} API key`
                              }
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

                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            Your API key is stored securely in the database with admin-only access.
                          </p>
                          <Button
                            size="sm"
                            onClick={() => handleSaveProvider(provider.id)}
                            disabled={isSaving || (!apiKeys[provider.id]?.trim() && !stored)}
                          >
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 mr-1" />
                            )}
                            {stored ? 'Update' : 'Save Key'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* ── Default Models Tab ────────────────────────────────────────── */}
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
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-foreground">
                    <option value="gemini-3-flash">Gemini 3 Flash (Recommended)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    <option value="gpt-5">GPT-5 (if configured)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Image Generation (Illustrations, Thumbnails)</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-foreground">
                    <option value="gemini-flash-image">Gemini Flash Image (Fast)</option>
                    <option value="gemini-3-pro-image">Gemini 3 Pro Image (High Quality)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Video Generation</Label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-foreground"
                    disabled={!storedKeys['runway']}
                  >
                    {storedKeys['runway'] ? (
                      <option value="runway">Runway (Configured)</option>
                    ) : (
                      <option value="">Configure Runway API key first</option>
                    )}
                  </select>
                  {!storedKeys['runway'] && (
                    <p className="text-xs text-muted-foreground">
                      Add a Runway API key in the Providers tab to enable video generation.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Voice Synthesis</Label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-foreground"
                    disabled={!storedKeys['elevenlabs']}
                  >
                    {storedKeys['elevenlabs'] ? (
                      <option value="elevenlabs">ElevenLabs (Configured)</option>
                    ) : (
                      <option value="">Configure ElevenLabs API key first</option>
                    )}
                  </select>
                  {!storedKeys['elevenlabs'] && (
                    <p className="text-xs text-muted-foreground">
                      Add an ElevenLabs API key in the Providers tab to enable voice synthesis.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Usage Tab ─────────────────────────────────────────────────── */}
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
                {Object.entries(storedKeys).map(([id, key]) => {
                  const provider = AI_PROVIDERS.find((p) => p.id === id);
                  if (!provider) return null;
                  return (
                    <div key={id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{provider.name}</p>
                        <p className="text-sm text-muted-foreground font-mono">{key.key_preview}</p>
                      </div>
                      <Badge
                        className={
                          key.is_enabled
                            ? 'bg-secondary/50 text-secondary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }
                      >
                        {key.is_enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                  );
                })}
                <div className="text-sm text-muted-foreground">
                  <p>
                    Rate limits are enforced per-function. See individual edge function logs for
                    detailed usage tracking.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
