import { CheckCircle2, Circle, XCircle } from "lucide-react";
import {
  buildBookingTimeline,
  getBookingNextAction,
  type BookingTimelineInput
} from "@/lib/booking-status";
import { cn } from "@/lib/utils";

export function BookingStatusTimeline({
  audience,
  booking,
  className
}: {
  audience: "office" | "professional";
  booking: BookingTimelineInput;
  className?: string;
}) {
  const steps = buildBookingTimeline(booking);

  return (
    <div className={cn("rounded-lg bg-slate-50 p-4", className)}>
      <p className="text-sm font-semibold text-slate-950">Status timeline</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        {getBookingNextAction(booking.status, audience)}
      </p>
      <ol className="mt-4 grid gap-3">
        {steps.map((step) => (
          <li className="flex gap-3" key={step.id}>
            <span
              className={cn(
                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-white",
                step.state === "complete" && "border-teal-700 bg-teal-700 text-white",
                step.state === "current" && "border-purple-600 text-purple-700",
                step.state === "upcoming" && "border-slate-300 text-slate-400",
                step.state === "stopped" && "border-slate-400 bg-white text-slate-500"
              )}
            >
              {step.state === "complete" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : step.state === "stopped" ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <Circle className="h-3 w-3 fill-current" />
              )}
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-950">
                {step.label}
              </span>
              <span className="block text-sm leading-6 text-slate-600">
                {step.description}
              </span>
              {step.timestamp ? (
                <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                  {formatTimelineTimestamp(step.timestamp)}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function formatTimelineTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Los_Angeles"
  }).format(new Date(value));
}
