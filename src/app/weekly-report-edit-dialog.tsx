"use client";

import { type ReactNode, useEffect, useState } from "react";
import { LoadingSpinner } from "@/app/pending-submit-button";

type WeeklyReportEditDialogProps = {
  triggerLabel: string;
  hasReport: boolean;
  title: string;
  description: string;
  badge: string;
  formId: string;
  children: ReactNode;
};

export function WeeklyReportEditDialog({
  triggerLabel,
  hasReport,
  title,
  description,
  badge,
  formId,
  children,
}: WeeklyReportEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-press cursor-pointer rounded-full border px-3 py-1 text-sm font-bold"
        style={{
          borderColor: hasReport ? "var(--success)" : "rgba(13, 127, 242, 0.25)",
          backgroundColor: hasReport ? "var(--success-bg)" : "var(--accent-weak)",
          color: hasReport ? "var(--success)" : "var(--accent-strong)",
        }}
      >
        {triggerLabel}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <button
            type="button"
            aria-label="닫기"
            className="absolute inset-0 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="weekly-report-edit-title"
            className="modal-surface relative max-h-[calc(100vh-2rem)] w-full max-w-4xl overflow-y-auto p-0"
          >
            <div className="sticky top-0 z-10 flex flex-wrap items-start justify-between gap-3 border-b bg-white px-5 py-4" style={{ borderColor: "var(--line)" }}>
              <div>
                <h3 id="weekly-report-edit-title" className="text-lg font-extrabold" style={{ color: "var(--ink)" }}>
                  {title}
                </h3>
                <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
                  {description}
                </p>
              </div>
              <span className="rounded-md border px-2 py-1 text-xs font-semibold" style={{ borderColor: "var(--line)", color: "var(--ink-muted)" }}>
                {badge}
              </span>
            </div>

            <div className="px-5 py-4">
              {children}
            </div>

            <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-white px-5 py-4" style={{ borderColor: "var(--line)" }}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-press inline-flex h-12 items-center rounded-full border px-4 text-sm font-bold"
                style={{ borderColor: "var(--line)", color: "var(--ink-soft)", backgroundColor: "var(--surface)" }}
              >
                닫기
              </button>
              <button
                type="button"
                className="btn-press h-12 rounded-full px-5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-70"
                style={{ backgroundColor: "var(--accent)" }}
                disabled={submitting}
                aria-busy={submitting}
                onClick={() => {
                  const form = document.getElementById(formId) as HTMLFormElement | null;
                  if (!form?.reportValidity()) return;
                  setSubmitting(true);
                  form.requestSubmit();
                }}
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  {submitting ? <LoadingSpinner /> : null}
                  {submitting ? "저장 중" : "저장"}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
