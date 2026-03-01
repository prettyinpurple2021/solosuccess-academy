/**
 * @file utils.ts — Shared Utility Functions
 * 
 * Contains helper functions used across the entire application.
 * Includes class merging, date formatting, text manipulation, and debounce.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with conflict resolution.
 * 
 * @param inputs - Any number of class values (strings, objects, arrays, conditionals)
 * @returns A single merged class string with Tailwind conflicts resolved
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string into a human-readable format.
 * 
 * @param dateStr - ISO date string or Date object
 * @param style - 'short' (Jan 1, 2025), 'long' (January 1, 2025), 'relative' (2 days ago)
 */
export function formatDate(dateStr: string | Date, style: 'short' | 'long' | 'relative' = 'short'): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  
  if (style === 'relative') {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
    // Fall through to short format
  }

  const options: Intl.DateTimeFormatOptions = style === 'long'
    ? { year: 'numeric', month: 'long', day: 'numeric' }
    : { year: 'numeric', month: 'short', day: 'numeric' };

  return date.toLocaleDateString('en-US', options);
}

/**
 * Truncate text to a maximum length with ellipsis.
 * 
 * @param text - The text to truncate
 * @param maxLength - Maximum character length (default 100)
 * @returns Truncated string with "..." appended if shortened
 */
export function truncateText(text: string, maxLength = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

/**
 * Debounce a function — delays execution until after `delay` ms of inactivity.
 * 
 * @param fn - The function to debounce
 * @param delay - Milliseconds to wait (default 300)
 * @returns Debounced function with cancel() method
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay = 300) {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
  
  debounced.cancel = () => clearTimeout(timeoutId);
  return debounced;
}

/**
 * Count words in a string (used in textbook editor word count).
 */
export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Generate a LinkedIn "Add to Profile" URL for a certificate.
 */
export function getLinkedInCertUrl({
  name,
  organizationName,
  issueDate,
  certUrl,
}: {
  name: string;
  organizationName: string;
  issueDate: string;
  certUrl: string;
}): string {
  const date = new Date(issueDate);
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name,
    organizationName,
    issueYear: date.getFullYear().toString(),
    issueMonth: (date.getMonth() + 1).toString(),
    certUrl,
  });
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}
