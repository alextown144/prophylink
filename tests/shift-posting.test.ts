import { describe, expect, it } from "vitest";
import { shiftPostingSchema } from "@/lib/validation/account";

const baseShift = {
  officeLocationId: "11111111-1111-4111-8111-111111111111",
  professionalRoleId: "22222222-2222-4222-8222-222222222222",
  status: "open",
  date: "2026-09-14",
  startTime: "08:00",
  endTime: "17:00",
  hourlyRate: "72",
  unpaidLunchMinutes: "30",
  description: "Busy hygiene coverage day."
};

describe("shiftPostingSchema", () => {
  it("accepts a valid office shift posting", () => {
    const result = shiftPostingSchema.safeParse(baseShift);

    expect(result.success).toBe(true);
  });

  it("rejects shifts where the end time is not after the start time", () => {
    const result = shiftPostingSchema.safeParse({
      ...baseShift,
      endTime: "07:30"
    });

    expect(result.success).toBe(false);
  });

  it("requires unpaid lunch minutes to be whole minutes", () => {
    const result = shiftPostingSchema.safeParse({
      ...baseShift,
      unpaidLunchMinutes: "30.5"
    });

    expect(result.success).toBe(false);
  });
});
