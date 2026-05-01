"use client";

import { useEffect, useRef, useState } from "react";
import type { MapProvider } from "@/lib/location-utils";

// X-Frame-Options 차단 시 onError가 발동하지 않으므로 폴백 전환까지 대기하는 시간(ms)
const IFRAME_LOAD_TIMEOUT_MS = 5000;

type MapPreviewProps = {
  provider: MapProvider;
  embedUrl: string;
  locationText: string;
  placeLink: string;
};

function displayLocationText(locationText: string, placeLink: string): string {
  return locationText.replace(placeLink, "").replace(/\s*\/\s*$/, "").trim() || locationText;
}

function MapLinkCard({
  locationText,
  placeLink,
  compact = false,
}: {
  locationText: string;
  placeLink: string;
  compact?: boolean;
}) {
  const label = displayLocationText(locationText, placeLink);

  return (
    <div
      className={compact ? "mt-2 rounded-xl border p-3" : "mt-2 rounded-2xl border p-4"}
      style={{ borderColor: "var(--line)", backgroundColor: "var(--surface-alt)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold" style={{ color: "var(--ink-muted)" }}>
            장소
          </p>
          <p className="mt-1 truncate text-sm font-semibold" style={{ color: "var(--ink)" }}>
            {label}
          </p>
        </div>
        <a
          href={placeLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-press inline-flex h-9 items-center justify-center rounded-full border px-3 text-sm font-bold"
          style={{ borderColor: "rgba(13, 127, 242, 0.25)", backgroundColor: "var(--accent-weak)", color: "var(--accent-strong)" }}
        >
          지도 열기
        </a>
      </div>
      {!compact ? (
        <p className="mt-3 text-xs leading-5" style={{ color: "var(--ink-muted)" }}>
          네이버 지도는 미리보기 안에 검색 패널이 함께 표시되어, 새 창에서 여는 방식으로 제공합니다.
        </p>
      ) : null}
    </div>
  );
}

export function MapPreview({ provider, embedUrl, locationText, placeLink }: MapPreviewProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (provider === "naver") return;

    timerRef.current = setTimeout(() => {
      setStatus((prev) => (prev === "loading" ? "error" : prev));
    }, IFRAME_LOAD_TIMEOUT_MS);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [provider]);

  if (provider === "naver") {
    return <MapLinkCard locationText={locationText} placeLink={placeLink} />;
  }

  function handleLoad() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    setStatus("loaded");
  }

  function handleError() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    setStatus("error");
  }

  if (status === "error") {
    return <MapLinkCard locationText={locationText} placeLink={placeLink} compact />;
  }

  return (
    <div className="mt-2 w-full">
      <div
        className="relative w-full overflow-hidden rounded-xl border"
        style={{ aspectRatio: "4/3", minHeight: "240px", maxHeight: "320px", borderColor: "var(--line)" }}
      >
        {/* 로딩 중 placeholder */}
        {status === "loading" && (
          <div
            role="status"
            aria-live="polite"
            className="absolute inset-0 flex items-center justify-center text-sm"
            style={{ backgroundColor: "var(--surface-alt)", color: "var(--ink-soft)" }}
          >
            지도 로딩중...
          </div>
        )}
        <iframe
          src={embedUrl}
          title="지도 미리보기"
          className="absolute inset-0 h-full w-full"
          style={{ opacity: status === "loaded" ? 1 : 0 }}
          sandbox="allow-scripts allow-same-origin"
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
      <a
        href={placeLink}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-flex items-center gap-1 text-xs"
        style={{ color: "var(--ink-soft)" }}
      >
        지도에서 보기
        <span aria-hidden="true">↗</span>
      </a>
    </div>
  );
}
