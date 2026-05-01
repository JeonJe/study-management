import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  query: queryMock,
}));

import {
  createOperatingUnit,
  ensureOperatingUnitColumn,
  ensureOperatingUnitSchema,
  normalizeOperatingUnitSlug,
} from "@/lib/operating-unit-store";

describe("operating-unit-store", () => {
  beforeEach(() => {
    queryMock.mockReset();
    queryMock.mockResolvedValue([]);
  });

  it("normalizes labels into stable slugs", () => {
    expect(normalizeOperatingUnitSlug(" 4기 루퍼스 ")).toBe("4기-루퍼스");
    expect(normalizeOperatingUnitSlug("Career Framework")).toBe("career-framework");
  });

  it("creates the default operating unit schema and default row", async () => {
    await ensureOperatingUnitSchema();

    const sql = queryMock.mock.calls.map(([text]) => String(text));
    expect(sql.some((text) => text.includes("create table if not exists public.operating_units"))).toBe(true);
    expect(sql.some((text) => text.includes("idx_operating_units_single_default"))).toBe(true);
    expect(sql.some((text) => text.includes("insert into public.operating_units"))).toBe(true);
  });

  it("adds a defaulted operating unit column without requiring callers to pass a unit", async () => {
    await ensureOperatingUnitColumn("meetings", "idx_meetings_operating_unit");

    const sql = queryMock.mock.calls.map(([text]) => String(text));
    expect(sql.some((text) => text.includes("add column if not exists operating_unit_slug text not null default '3기'"))).toBe(true);
    expect(sql.some((text) => text.includes("where operating_unit_slug is null"))).toBe(true);
    expect(sql.some((text) => text.includes("idx_meetings_operating_unit"))).toBe(true);
  });

  it("rejects unsafe SQL identifiers for operating unit columns", async () => {
    await expect(
      ensureOperatingUnitColumn("meetings;drop table meetings", "idx_meetings_operating_unit")
    ).rejects.toThrow("Invalid SQL identifier");
  });

  it("upserts a named operating unit", async () => {
    queryMock.mockResolvedValueOnce([
      {
        slug: "4기",
        name: "4기",
        description: null,
        isDefault: false,
        createdAt: "2026-04-27",
        updatedAt: "2026-04-27",
      },
    ]);

    const created = await createOperatingUnit({
      slug: " 4기 ",
      name: "4기",
    });

    expect(created.slug).toBe("4기");
    const [sql, params] = queryMock.mock.calls.at(-1) as [string, unknown[]];
    expect(sql).toContain("on conflict (slug)");
    expect(params[0]).toBe("4기");
    expect(params[1]).toBe("4기");
  });
});
