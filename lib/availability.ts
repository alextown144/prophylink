export const weekdayOptions = [
  { value: "MO", label: "Monday" },
  { value: "TU", label: "Tuesday" },
  { value: "WE", label: "Wednesday" },
  { value: "TH", label: "Thursday" },
  { value: "FR", label: "Friday" },
  { value: "SA", label: "Saturday" },
  { value: "SU", label: "Sunday" }
] as const;

export type WeekdayValue = (typeof weekdayOptions)[number]["value"];

const weekdayLabelMap = new Map<string, string>(
  weekdayOptions.map((option) => [option.value, option.label])
);

export function buildWeeklyRecurrenceRule(days: string[]) {
  const validDays = days.filter((day): day is WeekdayValue =>
    weekdayOptions.some((option) => option.value === day)
  );

  if (validDays.length === 0) {
    return null;
  }

  return `FREQ=WEEKLY;BYDAY=${validDays.join(",")}`;
}

export function parseWeeklyRecurrenceDays(rule: string | null) {
  if (!rule) {
    return [];
  }

  const byDay = rule
    .split(";")
    .find((part) => part.startsWith("BYDAY="))
    ?.replace("BYDAY=", "");

  if (!byDay) {
    return [];
  }

  return byDay
    .split(",")
    .map((day) => weekdayLabelMap.get(day) ?? day)
    .filter(Boolean);
}

export function formatTimeRange(start: string | null, end: string | null) {
  if (!start || !end) {
    return "Time not set";
  }

  const formatter = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles"
  });

  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
}

export function formatAvailabilityDate(value: string | null) {
  if (!value) {
    return "Date not set";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Los_Angeles"
  }).format(new Date(value));
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}
