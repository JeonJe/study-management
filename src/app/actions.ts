"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAuthenticated, login, logout } from "@/lib/auth";
import { normalizeMeetingKind } from "@/lib/meeting-kind";
import { withSettlementInPath } from "@/lib/navigation-utils";
import { requireOperatingUnitSlug } from "@/lib/operating-unit-store";
import {
  afterpartyManagePath,
  afterpartyPath,
  cohortEntryPath,
  dashboardPath,
  type DashboardState,
  meetingManagePath,
  parseDelimitedNames,
  parseDelimitedPeople,
  parseDirectParticipantNames,
  participantFeedbackPath,
  participantFeedbackSourceFromMutation,
  revalidateAfterpartyViews,
  revalidateMeetupViews,
  requireAuthOrRedirect,
  resolveMeetingLabel,
  resolveParticipantRoleEntries,
  safeReturnPath,
  textFrom,
  unitSlugFromPath,
  withUpdatedSearchParams,
} from "@/app/actions/shared-action-utils";
import {
  isAfterpartyPasswordError,
  createAfterparty,
  createAfterpartySettlement,
  createAfterpartyParticipantsBulk,
  deleteAfterparty,
  deleteAfterpartyParticipant,
  deleteAfterpartySettlement,
  deleteAfterpartySettlementParticipant,
  updateAfterpartyParticipantSettlement,
  updateAfterparty,
  updateAfterpartySettlement,
} from "@/lib/afterparty-store";
import {
  createMeeting,
  createRsvp,
  createRsvpsBulk,
  deleteMeeting,
  deleteRsvp,
  isMeetingPasswordError,
  parseCapacityInput,
  promoteWaitlistedRsvp,
  type ParticipantRole,
  updateMeeting,
  updateRsvp,
} from "@/lib/meetup-store";
import {
  isParticipantRole,
  PARTICIPANT_ROLE_ORDER,
} from "@/lib/participant-role-utils";

export async function loginAction(formData: FormData): Promise<void> {
  const password = textFrom(formData, "password").trim();
  const selectedUnit = textFrom(formData, "selectedUnit").trim();
  const authScope = textFrom(formData, "authScope").trim();
  const returnPath = safeReturnPath(formData);
  const success = await login(
    password,
    authScope === "unit" ? { unitSlug: selectedUnit } : undefined
  );
  const loginParams = new URLSearchParams();
  if (selectedUnit) loginParams.set("unit", selectedUnit);

  if (!success) {
    if (authScope === "admin") {
      loginParams.set("adminAuth", "invalid");
    } else {
      loginParams.set("auth", "invalid");
    }
    redirect(`/?${loginParams.toString()}`);
  }

  redirect(returnPath ?? (authScope === "unit" ? cohortEntryPath(selectedUnit) : dashboardPath()));
}

export async function logoutAction(): Promise<void> {
  await logout();
  redirect("/");
}

export async function createMeetingAction(formData: FormData): Promise<void> {
  const state: DashboardState = {
    date: textFrom(formData, "returnDate"),
    keyword: textFrom(formData, "returnKeyword"),
  };
  const returnPath = safeReturnPath(formData);

  await requireAuthOrRedirect();

  const title = textFrom(formData, "title").trim();
  const meetingDate = textFrom(formData, "meetingDate").trim();
  const startTime = textFrom(formData, "startTime").trim() || "14:00";
  const location = textFrom(formData, "location").trim();
  const description = textFrom(formData, "description").trim();
  const leaders = parseDelimitedPeople(textFrom(formData, "leaders"));
  const password = textFrom(formData, "meetingPassword").trim();
  const meetingKind = normalizeMeetingKind(textFrom(formData, "meetingKind").trim());
  const operatingUnitSlug = requireOperatingUnitSlug(textFrom(formData, "unit"));

  if (!title || !meetingDate || !location) {
    redirect(returnPath ?? dashboardPath(state));
  }

  // NOTE(SM-4A2): create 흐름의 capacity invalid 사용자 피드백은 dashboard manage 채널 도입 후 처리.
  // 본 PR에서는 헬퍼로 정규화만 통일하고, invalid는 정원 미설정으로 fallback.
  const capacityResult = parseCapacityInput(textFrom(formData, "capacity"));
  const capacityValue =
    capacityResult.kind === "value" ? capacityResult.value : undefined;

  const created = await createMeeting({
    title,
    meetingDate,
    startTime,
    location,
    description,
    leaders,
    password,
    capacity: capacityValue,
    meetingKind,
    operatingUnitSlug,
  });

  revalidateMeetupViews(created.id, returnPath);
  revalidatePath("/loop-pak");
  redirect(returnPath ?? dashboardPath({ date: created.meetingDate }));
}

