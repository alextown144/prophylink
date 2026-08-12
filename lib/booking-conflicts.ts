export const blockingBookingStatuses = ["accepted", "confirmed"] as const;

export type BlockingBookingStatus = (typeof blockingBookingStatuses)[number];

export type BookingWindow = {
  id?: string | null;
  agreed_starts_at: string;
  agreed_ends_at: string;
  status?: string | null;
};

export type CandidateWindow = {
  starts_at: string;
  ends_at: string;
};

export function bookingWindowsOverlap(
  firstStartsAt: string,
  firstEndsAt: string,
  secondStartsAt: string,
  secondEndsAt: string
) {
  return new Date(firstStartsAt).getTime() < new Date(secondEndsAt).getTime()
    && new Date(firstEndsAt).getTime() > new Date(secondStartsAt).getTime();
}

export function isBlockingBookingStatus(status?: string | null) {
  return blockingBookingStatuses.some((blockingStatus) => blockingStatus === status);
}

export function hasBlockingBookingConflict(
  bookings: BookingWindow[],
  candidate: CandidateWindow,
  ignoredBookingId?: string
) {
  return bookings.some((booking) => {
    if (ignoredBookingId && booking.id === ignoredBookingId) {
      return false;
    }

    return (
      isBlockingBookingStatus(booking.status)
      && bookingWindowsOverlap(
        booking.agreed_starts_at,
        booking.agreed_ends_at,
        candidate.starts_at,
        candidate.ends_at
      )
    );
  });
}
