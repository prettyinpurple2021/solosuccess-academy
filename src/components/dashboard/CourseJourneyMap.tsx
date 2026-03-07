/**
 * @file CourseJourneyMap.tsx — Game-Style Course Progression Map
 *
 * PURPOSE: Renders lessons as connected nodes in a winding path,
 * like a board game or RPG overworld map. Completed lessons glow,
 * the current lesson pulses, and locked lessons are dimmed.
 *
 * LAYOUT: Nodes snake left-to-right then right-to-left in rows,
 * connected by SVG path lines. Each node shows the lesson type
 * icon and completion status.
 *
 * VISUAL STATES:
 * - Completed: Bright neon glow + checkmark
 * - Current (next incomplete): Pulsing ring animation
 * - Locked: Dimmed with lock icon
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Lock, 
  FileText, 
  Video, 
  HelpCircle, 
  ClipboardList, 
  Wrench, 
  Zap,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

interface LessonNode {
  id: string;
  title: string;
  type: string;
  order_number: number;
  completed: boolean;
}

interface CourseJourneyMapProps {
  courseId: string;
  courseTitle: string;
  lessons: LessonNode[];
  /** Number of nodes per row before the path snakes back */
  nodesPerRow?: number;
}

// ──────────────────────────────────────────────
// LESSON TYPE → ICON MAP
// ──────────────────────────────────────────────

const typeIcons: Record<string, React.ElementType> = {
  text: FileText,
  video: Video,
  quiz: HelpCircle,
  assignment: ClipboardList,
  worksheet: Wrench,
  activity: Zap,
};

// ──────────────────────────────────────────────
// NODE POSITIONING — snake layout
// ──────────────────────────────────────────────

/** Horizontal spacing between nodes */
const NODE_GAP_X = 90;
/** Vertical spacing between rows */
const ROW_HEIGHT = 100;
/** Left margin for the path */
const MARGIN_X = 50;
/** Top margin */
const MARGIN_Y = 40;
/** Node radius */
const NODE_R = 22;

function getNodePosition(index: number, nodesPerRow: number) {
  const row = Math.floor(index / nodesPerRow);
  const col = index % nodesPerRow;
  // Even rows go left→right, odd rows go right→left (snake)
  const isReversed = row % 2 === 1;
  const x = MARGIN_X + (isReversed ? (nodesPerRow - 1 - col) : col) * NODE_GAP_X;
  const y = MARGIN_Y + row * ROW_HEIGHT;
  return { x, y };
}

// ──────────────────────────────────────────────
// SVG PATH BUILDER — creates the connecting trail
// ──────────────────────────────────────────────

