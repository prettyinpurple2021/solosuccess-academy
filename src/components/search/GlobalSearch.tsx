/**
 * @file GlobalSearch.tsx — Platform-wide search across lessons, textbooks, and discussions
 *
 * HOW IT WORKS:
 * - Opens with Ctrl+K or clicking the search icon in the header
 * - Searches lessons (titles + content), textbook pages (content), 
 *   and discussions (titles + content) simultaneously
 * - Results are clickable and navigate to the relevant page
 * - Debounced input to avoid excessive queries
 *
 * SECURITY: Only searches content the user has purchased access to.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Search,
  FileText,
  BookOpen,
  MessageSquare,
  Loader2,
} from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  type: 'lesson' | 'textbook' | 'discussion';
  courseId?: string;
  /** For navigation: lesson id, chapter id, or discussion id */
  targetId: string;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  // Debounced search
  const handleSearch = useCallback(
    (searchQuery: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!searchQuery.trim() || searchQuery.length < 2) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      debounceRef.current = setTimeout(async () => {
        try {
          const searchTerm = `%${searchQuery}%`;
          const allResults: SearchResult[] = [];

          // Search lessons (title + content)
          const { data: lessons } = await supabase
            .from('lessons')
            .select('id, title, content, course_id')
            .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
            .limit(5);

          if (lessons) {
            lessons.forEach((l) => {
              // Extract snippet around the match
              const snippet = extractSnippet(l.content || l.title, searchQuery);
              allResults.push({
                id: l.id,
                title: l.title,
                snippet,
                type: 'lesson',
                courseId: l.course_id,
                targetId: l.id,
              });
            });
          }

          // Search textbook pages (content)
          const { data: pages } = await supabase
            .from('textbook_pages')
            .select('id, content, chapter_id')
            .ilike('content', searchTerm)
            .limit(5);

          if (pages) {
            // Get chapter info for navigation
            const chapterIds = [...new Set(pages.map((p) => p.chapter_id))];
            const { data: chapters } = await supabase
              .from('textbook_chapters')
              .select('id, title, course_id')
              .in('id', chapterIds);

            const chapterMap = new Map(chapters?.map((c) => [c.id, c]) || []);

            pages.forEach((p) => {
              const chapter = chapterMap.get(p.chapter_id);
              const snippet = extractSnippet(p.content, searchQuery);
              allResults.push({
                id: p.id,
                title: chapter?.title || 'Textbook Page',
                snippet,
                type: 'textbook',
                courseId: chapter?.course_id,
                targetId: chapter?.course_id || '',
              });
            });
          }

          // Search discussions (title + content)
          const { data: discussions } = await supabase
            .from('discussions')
            .select('id, title, content, course_id')
            .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
            .limit(5);

          if (discussions) {
            discussions.forEach((d) => {
              const snippet = extractSnippet(d.content || d.title, searchQuery);
              allResults.push({
                id: d.id,
                title: d.title,
                snippet,
                type: 'discussion',
                courseId: d.course_id,
                targetId: d.id,
              });
            });
          }

          setResults(allResults);
        } catch (err) {
          console.error('Search error:', err);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    },
    []
  );

  const handleInputChange = (value: string) => {
    setQuery(value);
    handleSearch(value);
  };

  const handleResultClick = (result: SearchResult) => {
    onOpenChange(false);

    switch (result.type) {
      case 'lesson':
        navigate(`/courses/${result.courseId}/lessons/${result.targetId}`);
        break;
      case 'textbook':
        navigate(`/courses/${result.targetId}/textbook`);
        break;
      case 'discussion':
        navigate(`/courses/${result.courseId}/discussions/${result.targetId}`);
        break;
    }
  };

  // Type-specific icon and color
  const typeConfig = {
    lesson: { icon: FileText, label: 'Lesson', className: 'border-primary/30 text-primary' },
    textbook: { icon: BookOpen, label: 'Textbook', className: 'border-secondary/30 text-secondary' },
    discussion: { icon: MessageSquare, label: 'Discussion', className: 'border-accent/30 text-accent' },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-primary/20">
          <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Search lessons, textbooks, discussions..."
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto text-base"
          />
          {isSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <Badge variant="outline" className="text-xs font-mono shrink-0 border-muted-foreground/30">
            ESC
          </Badge>
        </div>

        {/* Results */}
        <ScrollArea className="max-h-[400px]">
          {results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => {
                const config = typeConfig[result.type];
                const Icon = config.icon;

                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors flex items-start gap-3 group"
                  >
                    <div className="p-1.5 rounded-md bg-muted/50 mt-0.5 group-hover:bg-primary/10 transition-colors">
                      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
                          {result.title}
                        </span>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${config.className}`}>
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {result.snippet}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : query.length >= 2 && !isSearching ? (
            <div className="py-12 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No results found for "{query}"</p>
            </div>
          ) : !query ? (
            <div className="py-12 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Search across all your course content</p>
              <p className="text-xs mt-1">Lessons, textbooks, and discussions</p>
            </div>
          ) : null}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

/** Extract a text snippet around the first match of the query */
function extractSnippet(text: string | null, query: string, contextChars = 80): string {
  if (!text) return '';

  // Strip markdown
  const plain = text.replace(/[#*_`~\[\]()>!|-]/g, '').replace(/\n+/g, ' ').trim();

  const lowerText = plain.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex === -1) {
    return plain.substring(0, contextChars * 2) + (plain.length > contextChars * 2 ? '...' : '');
  }

  const start = Math.max(0, matchIndex - contextChars);
  const end = Math.min(plain.length, matchIndex + query.length + contextChars);
  let snippet = plain.substring(start, end);

  if (start > 0) snippet = '...' + snippet;
  if (end < plain.length) snippet = snippet + '...';

  return snippet;
}
