/**
 * @file utils.ts — Shared Utility Functions
 * 
 * Contains helper functions used across the entire application.
 * Currently houses the `cn()` function for merging Tailwind CSS classes.
 * 
 * HOW cn() WORKS (for new developers):
 * When you write `cn("p-4", isActive && "bg-primary", className)`:
 * 1. `clsx` handles conditional classes — falsy values are ignored
 * 2. `twMerge` resolves Tailwind conflicts — e.g., "p-4 p-2" becomes "p-2"
 * 
 * This is the standard pattern used by shadcn/ui components.
 * 
 * PRODUCTION TODO:
 * - Add other shared utilities here (e.g., formatDate, truncateText, debounce)
 * - Keep this file small; split into separate files if it grows beyond ~100 lines
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with conflict resolution.
 * 
 * @param inputs - Any number of class values (strings, objects, arrays, conditionals)
 * @returns A single merged class string with Tailwind conflicts resolved
 * 
 * @example
 * cn("p-4 text-red-500", isLarge && "p-8", className)
 * // If isLarge is true: "p-8 text-red-500 {className}"
 * // Note: p-8 wins over p-4 thanks to twMerge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
