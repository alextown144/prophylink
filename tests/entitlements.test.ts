import { describe, expect, it } from "vitest";
import { planAllows } from "@/lib/entitlements";

describe("planAllows", () => {
  it("allows baseline professional marketplace capabilities", () => {
    expect(planAllows("professional_free", "availability")).toBe(true);
    expect(planAllows("professional_free", "coverage_exchange")).toBe(false);
  });

  it("keeps office and professional paid capabilities separate", () => {
    expect(planAllows("professional_plus", "coverage_circle")).toBe(true);
    expect(planAllows("office_basic", "post_shifts")).toBe(true);
    expect(planAllows("office_basic", "coverage_circle")).toBe(false);
  });
});