export async function createRsvpAction(formData: FormData): Promise<void> {
  const meetingId = textFrom(formData, "meetingId").trim();
  const date = textFrom(formData, "returnDate").trim();
  const keyword = textFrom(formData, "returnKeyword").trim();
  const returnPath = safeReturnPath(formData);

  await requireAuthOrRedirect();

  const name = textFrom(formData, "name").trim();
  const roleRaw = textFrom(formData, "role").trim();
  const meetingLabel = await resolveMeetingLabel(meetingId);

  if (!meetingId || !name || !isParticipantRole(roleRaw)) {
    redirect(dashboardPath({ date, keyword }));
  }

  await createRsvp({
    meetingId,
    name,
    role: roleRaw,
    note: meetingLabel,
  });

  revalidateMeetupViews(meetingId, returnPath);
  redirect(returnPath ?? dashboardPath({ date, keyword }));
}

export async function createAfterpartyAction(formData: FormData): Promise<void> {
  const state: DashboardState = {
    date: textFrom(formData, "returnDate"),
  };
  const returnPath = safeReturnPath(formData);

  await requireAuthOrRedirect();

  const title = textFrom(formData, "title").trim();
  const eventDate = textFrom(formData, "eventDate").trim();
  const startTime = textFrom(formData, "startTime").trim() || "19:00";
  const location = textFrom(formData, "location").trim();
  const description = textFrom(formData, "description").trim();
  const settlementManager = textFrom(formData, "settlementManager").trim();
  const settlementAccount = textFrom(formData, "settlementAccount").trim();
  const password = textFrom(formData, "afterpartyPassword").trim();
  const operatingUnitSlug = requireOperatingUnitSlug(textFrom(formData, "unit"));

  if (!title || !eventDate || !location) {
    redirect(returnPath ?? afterpartyPath(state));
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    redirect(returnPath ?? afterpartyPath(state));
  }

  const created = await createAfterparty({
    title,
    eventDate,
    startTime,
    location,
    description,
    settlementManager,
    settlementAccount,
    password,
    operatingUnitSlug,
  });

  revalidateAfterpartyViews(created.id, returnPath);
  redirect(
    returnPath
      ? withUpdatedSearchParams(returnPath, { date: created.eventDate })
      : afterpartyPath({ date: created.eventDate })
  );
}

export async function bulkCreateAfterpartyParticipantsAction(formData: FormData): Promise<void> {
  const afterpartyId = textFrom(formData, "afterpartyId").trim();
  const settlementId = textFrom(formData, "settlementId").trim();
  const date = textFrom(formData, "returnDate").trim();
  const returnPath = safeReturnPath(formData);
  const mutationSource = textFrom(formData, "mutationSource").trim();
  const feedbackSource = participantFeedbackSourceFromMutation(mutationSource);

  await requireAuthOrRedirect();

  const namesRaw = textFrom(formData, "names");
  const roleRaw = textFrom(formData, "role").trim();
  const fallbackPath = returnPath ?? (afterpartyId ? `/afterparty/${afterpartyId}` : afterpartyPath({ date }));
  const names =
    feedbackSource === "manual"
      ? parseDirectParticipantNames(namesRaw)
      : parseDelimitedNames(namesRaw);

  if (!afterpartyId || names.length === 0) {
    redirect(participantFeedbackPath(fallbackPath, "invalid-input", feedbackSource, namesRaw));
  }

  const participantInputs =
    feedbackSource === "manual"
      ? names.map((name) => ({
          name,
          role: isParticipantRole(roleRaw) ? roleRaw : ("student" as const),
        }))
      : isParticipantRole(roleRaw)
        ? names.map((name) => ({ name, role: roleRaw }))
        : await resolveParticipantRoleEntries(names, unitSlugFromPath(returnPath));

  const insertedCount = await createAfterpartyParticipantsBulk(
    afterpartyId,
    participantInputs,
    settlementId || undefined
  );

  if (insertedCount === 0) {
    redirect(participantFeedbackPath(fallbackPath, "already-added", feedbackSource, namesRaw));
  }

  revalidateAfterpartyViews(afterpartyId, returnPath, {
    skipDashboardPath: mutationSource === "quick-add",
  });
  redirect(fallbackPath);
}

