/**
 * VocabularyGlossary.tsx
 * 
 * Displays a panel of vocabulary terms extracted from textbook content.
 * Terms appear as hoverable chips with pop-up definitions.
 * Admin can define terms via the glossary_terms field in textbook pages.
 */
import { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { BookA, Search } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

/**
 * A single vocabulary entry with a term and its definition.
 */
export interface GlossaryTerm {
  term: string;
  definition: string;
  /** Optional: which chapter this term appears in */
  chapter?: string;
}

interface VocabularyGlossaryProps {
  /** All glossary terms for the current textbook */
  terms: GlossaryTerm[];
  className?: string;
}

/**
 * VocabularyGlossary
 * ---
 * A side-panel that lists all key terms in the textbook.
 * Each term shows its definition on hover/click.
 * Includes a search filter to find specific terms quickly.
 */
export function VocabularyGlossary({ terms, className }: VocabularyGlossaryProps) {
  const [filter, setFilter] = useState('');

  // Filter and sort terms alphabetically
  const filteredTerms = useMemo(() => {
    const sorted = [...terms].sort((a, b) => a.term.localeCompare(b.term));
    if (!filter.trim()) return sorted;
    const q = filter.toLowerCase();
    return sorted.filter(
      (t) => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q)
    );
  }, [terms, filter]);

  // Group terms by first letter for easier scanning
  const groupedTerms = useMemo(() => {
    const groups: Record<string, GlossaryTerm[]> = {};
    for (const term of filteredTerms) {
      const letter = term.term[0]?.toUpperCase() || '#';
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(term);
    }
    return groups;
  }, [filteredTerms]);

  if (terms.length === 0) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        {/* Glossary button in the toolbar */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'border-primary/30 hover:bg-primary/20 hover:border-primary',
            className
          )}
          title="Vocabulary Glossary"
        >
          <BookA className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="bg-black/95 backdrop-blur-xl border-l border-primary/30"
      >
        <SheetHeader>
          <SheetTitle className="font-display text-cyan-300 flex items-center gap-2">
            <BookA className="h-5 w-5" />
            Vocabulary ({terms.length} terms)
          </SheetTitle>
        </SheetHeader>

        {/* Search filter */}
        <div className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search terms..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9 bg-black/30 border-primary/30 focus:border-primary"
            />
          </div>
        </div>

        {/* Term list */}
        <ScrollArea className="h-[calc(100vh-200px)] mt-4">
          {Object.keys(groupedTerms).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No terms match your search.
            </p>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTerms).map(([letter, letterTerms]) => (
                <div key={letter}>
                  {/* Letter header */}
                  <div className="sticky top-0 bg-black/80 backdrop-blur-sm py-1 px-2 mb-2 border-b border-primary/20">
                    <span className="text-lg font-display font-bold text-primary">
                      {letter}
                    </span>
                  </div>

                  {/* Terms under this letter */}
                  <div className="space-y-2 px-1">
                    {letterTerms.map((item, idx) => (
                      <TooltipProvider key={`${item.term}-${idx}`}>
                        <Tooltip delayDuration={200}>
                          <TooltipTrigger asChild>
                            <motion.div
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              className="p-3 rounded-lg border border-transparent hover:border-primary/30 hover:bg-primary/10 transition-all cursor-help"
                            >
                              <p className="font-semibold text-foreground">
                                {item.term}
                              </p>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                                {item.definition}
                              </p>
                              {item.chapter && (
                                <span className="text-xs text-cyan-400/60 mt-1 inline-block">
                                  {item.chapter}
                                </span>
                              )}
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="left"
                            className="max-w-xs bg-black/95 border-primary/40"
                          >
                            <p className="font-bold text-primary mb-1">
                              {item.term}
                            </p>
                            <p className="text-sm text-foreground/90">
                              {item.definition}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
