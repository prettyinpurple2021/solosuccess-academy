/**
 * @file courseThumbnails.ts — Maps course order numbers to their thumbnail images.
 * 
 * Each course has a unique AI-generated cyberpunk-themed thumbnail
 * that matches the course's theme and aesthetic.
 */

import course01 from '@/assets/thumbnails/course-01-solo-singularity.jpg';
import course02 from '@/assets/thumbnails/course-02-signal-noise.jpg';
import course03 from '@/assets/thumbnails/course-03-neon-identity.jpg';
import course04 from '@/assets/thumbnails/course-04-ghost-machine.jpg';
import course05 from '@/assets/thumbnails/course-05-infinite-loop.jpg';
import course06 from '@/assets/thumbnails/course-06-digital-gravity.jpg';
import course07 from '@/assets/thumbnails/course-07-zero-point-energy.jpg';
import course08 from '@/assets/thumbnails/course-08-neuro-link.jpg';
import course09 from '@/assets/thumbnails/course-09-future-state.jpg';
import course10 from '@/assets/thumbnails/course-10-final-transmission.jpg';

/** Map of course order_number → thumbnail image URL */
export const courseThumbnails: Record<number, string> = {
  1: course01,
  2: course02,
  3: course03,
  4: course04,
  5: course05,
  6: course06,
  7: course07,
  8: course08,
  9: course09,
  10: course10,
};

/**
 * Get the thumbnail image for a course by its order number.
 * Returns undefined if no thumbnail exists for the given order.
 */
export const getCourseThumbnail = (orderNumber: number): string | undefined => {
  return courseThumbnails[orderNumber];
};
