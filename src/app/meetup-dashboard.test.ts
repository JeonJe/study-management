import { describe, expect, it } from "vitest";
import { findEntryOperatingUnit, type EntryOperatingUnit } from "@/app/meetup-dashboard";

describe("meetup dashboard entry unit selection", () => {
  const units: EntryOperatingUnit[] = [
    { slug: "loop-pak-3", name: "3기", description: null },
    { slug: "loop-pak-4", name: "4기", description: "신규 기수" },
  ];

  it("finds an active entry unit by slug", () => {
    expect(findEntryOperatingUnit(units, "loop-pak-4")).toEqual(units[1]);
  });

  it("does not fall back to the first unit when the requested slug is unknown", () => {
    expect(findEntryOperatingUnit(units, "e2e-critical-inactive")).toBeNull();
  });
});
