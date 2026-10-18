"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { runtime, useNav } from "../lib/nav";
import { type Location as Place, useProgress } from "../lib/progress";
import { locationFromPath } from "../lib/world";
import { Loader, Toasts, TopBar } from "./Chrome";

// WebGL only exists in the browser
const PortalCanvas = dynamic(() => import("../three/PortalCanvas"), { ssr: false });

function placeFor(path: string): Place | null {
  const l = locationFromPath(path);
  if (l.kind === "lesson") return l.module;
  if (l.kind === "island") return l.module;
  if (l.kind === "final") return null;
  return l.kind;
}

/** Persistent frame around every portal page: the 3D world, chrome and loader */
export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [ready, setReady] = useState(false);
  const handleReady = useCallback(() => setReady(true), []);

  // Restore saved progress after the first render, so server and client markup match
  useEffect(() => {
    void useProgress.persist.rehydrate();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      runtime.reducedMotion = mq.matches;
    };
    apply();
    mq.addEventListener("change", apply);
    const onPointer = (e: PointerEvent) => {
      useNav.setState({ pointer: { x: (e.clientX / innerWidth) * 2 - 1, y: -((e.clientY / innerHeight) * 2 - 1) } });
    };
    window.addEventListener("pointermove", onPointer);
    return () => {
      mq.removeEventListener("change", apply);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  // Fly the camera on every navigation, track visits, move focus to the new heading
  useEffect(() => {
    useNav.getState().setPath(path);
    const place = placeFor(path);
    const visit = () => {
      if (place) useProgress.getState().visit(place);
    };
    if (useProgress.persist.hasHydrated()) visit();
    else return useProgress.persist.onFinishHydration(visit);
  }, [path]);

  useEffect(() => {
    const id = requestAnimationFrame(() => document.getElementById("page-title")?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, [path]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#04060c] text-white">
      <a
        href="#page-title"
        className="sr-only z-[60] rounded-lg bg-white px-4 py-2 text-[#05070d] focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>
      <div className="absolute inset-0 touch-none">
        <PortalCanvas onReady={handleReady} />
      </div>
      <TopBar />
      <main className="pointer-events-none">{children}</main>
      <Toasts />
      <Loader ready={ready} />
    </div>
  );
}
