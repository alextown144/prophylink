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

const weekdayCodeMap = new Map<string, WeekdayValue>([
  ["Mon", "MO"],
  ["Tue", "TU"],
  ["Wed", "WE"],
  ["Thu", "TH"],
  ["Fri", "FR"],
  ["Sat", "SA"],
  ["Sun", "SU"]
]);

export type AvailabilityWindowRule = {
  kind: "available" | "unavailable";
  starts_at: string | null;
  ends_at: string | null;
  recurrence_rule: string | null;
  recurrence_starts_on: string | null;
  recurrence_ends_on: string | null;
};

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
  return parseWeeklyRecurrenceDayCodes(rule).map((day) => weekdayLabelMap.get(day) ?? day);
}

export function parseWeeklyRecurrenceDayCodes(rule: string | null) {
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
    .filter((day): day is WeekdayValue =>
      weekdayOptions.some((option) => option.value === day)
    );
}

export function availabilityRuleCoversShift(
  rule: AvailabilityWindowRule,
  shiftStartsAt: string,
  shiftEndsAt: string,
  timeZone = "America/Los_Angeles"
) {
  return compareAvailabilityRuleToShift(rule, shiftStartsAt, shiftEndsAt, timeZone, "covers");
}

export function availabilityRuleOverlapsShift(
  rule: AvailabilityWindowRule,
  shiftStartsAt: string,
  shiftEndsAt: string,
  timeZone = "America/Los_Angeles"
) {
  return compareAvailabilityRuleToShift(rule, shiftStartsAt, shiftEndsAt, timeZone, "overlaps");
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

function compareAvailabilityRuleToShift(
  rule: AvailabilityWindowRule,
  shiftStartsAt: string,
  shiftEndsAt: string,
  timeZone: string,
  mode: "covers" | "overlaps"
) {
  if (!rule.starts_at || !rule.ends_at) {
    return false;
  }

  const shiftStart = new Date(shiftStartsAt);
  const shiftEnd = new Date(shiftEndsAt);
  const ruleStart = new Date(rule.starts_at);
  const ruleEnd = new Date(rule.ends_at);
  const recurrenceDays = parseWeeklyRecurrenceDayCodes(rule.recurrence_rule);

  if (recurrenceDays.length === 0) {
    return compareWindow(ruleStart.getTime(), ruleEnd.getTime(), shiftStart.getTime(), shiftEnd.getTime(), mode);
  }

  const shiftDate = getIsoDateInTimeZone(shiftStart, timeZone);

  if (rule.recurrence_starts_on && shiftDate < rule.recurrence_starts_on) {
    return false;
  }

  if (rule.recurrence_ends_on && shiftDate > rule.recurrence_ends_on) {
    return false;
  }

  const shiftWeekday = getWeekdayCodeInTimeZone(shiftStart, timeZone);

  if (!shiftWeekday || !recurrenceDays.includes(shiftWeekday)) {
    return false;
  }

  return compareWindow(
    getMinutesInTimeZone(ruleStart, timeZone),
    getMinutesInTimeZone(ruleEnd, timeZone),
    getMinutesInTimeZone(shiftStart, timeZone),
    getMinutesInTimeZone(shiftEnd, timeZone),
    mode
  );
}

function compareWindow(
  ruleStart: number,
  ruleEnd: number,
  shiftStart: number,
  shiftEnd: number,
  mode: "covers" | "overlaps"
) {
  if (mode === "covers") {
    return ruleStart <= shiftStart && ruleEnd >= shiftEnd;
  }

  return ruleStart < shiftEnd && ruleEnd > shiftStart;
}

function getIsoDateInTimeZone(date: Date, timeZone: string) {
  const parts = getTimeZoneParts(date, timeZone);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function getMinutesInTimeZone(date: Date, timeZone: string) {
  const parts = getTimeZoneParts(date, timeZone);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return (Number(values.hour) % 24) * 60 + Number(values.minute);
}

function getWeekdayCodeInTimeZone(date: Date, timeZone: string) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short"
  }).format(date);

  return weekdayCodeMap.get(weekday) ?? null;
}

function getTimeZoneParts(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric"
  }).formatToParts(date);
}
