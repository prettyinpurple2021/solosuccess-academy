// Course phase type
export type CoursePhase = 'initialization' | 'orchestration' | 'launch';

// Course interface matching database schema
export interface Course {
  id: string;
  order_number: number;
  title: string;
  description: string | null;
  phase: CoursePhase;
  plug_and_play_asset: string | null;
  discussion_question: string | null;
  project_title: string | null;
  project_description: string | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  price_cents: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// Lesson type enum
export type LessonType = 'text' | 'video' | 'quiz' | 'assignment';

// Lesson interface
export interface Lesson {
  id: string;
  course_id: string;
  order_number: number;
  title: string;
  type: LessonType;
  content: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
}

// Phase metadata for UI
export const phaseMetadata: Record<CoursePhase, { 
  label: string; 
  description: string; 
  icon: string;
  colorClass: string;
}> = {
  initialization: {
    label: 'Phase 1: Initialization',
    description: 'Identity and Intel',
    icon: '🚀',
    colorClass: 'phase-initialization',
  },
  orchestration: {
    label: 'Phase 2: Orchestration',
    description: 'Building the Machine',
    icon: '⚙️',
    colorClass: 'phase-orchestration',
  },
  launch: {
    label: 'Phase 3: Launch Sequence',
    description: 'Sales and Future',
    icon: '🎯',
    colorClass: 'phase-launch',
  },
};

// Format price from cents
export const formatPrice = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
};

// Get phase badge color classes
export const getPhaseClasses = (phase: CoursePhase): string => {
  switch (phase) {
    case 'initialization':
      return 'bg-primary/10 text-primary border-primary/30';
    case 'orchestration':
      return 'bg-secondary/10 text-secondary border-secondary/30';
    case 'launch':
      return 'bg-accent/10 text-accent border-accent/30';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

// Calculate overall progress percentage
export const calculateProgress = (
  completedLessons: number,
  totalLessons: number
): number => {
  if (totalLessons === 0) return 0;
  return Math.round((completedLessons / totalLessons) * 100);
};
