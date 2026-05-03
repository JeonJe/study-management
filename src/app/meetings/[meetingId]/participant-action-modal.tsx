"use client";

import {
  useEffect,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  deleteRsvpAction,
  moveRsvpToWaitlistAction,
} from "@/app/actions";
import { DeleteConfirmButton } from "@/app/meetings/[meetingId]/delete-confirm-button";
import { PendingSubmitButton } from "@/app/pending-submit-button";
import type { RsvpRecord } from "@/lib/meetup-store";
import { PARTICIPANT_ROLE_META } from "@/lib/participant-role-utils";

type ParticipantActionModalProps = {
  row: RsvpRecord;
  meetingId: string;
  returnPath: string;
  displayName?: string;
  canMoveToWaitlist?: boolean;
};

export function ParticipantActionModal({
  row,
  meetingId,
  returnPath,
  displayName,
  canMoveToWaitlist = false,
}: ParticipantActionModalProps) {
  const [open, setOpen] = useState(false);
  const roleMeta = PARTICIPANT_ROLE_META[row.role];
  const participantName = displayName ?? row.name;
  const displayText = `${roleMeta.emoji ? `${roleMeta.emoji} ` : ""}${participantName}`;
  const portalTarget = typeof document === "undefined" ? null : document.body;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function closeModal(): void {
    setOpen(false);
  }

  function onBackdropClick(event: MouseEvent<HTMLDivElement>): void {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  function onContainerKeyDown(event: ReactKeyboardEvent<HTMLDivElement>): void {
    if (event.key === "Escape") {
      closeModal();
    }
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-press flex h-8 items-center rounded-full border px-3 text-sm font-semibold leading-none transition hover:shadow-sm"
        style={{
          borderColor: "var(--line)",
          backgroundColor: "var(--surface)",
          color: roleMeta.textColor,
        }}
      >
        {displayText}
      </button>

      {open && portalTarget
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 p-4 fade-in"
              role="dialog"
              aria-modal="true"
              aria-labelledby={`participant-action-${row.id}`}
              onClick={onBackdropClick}
              onKeyDown={onContainerKeyDown}
            >
              <div className="modal-surface w-full max-w-md p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold" style={{ color: roleMeta.textColor }}>
                      {roleMeta.label}
                    </p>
                    <h3 id={`participant-action-${row.id}`} className="mt-1 truncate text-xl font-extrabold" style={{ color: "var(--ink)" }}>
                      {participantName}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-press flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold"
                    style={{ borderColor: "var(--line)", color: "var(--ink-muted)" }}
                    aria-label="닫기"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-5 grid gap-2">
                  {canMoveToWaitlist ? (
                    <form action={moveRsvpToWaitlistAction}>
                      <input type="hidden" name="meetingId" value={meetingId} />
                      <input type="hidden" name="rsvpId" value={row.id} />
                      <input type="hidden" name="returnPath" value={returnPath} />
                      <PendingSubmitButton
                        idleLabel="대기로 전환"
                        pendingLabel="변경 중"
                        className="btn-press h-11 w-full rounded-xl border px-4 text-sm font-bold"
                        style={{ borderColor: "#bfdbfe", backgroundColor: "#eff6ff", color: "var(--accent)" }}
                      />
                    </form>
                  ) : null}

                  <form action={deleteRsvpAction}>
                    <input type="hidden" name="meetingId" value={meetingId} />
                    <input type="hidden" name="rsvpId" value={row.id} />
                    <input type="hidden" name="returnPath" value={returnPath} />
                    <DeleteConfirmButton
                      confirmMessage={`${row.name}을(를) 참여자 목록에서 제외합니다.`}
                      className="btn-press h-11 w-full rounded-xl border px-4 text-sm font-bold"
                      style={{ borderColor: "#fecdd3", backgroundColor: "#fff1f2", color: "#be123c" }}
                    >
                      참여 제외
                    </DeleteConfirmButton>
                  </form>
                </div>
              </div>
            </div>,
            portalTarget
          )
        : null}
    </li>
  );
}
