import { cn } from "@/lib/utils";

interface NeonSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "primary" | "secondary" | "accent";
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-10 w-10",
  xl: "h-12 w-12",
};

const variantClasses = {
  primary: "neon-spinner-primary",
  secondary: "neon-spinner-secondary",
  accent: "neon-spinner-accent",
};

export function NeonSpinner({ 
  size = "md", 
  variant = "primary",
  className 
}: NeonSpinnerProps) {
  return (
    <div 
      className={cn(
        "neon-spinner",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      <div className="neon-spinner-ring" />
      <div className="neon-spinner-ring neon-spinner-ring-2" />
      <div className="neon-spinner-core" />
    </div>
  );
}

// Inline spinner for use in buttons
interface InlineSpinnerProps {
  className?: string;
}

export function InlineSpinner({ className }: InlineSpinnerProps) {
  return (
    <div 
      className={cn(
        "inline-spinner h-4 w-4",
        className
      )}
    />
  );
}
