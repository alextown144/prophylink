import { describe, expect, it } from "vitest";
import { hashInviteCode } from "@/lib/auth/invite";

describe("hashInviteCode", () => {
  it("normalizes whitespace before hashing invitation codes", () => {
    expect(hashInviteCode(" PROPHY-BETA-ABC ")).toBe(
      hashInviteCode("PROPHY-BETA-ABC")
    );
  });

  it("does not store invitation codes as plaintext-equivalent values", () => {
    const code = "PROPHY-BETA-ABC";

    expect(hashInviteCode(code)).not.toBe(code);
    expect(hashInviteCode(code)).toHaveLength(64);
  });
});
