import React from 'react';
import { Button } from '@/components/ui/button';
import { Highlighter, StickyNote, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const HIGHLIGHT_COLORS = [
  { name: 'yellow', class: 'bg-yellow-300', hover: 'hover:bg-yellow-400' },
  { name: 'green', class: 'bg-green-300', hover: 'hover:bg-green-400' },
  { name: 'blue', class: 'bg-blue-300', hover: 'hover:bg-blue-400' },
  { name: 'pink', class: 'bg-pink-300', hover: 'hover:bg-pink-400' },
  { name: 'purple', class: 'bg-purple-300', hover: 'hover:bg-purple-400' },
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
      className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg p-2 flex items-center gap-1 animate-in fade-in-0 zoom-in-95"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="flex items-center gap-1 pr-2 border-r border-border">
        <Highlighter className="h-4 w-4 text-muted-foreground mr-1" />
        {HIGHLIGHT_COLORS.map((color) => (
          <button
            key={color.name}
            onClick={() => onHighlight(color.name)}
            className={cn(
              "w-5 h-5 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
              color.class
            )}
            title={`Highlight ${color.name}`}
          />
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onAddNote}
        className="h-7 px-2 text-xs"
      >
        <StickyNote className="h-3 w-3 mr-1" />
        Add Note
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="h-6 w-6"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
