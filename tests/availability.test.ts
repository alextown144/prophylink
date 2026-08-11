import { describe, expect, it } from "vitest";
import {
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
});
