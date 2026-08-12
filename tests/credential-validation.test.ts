import { describe, expect, it } from "vitest";
import {
  credentialReviewSchema,
  credentialUploadSchema
} from "@/lib/validation/account";

describe("credential validation", () => {
  it("accepts credential upload metadata", () => {
    const result = credentialUploadSchema.safeParse({
      credentialNumber: "RDH-123",
      credentialTypeId: "11111111-1111-4111-8111-111111111111",
      expirationDate: "2027-08-12",
      issueDate: "",
      issuingState: "WA"
    });

    expect(result.success).toBe(true);
  });

  it("requires a rejection reason when rejecting credentials", () => {
    const result = credentialReviewSchema.safeParse({
      action: "reject",
      credentialId: "11111111-1111-4111-8111-111111111111",
      rejectionReason: ""
    });

    expect(result.success).toBe(false);
  });

  it("allows credential verification without rejection text", () => {
    const result = credentialReviewSchema.safeParse({
      action: "verify",
      credentialId: "11111111-1111-4111-8111-111111111111",
      rejectionReason: ""
    });

    expect(result.success).toBe(true);
  });
});
