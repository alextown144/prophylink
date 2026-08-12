export type BookingStatus =
  | "invited"
  | "interested"
  | "requested"
  | "pending_office_approval"
  | "accepted"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "completed";

export type BookingTimelineInput = {
  status: BookingStatus;
  created_at?: string | null;
  confirmed_at?: string | null;
  completed_at?: string | null;
  cancelled_reason?: string | null;
};

export type BookingTimelineStep = {
  description: string;
  id: string;
  label: string;
  state: "complete" | "current" | "upcoming" | "stopped";
  timestamp?: string | null;
};

export function formatBookingStatus(status: BookingStatus) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getBookingNextAction(
  status: BookingStatus,
  audience: "office" | "professional"
) {
  const copy = {
    office: {
      accepted: "Waiting for the professional to confirm or decline this shift.",
      cancelled: "This shift was cancelled. No action is needed.",
      completed: "This shift is complete.",
      confirmed: "Coverage is confirmed. Message the professional if details change.",
      declined: "The professional declined. Reopen or select another professional.",
      interested: "Review the profile and accept this professional when ready.",
      invited: "Waiting for the professional to respond.",
      pending_office_approval: "Review the request and decide whether to approve it.",
      requested: "Review the request and decide whether to approve it."
    },
    professional: {
      accepted: "Confirm the shift if it still works for your schedule, or decline it.",
      cancelled: "This shift was cancelled. No action is needed.",
      completed: "This shift is complete.",
      confirmed: "You are confirmed. Message the office if details change.",
      declined: "You declined this shift. No action is needed.",
      interested: "Your interest was sent. The office can now review your profile.",
      invited: "Review the office invitation and respond when ready.",
      pending_office_approval: "Your request is waiting for office approval.",
      requested: "Your request is waiting for office approval."
    }
  } satisfies Record<typeof audience, Record<BookingStatus, string>>;

  return copy[audience][status];
}

export function buildBookingTimeline(booking: BookingTimelineInput) {
  if (booking.status === "declined") {
    return [
      bookingStep("connected", "Professional connected", "The professional was connected to this shift.", "complete", booking.created_at),
      bookingStep("declined", "Declined", "The professional declined or was not selected for this shift.", "stopped")
    ];
  }

  if (booking.status === "cancelled") {
    return [
      bookingStep("connected", "Professional connected", "The professional was connected to this shift.", "complete", booking.created_at),
      bookingStep(
        "cancelled",
        "Cancelled",
        booking.cancelled_reason ?? "The shift booking was cancelled.",
        "stopped"
      )
    ];
  }

  const selectedIsComplete = ["accepted", "confirmed", "completed"].includes(booking.status);
  const confirmedIsComplete = ["confirmed", "completed"].includes(booking.status);

  return [
    bookingStep(
      "connected",
      firstStepLabel(booking.status),
      firstStepDescription(booking.status),
      booking.status === "interested" || booking.status === "invited" || booking.status === "requested" || booking.status === "pending_office_approval"
        ? "current"
        : "complete",
      booking.created_at
    ),
    bookingStep(
      "selected",
      "Office selected professional",
      "The office selected this professional for the shift.",
      booking.status === "accepted" ? "current" : selectedIsComplete ? "complete" : "upcoming"
    ),
    bookingStep(
      "confirmed",
      "Professional confirmed",
      "The professional confirmed the shift commitment.",
      booking.status === "confirmed" ? "current" : confirmedIsComplete ? "complete" : "upcoming",
      booking.confirmed_at
    ),
    bookingStep(
      "completed",
      "Shift completed",
      "The office marked the shift completed.",
      booking.status === "completed" ? "current" : "upcoming",
      booking.completed_at
    )
  ];
}

function bookingStep(
  id: string,
  label: string,
  description: string,
  state: BookingTimelineStep["state"],
  timestamp?: string | null
): BookingTimelineStep {
  return {
    description,
    id,
    label,
    state,
    timestamp
  };
}

function firstStepLabel(status: BookingStatus) {
  if (status === "invited") {
    return "Office invitation sent";
  }

  if (status === "requested" || status === "pending_office_approval") {
    return "Professional request sent";
  }

  return "Professional connected";
}

function firstStepDescription(status: BookingStatus) {
  if (status === "accepted" || status === "confirmed" || status === "completed") {
    return "The professional expressed interest or was selected from availability.";
  }

  if (status === "invited") {
    return "The office invited this professional to review the shift.";
  }

  if (status === "requested" || status === "pending_office_approval") {
    return "The professional requested office approval for this shift.";
  }

  return "The professional sent interest for this shift.";
}
