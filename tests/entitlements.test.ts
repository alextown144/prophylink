import { describe, expect, it } from "vitest";
import { effectiveEntitlementsForPlans, planAllows } from "@/lib/entitlements";

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

  it("uses baseline beta entitlements when no subscription row exists", () => {
    const entitlements = effectiveEntitlementsForPlans({
      accountKind: "office",
      plans: [
        {
          account_kind: "office",
          code: "office_basic",
          enabled: true,
          entitlements: { messaging: true, post_shifts: true },
          id: "office-basic"
        }
      ],
      subscriptions: []
    });

    expect(entitlements.post_shifts).toBe(true);
    expect(entitlements.messaging).toBe(true);
  });

  it("layers active paid plans on top of baseline entitlements", () => {
    const entitlements = effectiveEntitlementsForPlans({
      accountKind: "professional",
      plans: [
        {
          account_kind: "professional",
          code: "professional_free",
          enabled: true,
          entitlements: { express_interest: true, messaging: true },
          id: "professional-free"
        },
        {
          account_kind: "professional",
          code: "professional_plus",
          enabled: true,
          entitlements: { coverage_exchange: true },
          id: "professional-plus"
        }
      ],
      subscriptions: [{ plan_id: "professional-plus", status: "active" }]
    });

    expect(entitlements.express_interest).toBe(true);
    expect(entitlements.coverage_exchange).toBe(true);
  });
});
