/**
 * AdminBlogAutoPost — Admin control panel for the auto-publishing blog engine.
 *
 * Lets admins:
 * - Add/remove topics in the queue (the generator pulls from here first).
 * - Manually trigger the generator ("Publish next post now").
 * - See recently generated posts.
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Rocket, ExternalLink } from 'lucide-react';

interface QueueRow {
  id: string;
  topic: string;
  angle: string | null;
  target_keyword: string | null;
  status: string;
  created_at: string;
}
interface PostRow {
  id: string;
  slug: string;
  title: string;
  generated_by: string;
  published_at: string;
}

export default function AdminBlogAutoPost() {
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [topic, setTopic] = useState('');
  const [angle, setAngle] = useState('');
  const [keyword, setKeyword] = useState('');
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [{ data: q }, { data: p }] = await Promise.all([
      supabase
        .from('blog_topic_queue')
        .select('id,topic,angle,target_keyword,status,created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('blog_posts')
        .select('id,slug,title,generated_by,published_at')
        .order('published_at', { ascending: false })
        .limit(20),
    ]);
    setQueue((q as QueueRow[]) ?? []);
    setPosts((p as PostRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function addTopic() {
    if (!topic.trim()) return;
    const { error } = await supabase.from('blog_topic_queue').insert({
      topic: topic.trim(),
      angle: angle.trim() || null,
      target_keyword: keyword.trim() || null,
    });
    if (error) return toast.error(error.message);
    toast.success('Topic added to queue');
    setTopic('');
    setAngle('');
    setKeyword('');
    refresh();
  }

  async function removeTopic(id: string) {
    const { error } = await supabase.from('blog_topic_queue').delete().eq('id', id);
    if (error) return toast.error(error.message);
    refresh();
  }

  async function generateNow() {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-post');
      if (error) throw error;
      const payload = data as { slug?: string; error?: string };
      if (payload?.error) throw new Error(payload.error);
      toast.success(`Published: ${payload.slug}`);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="container py-8 max-w-5xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-display font-bold">Auto-Publishing Blog</h1>
        <p className="text-muted-foreground text-sm">
          A new post is generated and published every Monday at 14:00 UTC. The generator pulls from
          the queue first; if empty, it picks a fresh solopreneur topic on its own.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Publish next post now</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={generateNow} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Rocket className="h-4 w-4 mr-2" />}
            Generate and publish
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Topic queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-3">
            <Input placeholder="Topic title" value={topic} onChange={(e) => setTopic(e.target.value)} />
            <Input placeholder="Angle (optional)" value={angle} onChange={(e) => setAngle(e.target.value)} />
            <Input placeholder="Target keyword (optional)" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <Button onClick={addTopic} variant="secondary">
            <Plus className="h-4 w-4 mr-2" /> Add to queue
          </Button>

          <div className="divide-y border rounded-lg">
            {loading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
            {!loading && queue.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">
                Queue is empty — the AI will pick a topic on its own.
              </p>
            )}
            {queue.map((q) => (
              <div key={q.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{q.topic}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {q.status}
                    {q.target_keyword ? ` · kw: ${q.target_keyword}` : ''}
                  </p>
                </div>
                {q.status === 'pending' && (
                  <Button variant="ghost" size="sm" onClick={() => removeTopic(q.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recently published</CardTitle>
        </CardHeader>
        <CardContent className="divide-y border rounded-lg">
          {posts.length === 0 && <p className="p-4 text-sm text-muted-foreground">No posts yet.</p>}
          {posts.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{p.title}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {p.generated_by} · {new Date(p.published_at).toLocaleDateString()}
                </p>
              </div>
              <a
                href={`/blog/${p.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-primary text-sm inline-flex items-center gap-1"
              >
                View <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}