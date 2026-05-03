"use client";

import { useEffect, useState } from "react";

type ToastNoticeProps = {
  message: string;
  tone?: "success" | "danger";
};

export function ToastNotice({ message, tone = "success" }: ToastNoticeProps) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setVisible(false), 3500);
    return () => window.clearTimeout(timer);
  }, [message]);

  if (!message || !visible) return null;

  const danger = tone === "danger";

  return (
    <div className="fixed inset-x-4 bottom-6 z-50 flex justify-center" role="status" aria-live="polite">
      <div
        className="flex min-h-11 max-w-[min(88vw,360px)] items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold shadow-xl"
        style={{
          borderColor: danger ? "#fecaca" : "rgba(21, 128, 61, 0.25)",
          backgroundColor: danger ? "var(--danger-bg)" : "var(--success-bg)",
          color: danger ? "var(--danger)" : "var(--success)",
        }}
      >
        <span className="min-w-0 flex-1">{message}</span>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="btn-press inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-base leading-none"
          style={{
            borderColor: danger ? "#fecaca" : "rgba(21, 128, 61, 0.25)",
            backgroundColor: "rgba(255, 255, 255, 0.55)",
          }}
          aria-label="알림 닫기"
        >
          ×
        </button>
      </div>
    </div>
  );
}
