import React from 'react';
import { Button } from '@/components/ui/button';
import { Highlighter, StickyNote, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const HIGHLIGHT_COLORS = [
  { name: 'yellow', class: 'bg-yellow-400', hover: 'hover:bg-yellow-500', shadow: 'shadow-[0_0_10px_rgba(250,204,21,0.5)]' },
  { name: 'green', class: 'bg-green-400', hover: 'hover:bg-green-500', shadow: 'shadow-[0_0_10px_rgba(74,222,128,0.5)]' },
  { name: 'blue', class: 'bg-blue-400', hover: 'hover:bg-blue-500', shadow: 'shadow-[0_0_10px_rgba(96,165,250,0.5)]' },
  { name: 'pink', class: 'bg-pink-400', hover: 'hover:bg-pink-500', shadow: 'shadow-[0_0_10px_rgba(244,114,182,0.5)]' },
  { name: 'purple', class: 'bg-purple-400', hover: 'hover:bg-purple-500', shadow: 'shadow-[0_0_10px_rgba(192,132,252,0.5)]' },
];

interface HighlightToolbarProps {
  position: { x: number; y: number };
  onHighlight: (color: string) => void;
  onAddNote: () => void;
  onClose: () => void;
}

export function HighlightToolbar({ position, onHighlight, onAddNote, onClose }: HighlightToolbarProps) {
  return (
    <div
      className="fixed z-50 bg-black/90 backdrop-blur-xl border border-primary/30 rounded-lg shadow-[0_0_30px_rgba(168,85,247,0.3)] p-2 flex items-center gap-1 animate-in fade-in-0 zoom-in-95"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="flex items-center gap-1 pr-2 border-r border-primary/30">
        <Highlighter className="h-4 w-4 text-cyan-400 mr-1" />
        {HIGHLIGHT_COLORS.map((color) => (
          <button
            key={color.name}
            onClick={() => onHighlight(color.name)}
            className={cn(
              "w-5 h-5 rounded-full transition-all hover:scale-125 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-black",
              color.class,
              color.hover,
              color.shadow
            )}
            title={`Highlight ${color.name}`}
          />
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onAddNote}
        className="h-7 px-2 text-xs hover:bg-primary/20 text-cyan-300"
      >
        <StickyNote className="h-3 w-3 mr-1" />
        Add Note
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="h-6 w-6 hover:bg-destructive/20"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}