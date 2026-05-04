"use client";

import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { notifyNavigationLoadingStart } from "@/app/navigation-loading-bar";

type PendingSubmitButtonProps = {
  idleLabel?: string;
  pendingLabel?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  pendingChildren?: ReactNode;
  disabled?: boolean;
  showSpinner?: boolean;
  navigationProgress?: boolean;
};

export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
    />
  );
}

export function PendingSubmitButton({
  idleLabel,
  pendingLabel = "처리중...",
  className,
  style,
  children,
  pendingChildren,
  disabled = false,
  showSpinner = true,
  navigationProgress = false,
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (!navigationProgress) return;

    const form = event.currentTarget.form;
    if (form && !form.checkValidity()) return;
    notifyNavigationLoadingStart();
  }

  return (
    <button
      type="submit"
      className={className}
      style={style}
      disabled={isDisabled}
      aria-busy={pending}
      onClick={handleClick}
    >
      <span className="inline-flex items-center justify-center gap-1.5">
        {pending && showSpinner ? <LoadingSpinner /> : null}
        {pending ? (pendingChildren ?? pendingLabel) : (children ?? idleLabel)}
      </span>
    </button>
  );
}
