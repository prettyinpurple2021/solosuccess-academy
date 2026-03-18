/**
 * @file CourseEditor.tsx — Admin Course Create/Edit Form
 *
 * PURPOSE: Form for creating new courses or editing existing ones.
 * Fields: title, description, discussion question, project details, plug-and-play asset.
 * Uses useCreateCourse / useUpdateCourse mutations from useAdmin.ts.
 *
 * PRODUCTION TODO:
 * - Add course prerequisite selection
 */
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreateCourse } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, X, Upload, Image, Eye, Edit } from 'lucide-react';
import DOMPurify from 'dompurify';

interface CourseEditorProps {
  onClose: () => void;
}

type CoursePhase = 'initialization' | 'orchestration' | 'launch';

export function CourseEditor({ onClose }: CourseEditorProps) {
  // --- Form state ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [phase, setPhase] = useState<CoursePhase>('initialization');
  const [price, setPrice] = useState('49.00');

  // --- Cover image state ---
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // --- Rich text description mode ---
  const [descriptionTab, setDescriptionTab] = useState<string>('edit');

  const createCourse = useCreateCourse();
  const { toast } = useToast();

  /**
   * Upload course cover image to 'course-assets' storage bucket.
   * Path: course-covers/{timestamp}-{filename}
   */
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (images only)
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (JPG, PNG, WebP, etc.).',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB for cover images)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Cover image must be under 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingCover(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `course-covers/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('course-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL (course-assets bucket is public)
      const { data } = supabase.storage.from('course-assets').getPublicUrl(filePath);
      setCoverImageUrl(data.publicUrl);
      toast({ title: 'Cover image uploaded!' });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  /**
   * Convert basic markdown in description to sanitized HTML for preview.
   * Supports: headings, bold, italic, lists, paragraphs.
   */
  const renderDescriptionPreview = () => {
    if (!description.trim()) {
      return <p className="text-muted-foreground italic">Preview will appear here...</p>;
    }

    // Simple markdown-to-HTML conversion
    let html = description
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');

    html = `<p>${html}</p>`;
    // Wrap consecutive <li> in <ul>
    html = html.replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul>${match}</ul>`);

    return (
      <div
        className="prose prose-sm prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
      />
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }

    try {
      // Parse price safely — NaN defaults to $49.00
      const parsedPrice = parseFloat(price);
      const priceCents = !isNaN(parsedPrice) && parsedPrice >= 0
        ? Math.round(parsedPrice * 100)
        : 4900;

      await createCourse.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        phase,
        price_cents: priceCents,
        cover_image_url: coverImageUrl || null,
      });
      toast({ title: 'Course created!' });
      onClose();
    } catch (error: any) {
      toast({
        title: 'Failed to create course',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>New Course</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* --- Cover Image Upload --- */}
        <div className="space-y-2">
          <Label>Cover Image</Label>
          <div className="flex items-start gap-4">
            {/* Preview area */}
            <div className="w-40 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/30">
              {coverImageUrl ? (
                <img
                  src={coverImageUrl}
                  alt="Course cover preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image className="h-8 w-8 text-muted-foreground/50" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => coverInputRef.current?.click()}
                disabled={isUploadingCover}
              >
                {isUploadingCover ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {coverImageUrl ? 'Replace Image' : 'Upload Image'}
                  </>
                )}
              </Button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WebP. Max 5MB. Recommended 1200×630.
              </p>
              {coverImageUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive text-xs h-auto p-0"
                  onClick={() => setCoverImageUrl('')}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* --- Title --- */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Course Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter course title"
            />
          </div>

          {/* --- Rich Text Description with Edit/Preview tabs --- */}
          <div className="space-y-2 sm:col-span-2">
            <Label>Description (Markdown supported)</Label>
            <Tabs value={descriptionTab} onValueChange={setDescriptionTab}>
              <TabsList className="h-8">
                <TabsTrigger value="edit" className="text-xs gap-1">
                  <Edit className="h-3 w-3" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs gap-1">
                  <Eye className="h-3 w-3" />
                  Preview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="mt-2">
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter course description (supports **bold**, *italic*, # headings, - lists)"
                  rows={5}
                  className="font-mono text-sm"
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-2">
                <div className="border rounded-lg p-4 min-h-[130px] bg-muted/20">
                  {renderDescriptionPreview()}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* --- Phase selector --- */}
          <div className="space-y-2">
            <Label htmlFor="phase">Phase</Label>
            <Select value={phase} onValueChange={(v) => setPhase(v as CoursePhase)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="initialization">Initialization</SelectItem>
                <SelectItem value="orchestration">Orchestration</SelectItem>
                <SelectItem value="launch">Launch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* --- Price --- */}
          <div className="space-y-2">
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="49.00"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={createCourse.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={createCourse.isPending}>
            {createCourse.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Course
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
