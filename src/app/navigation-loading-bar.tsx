"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const NAVIGATION_LOADING_EVENT = "saturday-meetup:navigation-loading-start";

export function notifyNavigationLoadingStart(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NAVIGATION_LOADING_EVENT));
}

export function NavigationLoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchText = searchParams.toString();
  const [active, setActive] = useState(false);

  useEffect(() => {
    function handleStart() {
      setActive(true);
    }

    window.addEventListener(NAVIGATION_LOADING_EVENT, handleStart);
    return () => window.removeEventListener(NAVIGATION_LOADING_EVENT, handleStart);
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => setActive(false));
    return () => window.cancelAnimationFrame(frameId);
  }, [pathname, searchText]);

  useEffect(() => {
    if (!active) return;

    const timeoutId = window.setTimeout(() => setActive(false), 8000);
    return () => window.clearTimeout(timeoutId);
  }, [active]);

  if (!active) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[80] h-1 overflow-hidden bg-transparent"
      role="progressbar"
      aria-label="조회 중"
      aria-busy="true"
    >
      <div className="route-loading-bar h-full rounded-r-full" />
    </div>
  );
}
