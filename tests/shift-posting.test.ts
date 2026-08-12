import { describe, expect, it } from "vitest";
import {
  availableProfessionalSelectionSchema,
  bookingConversationSchema,
  bookingResponseSchema,
  bookingSelectionSchema,
  messageSendSchema,
  notificationReadStateSchema,
  officeBookingLifecycleSchema,
  shiftInterestSchema,
  shiftPostingSchema,
  shiftUpdateSchema
} from "@/lib/validation/account";

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

describe("shiftInterestSchema", () => {
  it("accepts a shift id for professional interest", () => {
    const result = shiftInterestSchema.safeParse({
      shiftId: "33333333-3333-4333-8333-333333333333"
    });

    expect(result.success).toBe(true);
  });

  it("rejects malformed shift ids", () => {
    const result = shiftInterestSchema.safeParse({
      shiftId: "not-a-shift-id"
    });

    expect(result.success).toBe(false);
  });
});

describe("shiftUpdateSchema", () => {
  it("requires an editable shift id", () => {
    const result = shiftUpdateSchema.safeParse({
      ...baseShift,
      shiftId: "44444444-4444-4444-8444-444444444444"
    });

    expect(result.success).toBe(true);
  });
});

describe("bookingSelectionSchema", () => {
  it("accepts the booking and shift ids needed for office selection", () => {
    const result = bookingSelectionSchema.safeParse({
      bookingId: "55555555-5555-4555-8555-555555555555",
      shiftId: "66666666-6666-4666-8666-666666666666"
    });

    expect(result.success).toBe(true);
  });
});

describe("availableProfessionalSelectionSchema", () => {
  it("accepts a professional profile id for office direct selection", () => {
    const result = availableProfessionalSelectionSchema.safeParse({
      professionalProfileId: "55555555-5555-4555-8555-555555555555",
      shiftId: "66666666-6666-4666-8666-666666666666"
    });

    expect(result.success).toBe(true);
  });

  it("rejects malformed professional profile ids", () => {
    const result = availableProfessionalSelectionSchema.safeParse({
      professionalProfileId: "not-a-profile",
      shiftId: "66666666-6666-4666-8666-666666666666"
    });

    expect(result.success).toBe(false);
  });
});

describe("bookingResponseSchema", () => {
  it("accepts a professional confirmation response", () => {
    const result = bookingResponseSchema.safeParse({
      action: "confirm",
      bookingId: "77777777-7777-4777-8777-777777777777",
      shiftId: "88888888-8888-4888-8888-888888888888"
    });

    expect(result.success).toBe(true);
  });

  it("rejects unsupported booking responses", () => {
    const result = bookingResponseSchema.safeParse({
      action: "maybe",
      bookingId: "77777777-7777-4777-8777-777777777777",
      shiftId: "88888888-8888-4888-8888-888888888888"
    });

    expect(result.success).toBe(false);
  });
});

describe("officeBookingLifecycleSchema", () => {
  it("accepts an office completion action", () => {
    const result = officeBookingLifecycleSchema.safeParse({
      action: "complete",
      bookingId: "99999999-9999-4999-8999-999999999999",
      shiftId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
    });

    expect(result.success).toBe(true);
  });

  it("rejects unsupported office lifecycle actions", () => {
    const result = officeBookingLifecycleSchema.safeParse({
      action: "reopen",
      bookingId: "99999999-9999-4999-8999-999999999999",
      shiftId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
    });

    expect(result.success).toBe(false);
  });
});

describe("notificationReadStateSchema", () => {
  it("accepts a read state update", () => {
    const result = notificationReadStateSchema.safeParse({
      action: "read",
      notificationId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
    });

    expect(result.success).toBe(true);
  });

  it("rejects unsupported notification actions", () => {
    const result = notificationReadStateSchema.safeParse({
      action: "archive",
      notificationId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
    });

    expect(result.success).toBe(false);
  });
});

describe("bookingConversationSchema", () => {
  it("accepts a booking id for starting a conversation", () => {
    const result = bookingConversationSchema.safeParse({
      bookingId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc"
    });

    expect(result.success).toBe(true);
  });
});

describe("messageSendSchema", () => {
  it("accepts a message body and conversation id", () => {
    const result = messageSendSchema.safeParse({
      body: "Can you confirm arrival details?",
      conversationId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd"
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty message bodies", () => {
    const result = messageSendSchema.safeParse({
      body: "   ",
      conversationId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd"
    });

    expect(result.success).toBe(false);
  });
});
