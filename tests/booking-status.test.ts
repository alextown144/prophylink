import { describe, expect, it } from "vitest";
import {
  buildBookingTimeline,
  formatBookingStatus,
  getBookingNextAction
} from "@/lib/booking-status";

describe("booking status helpers", () => {
  it("formats booking status labels", () => {
    expect(formatBookingStatus("pending_office_approval")).toBe("Pending Office Approval");
  });

  it("marks accepted bookings as waiting for professional confirmation", () => {
    const timeline = buildBookingTimeline({
      created_at: "2026-08-11T12:00:00.000Z",
      status: "accepted"
    });

    expect(timeline.map((step) => step.state)).toEqual([
      "complete",
      "current",
      "upcoming",
      "upcoming"
    ]);
    expect(getBookingNextAction("accepted", "office")).toContain("Waiting");
    expect(getBookingNextAction("accepted", "professional")).toContain("Confirm");
  });

  it("stops cancelled bookings with the cancellation reason", () => {
    const timeline = buildBookingTimeline({
      cancelled_reason: "Cancelled by office",
      status: "cancelled"
    });

    expect(timeline).toHaveLength(2);
    expect(timeline[1]).toMatchObject({
      description: "Cancelled by office",
      state: "stopped"
    });
  });
});
