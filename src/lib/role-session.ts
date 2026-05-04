import { cookies } from "next/headers";
import {
  type ConfiguredRolePages,
  type RolePageRole,
  normalizeRolePageRole,
} from "@/lib/role-page";
import {
  type OperatingUnitRoleCode,
  createOperatingUnitRoleAccessToken,
  normalizeOperatingUnitSlug,
  verifyOperatingUnitRoleAccessToken,
  verifyOperatingUnitRoleCode,
} from "@/lib/operating-unit-store";

const ROLE_COOKIE_NAME = "meetup_role_access";
const ROLE_COOKIE_MAX_AGE = 60 * 60 * 12;

function safeDecodeURIComponent(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function getConfiguredRolePages(): ConfiguredRolePages {
  return {
    angel: true,
    admin: true,
  };
}

export async function verifyRolePagePassword(
  role: RolePageRole,
  password: string,
  unitSlug = ""
): Promise<boolean> {
  const normalizedUnitSlug = normalizeOperatingUnitSlug(unitSlug);
  if (normalizedUnitSlug && (role === "angel" || role === "admin")) {
    return verifyOperatingUnitRoleCode(
      normalizedUnitSlug,
      role as OperatingUnitRoleCode,
      password
    );
  }

  return false;
}

export function createRoleScopedToken(
  role: RolePageRole,
  purpose: string,
  payload: string,
  unitSlug = ""
): string | null {
  void role;
  void purpose;
  void payload;
  void unitSlug;
  return null;
}

export function verifyRoleScopedToken(
  role: RolePageRole,
  purpose: string,
  payload: string,
  token: string,
  unitSlug = ""
): boolean {
  void role;
  void purpose;
  void payload;
  void token;
  void unitSlug;
  return false;
}

export async function getCurrentRolePageRole(unitSlug = ""): Promise<RolePageRole | null> {
  const normalizedUnitSlug = normalizeOperatingUnitSlug(unitSlug);
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ROLE_COOKIE_NAME)?.value;
  if (!cookieValue) return null;

  const parts = cookieValue.split(".");
  const [roleText, encodedUnitSlugOrToken, maybeToken] = parts;
  const role = normalizeRolePageRole(roleText);
  const cookieUnitSlug = maybeToken
    ? safeDecodeURIComponent(encodedUnitSlugOrToken)
    : "";
  if (cookieUnitSlug === null) return null;
  const token = maybeToken ?? encodedUnitSlugOrToken;

  if (!role || !token) return null;
  if (normalizedUnitSlug !== normalizeOperatingUnitSlug(cookieUnitSlug)) {
    return null;
  }

  if (normalizedUnitSlug && (role === "angel" || role === "admin")) {
    return (await verifyOperatingUnitRoleAccessToken(
      normalizedUnitSlug,
      role as OperatingUnitRoleCode,
      token
    ))
      ? role
      : null;
  }

  return null;
}

export async function grantRolePageAccess(
  role: RolePageRole,
  password: string,
  unitSlug = ""
): Promise<boolean> {
  const normalizedUnitSlug = normalizeOperatingUnitSlug(unitSlug);
  if (!(await verifyRolePagePassword(role, password, normalizedUnitSlug))) {
    return false;
  }

  const roleToken = normalizedUnitSlug
    ? await createOperatingUnitRoleAccessToken(
        normalizedUnitSlug,
        role as OperatingUnitRoleCode,
        password
      )
    : null;
  if (normalizedUnitSlug && !roleToken) return false;

  const cookieStore = await cookies();
  cookieStore.set({
    name: ROLE_COOKIE_NAME,
    value: normalizedUnitSlug
      ? `${role}.${encodeURIComponent(normalizedUnitSlug)}.${roleToken}`
      : "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ROLE_COOKIE_MAX_AGE,
    path: "/",
  });
  return true;
}

export async function clearRolePageAccess(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: ROLE_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}