function buildPath(positions: { x: number; y: number }[]): string {
  if (positions.length < 2) return '';
  let d = `M ${positions[0].x} ${positions[0].y}`;
  for (let i = 1; i < positions.length; i++) {
    const prev = positions[i - 1];
    const curr = positions[i];
    // If same row, straight line. If different row, use a smooth curve.
    if (Math.abs(curr.y - prev.y) < 5) {
      d += ` L ${curr.x} ${curr.y}`;
    } else {
      // Curve down to next row
      const midY = (prev.y + curr.y) / 2;
      d += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`;
    }
  }
  return d;
}

// ──────────────────────────────────────────────
// COMPONENT
// ──────────────────────────────────────────────

export function CourseJourneyMap({
  courseId,
  courseTitle,
  lessons,
  nodesPerRow = 5,
}: CourseJourneyMapProps) {
  // Sort lessons by order_number
  const sorted = useMemo(
    () => [...lessons].sort((a, b) => a.order_number - b.order_number),
    [lessons]
  );

  // Find the "current" lesson (first incomplete)
  const currentIndex = sorted.findIndex(l => !l.completed);

  // Compute positions
  const positions = useMemo(
    () => sorted.map((_, i) => getNodePosition(i, nodesPerRow)),
    [sorted, nodesPerRow]
  );

  // SVG dimensions
  const totalRows = Math.ceil(sorted.length / nodesPerRow);
  const svgWidth = MARGIN_X * 2 + (nodesPerRow - 1) * NODE_GAP_X;
  const svgHeight = MARGIN_Y * 2 + (totalRows - 1) * ROW_HEIGHT;

  // Build the trail path
  const trailPath = useMemo(() => buildPath(positions), [positions]);

  // Build the "completed" portion of the trail
  const completedPositions = positions.slice(0, currentIndex === -1 ? positions.length : currentIndex + 1);
  const completedPath = useMemo(() => buildPath(completedPositions), [completedPositions]);

  if (sorted.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full"
        style={{ minWidth: Math.min(svgWidth, 400), maxHeight: 600 }}
      >
        <defs>
          {/* Glow filter for completed trail */}
          <filter id={`glow-${courseId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Pulse animation for current node */}
          <radialGradient id={`pulse-${courseId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6">
              <animate attributeName="stopOpacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0">
              <animate attributeName="stopOpacity" values="0;0.1;0" dur="2s" repeatCount="indefinite" />
            </stop>
          </radialGradient>
        </defs>

        {/* Background trail (full path, dimmed) */}
        <path
          d={trailPath}
          fill="none"
          stroke="hsl(var(--muted-foreground) / 0.15)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="8 6"
        />

        {/* Completed trail (bright, glowing) */}
        {completedPath && (
          <path
            d={completedPath}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeLinecap="round"
            filter={`url(#glow-${courseId})`}
            opacity="0.8"
          />
        )}

        {/* Lesson Nodes */}
        <TooltipProvider delayDuration={200}>
          {sorted.map((lesson, i) => {
            const pos = positions[i];
            const isCurrent = i === currentIndex;
            const isCompleted = lesson.completed;
            const isLocked = !isCompleted && i !== currentIndex && currentIndex !== -1 && i > currentIndex;
            const Icon = typeIcons[lesson.type] || FileText;

            return (
              <Tooltip key={lesson.id}>
                <TooltipTrigger asChild>
                  <g>
                    {/* Link wrapper — only clickable if not locked */}
                    <a
                      href={isLocked ? undefined : `/courses/${courseId}/lessons/${lesson.id}`}
                      style={{ cursor: isLocked ? 'default' : 'pointer' }}
                    >
                      {/* Pulse ring for current lesson */}
                      {isCurrent && (
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={NODE_R + 10}
                          fill={`url(#pulse-${courseId})`}
                        />
                      )}

                      {/* Node circle */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={NODE_R}
                        fill={
                          isCompleted
                            ? 'hsl(var(--primary))'
                            : isCurrent
                              ? 'hsl(var(--primary) / 0.2)'
                              : 'hsl(var(--muted) / 0.5)'
                        }
                        stroke={
                          isCompleted
                            ? 'hsl(var(--primary))'
                            : isCurrent
                              ? 'hsl(var(--primary))'
                              : 'hsl(var(--muted-foreground) / 0.2)'
                        }
                        strokeWidth={isCurrent ? 2 : 1.5}
                        filter={isCompleted ? `url(#glow-${courseId})` : undefined}
                        className="transition-all duration-300"
                      />

                      {/* Icon inside node */}
                      <foreignObject
                        x={pos.x - 10}
                        y={pos.y - 10}
                        width={20}
                        height={20}
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                          ) : isLocked ? (
                            <Lock className="h-3.5 w-3.5 text-muted-foreground/40" />
                          ) : (
                            <Icon className={cn(
                              'h-3.5 w-3.5',
                              isCurrent ? 'text-primary' : 'text-muted-foreground/60'
                            )} />
                          )}
                        </div>
                      </foreignObject>

                      {/* Lesson number label */}
                      <text
                        x={pos.x}
                        y={pos.y + NODE_R + 14}
                        textAnchor="middle"
                        className="fill-muted-foreground text-[9px] font-mono"
                      >
                        {lesson.order_number}
                      </text>
                    </a>
                  </g>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-popover border-primary/30 max-w-[200px]">
                  <p className="font-semibold text-xs">{lesson.title}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{lesson.type} lesson</p>
                  {isCompleted && (
                    <p className="text-[10px] text-primary mt-0.5">✓ Completed</p>
                  )}
                  {isCurrent && (
                    <p className="text-[10px] text-secondary mt-0.5">→ Up next</p>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>

        {/* Star at the finish */}
        {positions.length > 0 && (
          <foreignObject
            x={positions[positions.length - 1].x + NODE_R + 8}
            y={positions[positions.length - 1].y - 8}
            width={16}
            height={16}
          >
            <Star className={cn(
              'h-4 w-4',
              currentIndex === -1 ? 'text-accent fill-accent' : 'text-muted-foreground/30'
            )} />
          </foreignObject>
        )}
      </svg>
    </div>
  );
}