export async function deleteAfterpartyParticipantAction(formData: FormData): Promise<void> {
  const afterpartyId = textFrom(formData, "afterpartyId").trim();
  const settlementId = textFrom(formData, "settlementId").trim();
  const participantId = textFrom(formData, "participantId").trim();
  const date = textFrom(formData, "returnDate").trim();
  const returnPath = safeReturnPath(formData);

  await requireAuthOrRedirect();

  if (!afterpartyId || !participantId) {
    redirect(afterpartyPath({ date }));
  }

  if (settlementId) {
    await deleteAfterpartySettlementParticipant(participantId, settlementId, afterpartyId);
  } else {
    await deleteAfterpartyParticipant(participantId, afterpartyId);
  }

  revalidateAfterpartyViews(afterpartyId, returnPath);
  redirect(returnPath ?? afterpartyPath({ date }));
}

export async function updateSettlementAction(
  participantId: string,
  afterpartyId: string,
  settlementId: string | undefined,
  isSettled: boolean
): Promise<{ ok: boolean }> {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return { ok: false };
  }
  try {
    await updateAfterpartyParticipantSettlement(
      participantId,
      afterpartyId,
      settlementId,
      isSettled
    );
    revalidateAfterpartyViews(afterpartyId, null);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function updateAfterpartyParticipantSettlementAction(formData: FormData): Promise<void> {
  const afterpartyId = textFrom(formData, "afterpartyId").trim();
  const settlementId = textFrom(formData, "settlementId").trim();
  const participantId = textFrom(formData, "participantId").trim();
  const date = textFrom(formData, "returnDate").trim();
  const returnPath = safeReturnPath(formData);
  const settledValue = textFrom(formData, "isSettled").trim();

  await requireAuthOrRedirect();

  if (!afterpartyId || !settlementId || !participantId) {
    redirect(afterpartyPath({ date }));
  }

  await updateAfterpartyParticipantSettlement(
    participantId,
    afterpartyId,
    settlementId,
    settledValue === "true"
  );

  revalidateAfterpartyViews(afterpartyId, returnPath);
  redirect(returnPath ?? afterpartyPath({ date }));
}

export async function deleteAfterpartyAction(formData: FormData): Promise<void> {
  const afterpartyId = textFrom(formData, "afterpartyId").trim();
  const date = textFrom(formData, "returnDate").trim();
  const returnPath = safeReturnPath(formData);
  const accessPassword = textFrom(formData, "afterpartyPassword").trim();

  await requireAuthOrRedirect();

  if (!afterpartyId) {
    redirect(afterpartyPath({ date }));
  }

  try {
    await deleteAfterparty(afterpartyId, accessPassword);
  } catch (error) {
    if (isAfterpartyPasswordError(error)) {
      redirect(afterpartyManagePath(afterpartyId, returnPath, error.code));
    }
    throw error;
  }

  revalidateAfterpartyViews(afterpartyId, returnPath);
  redirect(returnPath ?? afterpartyPath({ date }));
}

export async function updateAfterpartyAction(formData: FormData): Promise<void> {
  const afterpartyId = textFrom(formData, "afterpartyId").trim();
  const date = textFrom(formData, "returnDate").trim();
  const returnPath = safeReturnPath(formData);

  await requireAuthOrRedirect();

  const title = textFrom(formData, "title").trim();
  const eventDate = textFrom(formData, "eventDate").trim();
  const startTime = textFrom(formData, "startTime").trim();
  const location = textFrom(formData, "location").trim();
  const description = textFrom(formData, "description").trim();
  const accessPassword = textFrom(formData, "afterpartyPassword").trim();
  const nextPassword = textFrom(formData, "nextAfterpartyPassword").trim();
  const clearPassword = textFrom(formData, "clearAfterpartyPassword") === "true";

  if (!afterpartyId || !title || !eventDate || !startTime || !location) {
    redirect(afterpartyPath({ date }));
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    redirect(afterpartyPath({ date }));
  }

  try {
    await updateAfterparty({
      id: afterpartyId,
      title,
      eventDate,
      startTime,
      location,
      description,
      accessPassword,
      nextPassword,
      clearPassword,
    });
  } catch (error) {
    if (isAfterpartyPasswordError(error)) {
      redirect(afterpartyManagePath(afterpartyId, returnPath, error.code));
    }
    throw error;
  }

  revalidateAfterpartyViews(afterpartyId, returnPath);
  redirect(returnPath ?? afterpartyPath({ date: eventDate }));
}

export async function createAfterpartySettlementAction(formData: FormData): Promise<void> {
  const afterpartyId = textFrom(formData, "afterpartyId").trim();
  const date = textFrom(formData, "returnDate").trim();
  const returnPath = safeReturnPath(formData);
  const title = textFrom(formData, "title").trim();
  const settlementManager = textFrom(formData, "settlementManager").trim();
  const settlementAccount = textFrom(formData, "settlementAccount").trim();
  const accessPassword = textFrom(formData, "afterpartyPassword").trim();

  await requireAuthOrRedirect();

  if (!afterpartyId || !title) {
    redirect(returnPath ?? afterpartyPath({ date }));
  }

  let created: Awaited<ReturnType<typeof createAfterpartySettlement>>;
  try {
    created = await createAfterpartySettlement({
      afterpartyId,
      title,
      settlementManager,
      settlementAccount,
      accessPassword,
    });
  } catch (error) {
    if (isAfterpartyPasswordError(error)) {
      redirect(afterpartyManagePath(afterpartyId, returnPath, error.code));
    }
    throw error;
  }

  revalidateAfterpartyViews(afterpartyId, returnPath);
  redirect(withSettlementInPath(returnPath, afterpartyId, created.id, date));
}

export async function updateAfterpartySettlementAction(formData: FormData): Promise<void> {
  const afterpartyId = textFrom(formData, "afterpartyId").trim();
  const settlementId = textFrom(formData, "settlementId").trim();
  const date = textFrom(formData, "returnDate").trim();
  const returnPath = safeReturnPath(formData);
  const title = textFrom(formData, "title").trim();
  const settlementManager = textFrom(formData, "settlementManager").trim();
  const settlementAccount = textFrom(formData, "settlementAccount").trim();
  const accessPassword = textFrom(formData, "afterpartyPassword").trim();

  await requireAuthOrRedirect();

  if (!afterpartyId || !settlementId || !title) {
    redirect(returnPath ?? afterpartyPath({ date }));
  }

  try {
    await updateAfterpartySettlement({
      id: settlementId,
      afterpartyId,
      title,
      settlementManager,
      settlementAccount,
      accessPassword,
    });
  } catch (error) {
    if (isAfterpartyPasswordError(error)) {
      redirect(afterpartyManagePath(afterpartyId, returnPath, error.code));
    }
    throw error;
  }

  revalidateAfterpartyViews(afterpartyId, returnPath);
  redirect(withSettlementInPath(returnPath, afterpartyId, settlementId, date));
}

export async function deleteAfterpartySettlementAction(formData: FormData): Promise<void> {
  const afterpartyId = textFrom(formData, "afterpartyId").trim();
  const settlementId = textFrom(formData, "settlementId").trim();
  const date = textFrom(formData, "returnDate").trim();
  const returnPath = safeReturnPath(formData);
  const accessPassword = textFrom(formData, "afterpartyPassword").trim();

  await requireAuthOrRedirect();

  if (!afterpartyId || !settlementId) {
    redirect(returnPath ?? afterpartyPath({ date }));
  }

  try {
    const remainingSettlementId = await deleteAfterpartySettlement(
      settlementId,
      afterpartyId,
      accessPassword
    );
    revalidateAfterpartyViews(afterpartyId, returnPath);
    redirect(withSettlementInPath(returnPath, afterpartyId, remainingSettlementId, date));
  } catch (error) {
    if (isAfterpartyPasswordError(error)) {
      redirect(afterpartyManagePath(afterpartyId, returnPath, error.code));
    }
    revalidateAfterpartyViews(afterpartyId, returnPath);
    redirect(returnPath ?? afterpartyPath({ date }));
  }
}

export async function deleteRsvpAction(formData: FormData): Promise<void> {
  const meetingId = textFrom(formData, "meetingId").trim();
  const date = textFrom(formData, "returnDate").trim();
  const keyword = textFrom(formData, "returnKeyword").trim();
  const rsvpId = textFrom(formData, "rsvpId").trim();
  const returnPath = safeReturnPath(formData);

  await requireAuthOrRedirect();

  if (!meetingId || !rsvpId) {
    redirect(dashboardPath({ date, keyword }));
  }

  await deleteRsvp(rsvpId, meetingId);

  revalidateMeetupViews(meetingId, returnPath);
  redirect(returnPath ?? dashboardPath({ date, keyword }));
}

export async function promoteWaitlistedRsvpAction(formData: FormData): Promise<void> {
  const meetingId = textFrom(formData, "meetingId").trim();
  const rsvpId = textFrom(formData, "rsvpId").trim();
  const returnPath = safeReturnPath(formData);
  const fallbackPath = returnPath ?? (meetingId ? `/meetings/${meetingId}` : "/");

  await requireAuthOrRedirect();

  if (!meetingId || !rsvpId) {
    redirect(fallbackPath);
  }

  const promoted = await promoteWaitlistedRsvp(meetingId, rsvpId);
  if (!promoted) {
    redirect(participantFeedbackPath(fallbackPath, "waitlist-full", "manual"));
  }

  revalidateMeetupViews(meetingId, returnPath);
  redirect(fallbackPath);
}

export async function bulkCreateRsvpsAction(formData: FormData): Promise<void> {
  const meetingId = textFrom(formData, "meetingId").trim();
  const date = textFrom(formData, "returnDate").trim();
  const keyword = textFrom(formData, "returnKeyword").trim();
  const returnPath = safeReturnPath(formData);
  const mutationSource = textFrom(formData, "mutationSource").trim();
  const feedbackSource = participantFeedbackSourceFromMutation(mutationSource);

  await requireAuthOrRedirect();

  const namesRaw = textFrom(formData, "names");
  const roleRaw = textFrom(formData, "role").trim();
  const note = textFrom(formData, "note").trim();
  const meetingLabel = note || (await resolveMeetingLabel(meetingId));
  const fallbackPath = returnPath ?? (meetingId ? `/meetings/${meetingId}` : dashboardPath({ date, keyword }));

  if (!meetingId) {
    redirect(dashboardPath({ date, keyword }));
  }

  const names =
    feedbackSource === "manual"
      ? parseDirectParticipantNames(namesRaw)
      : parseDelimitedNames(namesRaw);
  if (names.length === 0) {
    redirect(participantFeedbackPath(fallbackPath, "invalid-input", feedbackSource, namesRaw));
  }

  let insertedCount = 0;
  if (isParticipantRole(roleRaw)) {
    insertedCount = await createRsvpsBulk(meetingId, roleRaw, names, meetingLabel);
  } else {
    const roleEntries = await resolveParticipantRoleEntries(names, unitSlugFromPath(returnPath));

    const roleBuckets = new Map<ParticipantRole, string[]>();
    for (const role of PARTICIPANT_ROLE_ORDER) {
      roleBuckets.set(role, []);
    }

    for (const entry of roleEntries) {
      const bucket = roleBuckets.get(entry.role) ?? [];
      bucket.push(entry.name);
      roleBuckets.set(entry.role, bucket);
    }

    for (const role of PARTICIPANT_ROLE_ORDER) {
      const namesByRole = roleBuckets.get(role) ?? [];
      if (namesByRole.length > 0) {
        insertedCount += await createRsvpsBulk(meetingId, role, namesByRole, meetingLabel);
      }
    }
  }

  if (insertedCount === 0) {
    redirect(participantFeedbackPath(fallbackPath, "already-added", feedbackSource, namesRaw));
  }

  revalidateMeetupViews(meetingId, returnPath, {
    skipDashboardPath: mutationSource === "quick-assign",
  });
  redirect(fallbackPath);
}

export async function updateMeetingAction(formData: FormData): Promise<void> {
  const meetingId = textFrom(formData, "meetingId").trim();
  const date = textFrom(formData, "returnDate").trim();
  const keyword = textFrom(formData, "returnKeyword").trim();
  const returnPath = safeReturnPath(formData);

  await requireAuthOrRedirect();

  const title = textFrom(formData, "title").trim();
  const meetingDate = textFrom(formData, "meetingDate").trim();
  const startTime = textFrom(formData, "startTime").trim();
  const location = textFrom(formData, "location").trim();
  const description = textFrom(formData, "description").trim();
  const leaders = parseDelimitedPeople(textFrom(formData, "leaders"));
  const accessPassword = textFrom(formData, "meetingPassword").trim();
  const nextPassword = textFrom(formData, "nextMeetingPassword").trim();
  const clearPassword = textFrom(formData, "clearMeetingPassword") === "true";
  const capacityResult = parseCapacityInput(textFrom(formData, "capacity"));

  if (!meetingId || !title || !meetingDate || !startTime || !location) {
    redirect(dashboardPath({ date, keyword }));
  }

  // 사용자가 잘못된 capacity를 입력하면 silent drop 대신 manage 채널로 피드백.
  if (capacityResult.kind === "invalid") {
    redirect(meetingManagePath(meetingId, returnPath, "capacity-invalid"));
  }
  const capacity =
    capacityResult.kind === "value" ? capacityResult.value : null;

  try {
    await updateMeeting({
      id: meetingId,
      title,
      meetingDate,
      startTime,
      location,
      description,
      leaders,
      accessPassword,
      nextPassword,
      clearPassword,
      capacity,
    });
  } catch (error) {
    if (isMeetingPasswordError(error)) {
      redirect(meetingManagePath(meetingId, returnPath, error.code));
    }
    throw error;
  }

  revalidateMeetupViews(meetingId, returnPath);
  redirect(returnPath ?? dashboardPath({ date: meetingDate, keyword }));
}

export async function deleteMeetingAction(formData: FormData): Promise<void> {
  const meetingId = textFrom(formData, "meetingId").trim();
  const date = textFrom(formData, "returnDate").trim();
  const returnPath = safeReturnPath(formData);
  const accessPassword = textFrom(formData, "meetingPassword").trim();

  await requireAuthOrRedirect();

  if (!meetingId) {
    redirect(dashboardPath({ date }));
  }

  try {
    await deleteMeeting(meetingId, accessPassword);
  } catch (error) {
    if (isMeetingPasswordError(error)) {
      redirect(meetingManagePath(meetingId, returnPath, error.code));
    }
    throw error;
  }

  revalidateMeetupViews(meetingId, returnPath);
  redirect(returnPath ?? dashboardPath({ date }));
}

export async function updateRsvpAction(formData: FormData): Promise<void> {
  const meetingId = textFrom(formData, "meetingId").trim();
  const rsvpId = textFrom(formData, "rsvpId").trim();
  const date = textFrom(formData, "returnDate").trim();
  const keyword = textFrom(formData, "returnKeyword").trim();
  const returnPath = safeReturnPath(formData);

  await requireAuthOrRedirect();

  const name = textFrom(formData, "name").trim();
  const roleRaw = textFrom(formData, "role").trim();
  const note = textFrom(formData, "note").trim();

  if (!meetingId || !rsvpId || !name || !isParticipantRole(roleRaw)) {
    redirect(dashboardPath({ date, keyword }));
  }

  await updateRsvp({
    id: rsvpId,
    meetingId,
    name,
    role: roleRaw,
    note,
  });

  revalidateMeetupViews(meetingId, returnPath);
  redirect(returnPath ?? dashboardPath({ date, keyword }));
}
