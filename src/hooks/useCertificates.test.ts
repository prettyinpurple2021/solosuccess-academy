import { describe, it, expect } from "vitest";
import { generateVerificationCode } from "./useCertificates";

describe("generateVerificationCode", () => {
  it("returns string in format SSA-XXXX-XXXX", () => {
    const code = generateVerificationCode();
    expect(code).toMatch(/^SSA-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });

  it("excludes ambiguous characters (0, O, 1, I, L)", () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    for (let i = 0; i < 20; i++) {
      const code = generateVerificationCode();
      const parts = code.replace("SSA-", "").split("-").join("");
      for (const char of parts) {
        expect(chars).toContain(char);
      }
    }
  });

  it("produces different codes on multiple calls", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 50; i++) {
      codes.add(generateVerificationCode());
    }
    expect(codes.size).toBeGreaterThan(1);
  });
});
