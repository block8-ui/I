"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { store } from "../lib/store";
import Hud from "./Hud";

// WebGL only exists in the browser
const Scene = dynamic(() => import("./scene/Scene"), { ssr: false });

/** Height of the scroll track that drives the whole sequence */
const TRACK_VH = 900;

function Loader({ ready }: { ready: boolean }) {
  const [count, setCount] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      // Ease towards 90% while the scene boots, then finish once it's live
      const t = Math.min(1, (now - start) / 1400);
      const cap = ready ? 100 : 90;
      setCount((c) => Math.min(cap, Math.max(c, Math.round((1 - Math.pow(1 - t, 3)) * cap))));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  const done = count >= 100;
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setGone(true), 900);
    return () => clearTimeout(id);
  }, [done]);

  if (gone) return null;
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#03060b] font-mono text-[11px] uppercase tracking-[0.3em] text-white/80 transition-opacity duration-700 ${
        done ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden={done}
    >
      <span className="font-sans text-3xl font-semibold normal-case tracking-[-0.04em] text-white">FLOE</span>
      <span className="relative block h-px w-40 bg-white/15">
        <span className="absolute inset-y-0 left-0 bg-white" style={{ width: `${count}%` }} />
      </span>
      <span className="tabular-nums">Cutting ice {String(count).padStart(3, "0")}%</span>
    </div>
  );
}

export default function Experience() {
  const [ready, setReady] = useState(false);
  const handleReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      store.target = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };
    const onPointer = (e: PointerEvent) => {
      store.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      store.pointerY = -((e.clientY / window.innerHeight) * 2 - 1);
    };

    // One damped value drives both the 3D scene and the HUD, so they stay in sync
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const diff = store.target - store.current;
      store.current = Math.abs(diff) < 1e-5 ? store.target : store.current + diff * (1 - Math.exp(-dt * 4.5));
      raf = requestAnimationFrame(loop);
    };

    onScroll();
    store.current = store.target;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("pointermove", onPointer);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-0">
        <Scene onReady={handleReady} />
      </div>
      <Hud />
      <Loader ready={ready} />
      <div aria-hidden="true" style={{ height: `${TRACK_VH}vh` }} />
    </>
  );
}
