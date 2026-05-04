"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { PendingSubmitButton } from "@/app/pending-submit-button";

type DeleteConfirmButtonProps = {
  confirmMessage: string;
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
  title?: string;
  children: ReactNode;
};

function confirmTitle(message: string): string {
  if (message.includes("취소")) return "취소할까요?";
  if (message.includes("제외")) return "제외할까요?";
  return "삭제할까요?";
}

export function DeleteConfirmButton({
  confirmMessage,
  className,
  style,
  "aria-label": ariaLabel,
  title,
  children,
}: DeleteConfirmButtonProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={className}
        style={style}
        aria-label={ariaLabel}
        title={title}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 py-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
            className="modal-surface w-full max-w-sm p-5 shadow-xl"
          >
            <h2
              id="delete-confirm-title"
              className="text-base font-extrabold"
              style={{ color: "var(--ink)" }}
            >
              {confirmTitle(confirmMessage)}
            </h2>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--ink-soft)" }}>
              {confirmMessage}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full border px-4 py-2 text-sm font-bold"
                style={{ borderColor: "var(--line)", color: "var(--ink-soft)" }}
                onClick={() => setOpen(false)}
              >
                취소
              </button>
              <PendingSubmitButton
                idleLabel="확인"
                pendingLabel="처리 중"
                className="btn-press rounded-full px-4 py-2 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-70"
                style={{ backgroundColor: "var(--danger)" }}
              />
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
