import { describe, it, expect } from "vitest";
import {
  formatPrice,
  getPhaseClasses,
  calculateProgress,
  phaseMetadata,
  type CoursePhase,
} from "./courseData";

describe("courseData utils", () => {
  describe("formatPrice", () => {
    it("formats cents as USD currency", () => {
      expect(formatPrice(0)).toBe("$0.00");
      expect(formatPrice(100)).toBe("$1.00");
      expect(formatPrice(499)).toBe("$4.99");
      expect(formatPrice(4900)).toBe("$49.00");
      expect(formatPrice(9999)).toBe("$99.99");
    });
  });

  describe("getPhaseClasses", () => {
    it("returns correct classes for each phase", () => {
      expect(getPhaseClasses("initialization")).toContain("primary");
      expect(getPhaseClasses("orchestration")).toContain("secondary");
      expect(getPhaseClasses("launch")).toContain("accent");
    });

    it("returns muted classes for unknown phase", () => {
      const result = getPhaseClasses("unknown" as CoursePhase);
      expect(result).toContain("muted");
    });
  });

  describe("calculateProgress", () => {
    it("returns 0 when total is 0", () => {
      expect(calculateProgress(0, 0)).toBe(0);
      expect(calculateProgress(5, 0)).toBe(0);
    });

    it("returns rounded percentage", () => {
      expect(calculateProgress(0, 10)).toBe(0);
      expect(calculateProgress(5, 10)).toBe(50);
      expect(calculateProgress(10, 10)).toBe(100);
      expect(calculateProgress(1, 3)).toBe(33);
      expect(calculateProgress(2, 3)).toBe(67);
    });
  });

  describe("phaseMetadata", () => {
    it("has metadata for all three phases", () => {
      expect(phaseMetadata.initialization.label).toBe("Phase 1: Initialization");
      expect(phaseMetadata.orchestration.label).toBe("Phase 2: Orchestration");
      expect(phaseMetadata.launch.label).toBe("Phase 3: Launch Sequence");
    });

    it("each phase has label, description, icon, colorClass", () => {
      (["initialization", "orchestration", "launch"] as CoursePhase[]).forEach(
        (phase) => {
          const meta = phaseMetadata[phase];
          expect(meta).toHaveProperty("label");
          expect(meta).toHaveProperty("description");
          expect(meta).toHaveProperty("icon");
          expect(meta).toHaveProperty("colorClass");
        }
      );
    });
  });
});
