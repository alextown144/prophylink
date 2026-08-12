import { describe, expect, it } from "vitest";
import {
  bookingWindowsOverlap,
  hasBlockingBookingConflict
} from "@/lib/booking-conflicts";

describe("booking conflict helpers", () => {
  it("detects overlapping time windows", () => {
    expect(
      bookingWindowsOverlap(
        "2026-09-14T08:00:00.000Z",
        "2026-09-14T12:00:00.000Z",
        "2026-09-14T11:00:00.000Z",
        "2026-09-14T15:00:00.000Z"
      )
    ).toBe(true);
  });

  it("allows back-to-back time windows", () => {
    expect(
      bookingWindowsOverlap(
        "2026-09-14T08:00:00.000Z",
        "2026-09-14T12:00:00.000Z",
        "2026-09-14T12:00:00.000Z",
        "2026-09-14T17:00:00.000Z"
      )
    ).toBe(false);
  });

  it("ignores non-blocking booking statuses", () => {
    expect(
      hasBlockingBookingConflict(
        [
          {
            agreed_ends_at: "2026-09-14T17:00:00.000Z",
            agreed_starts_at: "2026-09-14T08:00:00.000Z",
            id: "one",
            status: "interested"
          }
        ],
        {
          ends_at: "2026-09-14T13:00:00.000Z",
          starts_at: "2026-09-14T09:00:00.000Z"
        }
      )
    ).toBe(false);
  });

  it("detects accepted or confirmed booking conflicts", () => {
    expect(
      hasBlockingBookingConflict(
        [
          {
            agreed_ends_at: "2026-09-14T17:00:00.000Z",
            agreed_starts_at: "2026-09-14T08:00:00.000Z",
            id: "one",
            status: "confirmed"
          }
        ],
        {
          ends_at: "2026-09-14T13:00:00.000Z",
          starts_at: "2026-09-14T09:00:00.000Z"
        }
      )
    ).toBe(true);
  });
});
