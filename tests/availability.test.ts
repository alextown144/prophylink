import { describe, expect, it } from "vitest";
import {
  availabilityRuleCoversShift,
  availabilityRuleOverlapsShift,
  buildWeeklyRecurrenceRule,
  parseWeeklyRecurrenceDays
} from "@/lib/availability";

describe("availability recurrence helpers", () => {
  it("builds weekly recurrence rules from selected weekdays", () => {
    expect(buildWeeklyRecurrenceRule(["MO", "WE"])).toBe("FREQ=WEEKLY;BYDAY=MO,WE");
  });

  it("ignores invalid weekday values", () => {
    expect(buildWeeklyRecurrenceRule(["MO", "NOPE", "FR"])).toBe(
      "FREQ=WEEKLY;BYDAY=MO,FR"
    );
  });

  it("parses weekly recurrence days for display", () => {
    expect(parseWeeklyRecurrenceDays("FREQ=WEEKLY;BYDAY=TU,TH")).toEqual([
      "Tuesday",
      "Thursday"
    ]);
  });

  it("matches a single-date availability rule that covers the full shift", () => {
    expect(
      availabilityRuleCoversShift(
        {
          ends_at: "2026-09-14T17:00:00.000Z",
          kind: "available",
          recurrence_ends_on: null,
          recurrence_rule: null,
          recurrence_starts_on: null,
          starts_at: "2026-09-14T08:00:00.000Z"
        },
        "2026-09-14T09:00:00.000Z",
        "2026-09-14T16:00:00.000Z",
        "UTC"
      )
    ).toBe(true);
  });

  it("matches a weekly availability rule on the selected weekday", () => {
    expect(
      availabilityRuleCoversShift(
        {
          ends_at: "2026-09-07T17:00:00.000Z",
          kind: "available",
          recurrence_ends_on: "2026-09-30",
          recurrence_rule: "FREQ=WEEKLY;BYDAY=MO,WE",
          recurrence_starts_on: "2026-09-01",
          starts_at: "2026-09-07T08:00:00.000Z"
        },
        "2026-09-14T09:00:00.000Z",
        "2026-09-14T16:00:00.000Z",
        "UTC"
      )
    ).toBe(true);
  });

  it("excludes an unavailable window that overlaps the shift", () => {
    expect(
      availabilityRuleOverlapsShift(
        {
          ends_at: "2026-09-14T13:00:00.000Z",
          kind: "unavailable",
          recurrence_ends_on: null,
          recurrence_rule: null,
          recurrence_starts_on: null,
          starts_at: "2026-09-14T12:00:00.000Z"
        },
        "2026-09-14T09:00:00.000Z",
        "2026-09-14T16:00:00.000Z",
        "UTC"
      )
    ).toBe(true);
  });
});
