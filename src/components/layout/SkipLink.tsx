/**
 * Skip link for accessibility: first tab target, jumps to main content.
 * Visually hidden until focused so keyboard/screen-reader users can skip nav.
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="fixed left-4 top-4 z-[100] -translate-y-[200%] rounded-md border border-primary/50 bg-background px-4 py-3 font-medium text-foreground shadow-lg outline-none transition-transform focus:translate-y-0 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
    >
      Skip to main content
    </a>
  );
}
