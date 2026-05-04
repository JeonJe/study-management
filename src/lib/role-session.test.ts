import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  cookieGetMock,
  cookieSetMock,
  createOperatingUnitRoleAccessTokenMock,
  normalizeOperatingUnitSlugMock,
  verifyOperatingUnitRoleAccessTokenMock,
  verifyOperatingUnitRoleCodeMock,
} = vi.hoisted(() => ({
  cookieGetMock: vi.fn(),
  cookieSetMock: vi.fn(),
  createOperatingUnitRoleAccessTokenMock: vi.fn(),
  normalizeOperatingUnitSlugMock: vi.fn((slug: string) => slug.trim()),
  verifyOperatingUnitRoleAccessTokenMock: vi.fn(),
  verifyOperatingUnitRoleCodeMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: cookieGetMock,
    set: cookieSetMock,
  })),
}));

vi.mock("@/lib/operating-unit-store", () => ({
  createOperatingUnitRoleAccessToken: createOperatingUnitRoleAccessTokenMock,
  normalizeOperatingUnitSlug: normalizeOperatingUnitSlugMock,
  verifyOperatingUnitRoleAccessToken: verifyOperatingUnitRoleAccessTokenMock,
  verifyOperatingUnitRoleCode: verifyOperatingUnitRoleCodeMock,
}));

import {
  createRoleScopedToken,
  getCurrentRolePageRole,
  grantRolePageAccess,
  verifyRolePagePassword,
} from "@/lib/role-session";

describe("role-session", () => {
  beforeEach(() => {
    cookieGetMock.mockReset();
    cookieSetMock.mockReset();
    createOperatingUnitRoleAccessTokenMock.mockReset();
    normalizeOperatingUnitSlugMock.mockClear();
    verifyOperatingUnitRoleAccessTokenMock.mockReset();
    verifyOperatingUnitRoleCodeMock.mockReset();
  });

  it("stores a unit-scoped role token returned by the operating unit store", async () => {
    verifyOperatingUnitRoleCodeMock.mockResolvedValue(true);
    createOperatingUnitRoleAccessTokenMock.mockResolvedValue("role-token");

    await expect(
      grantRolePageAccess("admin", "unit-admin", "loop-pak-4")
    ).resolves.toBe(true);

    expect(createOperatingUnitRoleAccessTokenMock).toHaveBeenCalledWith(
      "loop-pak-4",
      "admin",
      "unit-admin"
    );
    expect(cookieSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "meetup_role_access",
        value: "admin.loop-pak-4.role-token",
        httpOnly: true,
        path: "/",
      })
    );
  });

  it("rejects a unit role cookie when the unit slug does not match", async () => {
    cookieGetMock.mockReturnValue({ value: "admin.loop-pak-4.role-token" });

    await expect(getCurrentRolePageRole("loop-pak-5")).resolves.toBeNull();

    expect(verifyOperatingUnitRoleAccessTokenMock).not.toHaveBeenCalled();
  });

  it("rejects malformed encoded unit role cookies without throwing", async () => {
    cookieGetMock.mockReturnValue({ value: "admin.%E0%A4%A.role-token" });

    await expect(getCurrentRolePageRole("loop-pak-4")).resolves.toBeNull();

    expect(verifyOperatingUnitRoleAccessTokenMock).not.toHaveBeenCalled();
  });

  it("accepts a unit role cookie only through the stored role token verifier", async () => {
    cookieGetMock.mockReturnValue({ value: "angel.loop-pak-4.role-token" });
    verifyOperatingUnitRoleAccessTokenMock.mockResolvedValue(true);

    await expect(getCurrentRolePageRole("loop-pak-4")).resolves.toBe("angel");

    expect(verifyOperatingUnitRoleAccessTokenMock).toHaveBeenCalledWith(
      "loop-pak-4",
      "angel",
      "role-token"
    );
  });

  it("does not create sync scoped tokens for unit roles", () => {
    expect(createRoleScopedToken("admin", "edit", "payload", "loop-pak-4")).toBeNull();
  });

  it("does not accept legacy global role cookies without a unit slug", async () => {
    cookieGetMock.mockReturnValue({ value: "admin.legacy-token" });

    await expect(getCurrentRolePageRole()).resolves.toBeNull();
  });

  it("verifies a unit role password through the operating unit role code verifier", async () => {
    verifyOperatingUnitRoleCodeMock.mockResolvedValue(true);

    await expect(
      verifyRolePagePassword("angel", "unit-angel", "loop-pak-4")
    ).resolves.toBe(true);

    expect(verifyOperatingUnitRoleCodeMock).toHaveBeenCalledWith(
      "loop-pak-4",
      "angel",
      "unit-angel"
    );
  });
});
