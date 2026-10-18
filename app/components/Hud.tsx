"use client";

import { useEffect, useRef, useState } from "react";
import {
  CHAPTERS,
  PORTAL_AT,
  PROJECTS,
  activeProjectAt,
  range,
  smooth,
  store,
} from "../lib/store";
import Scramble from "./Scramble";

function scrollToProgress(p: number) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: p * max, behavior: reduce ? "auto" : "smooth" });
}

function useUtcClock() {
  const [time, setTime] = useState("--:--:--");
  useEffect(() => {
    const tick = () => setTime(new Date().toISOString().slice(11, 19));
    const id = setInterval(tick, 1000);
    const first = setTimeout(tick, 0);
    return () => {
      clearInterval(id);
      clearTimeout(first);
    };
  }, []);
  return time;
}

/** Thin corner brackets, the HUD's framing motif */
function Corners({ className = "" }: { className?: string }) {
  const c = "absolute h-2.5 w-2.5 border-white/60";
  return (
    <span aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`}>
      <span className={`${c} left-0 top-0 border-l border-t`} />
      <span className={`${c} right-0 top-0 border-r border-t`} />
      <span className={`${c} bottom-0 left-0 border-b border-l`} />
      <span className={`${c} bottom-0 right-0 border-b border-r`} />
    </span>
  );
}

function JoinForm() {
  const [sent, setSent] = useState(false);
  return (
    <form
      className="mt-8 flex max-w-md flex-wrap gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true); // TODO: POST to an API route / form service
      }}
    >
      <label className="sr-only" htmlFor="hud-email">
        Email address
      </label>
      <input
        id="hud-email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        className="min-w-0 flex-1 basis-56 border border-white/30 bg-white/5 px-4 py-3.5 font-mono text-sm text-white placeholder:text-white/40 backdrop-blur-md outline-none focus:border-white"
      />
      <button
        type="submit"
        className="relative bg-[#ffb36b] px-6 py-3.5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#05080d] transition-colors hover:bg-white"
      >
        Request access
      </button>
      <p role="status" className="basis-full font-mono text-xs uppercase tracking-[0.16em] text-[#ffcf9e]">
        {sent ? "You're on the list. We'll email you when the door opens." : ""}
      </p>
    </form>
  );
}

export default function Hud() {
  const [chapter, setChapter] = useState(0);
  const [project, setProject] = useState(-1);
  const percentRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const time = useUtcClock();

  useEffect(() => {
    let raf = 0;
    let lastChapter = -1;
    let lastProject = -2;
    const loop = () => {
      const p = store.current;
      const c = CHAPTERS.findIndex((ch) => p >= ch.start && p < ch.end);
      if (c !== -1 && c !== lastChapter) {
        lastChapter = c;
        setChapter(c);
      }
      const ap = activeProjectAt(p);
      if (ap !== lastProject) {
        lastProject = ap;
        setProject(ap);
      }
      if (percentRef.current) percentRef.current.textContent = String(Math.round(p * 100)).padStart(3, "0");
      if (barRef.current) barRef.current.style.transform = `scaleY(${p})`;
      if (hintRef.current) hintRef.current.style.opacity = String(1 - range(p, 0.01, 0.05));
      if (flashRef.current) {
        // Warm white-out that hides the jump from the door into the chamber
        const f = smooth(range(p, PORTAL_AT - 0.035, PORTAL_AT)) * (1 - smooth(range(p, PORTAL_AT, PORTAL_AT + 0.04)));
        flashRef.current.style.opacity = f.toFixed(3);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const current = CHAPTERS[chapter];

  return (
    <div className="pointer-events-none fixed inset-0 z-10 select-none text-white [text-shadow:0_1px_12px_rgba(3,8,14,0.35)]">
      {/* Small screens: shade the bottom so copy over the scene stays readable */}
      <div className="absolute inset-x-0 bottom-0 h-[60vh] bg-linear-to-t from-[#03060b]/60 to-transparent md:hidden" />
      <div ref={flashRef} className="absolute inset-0 bg-[#fff1df] opacity-0" />

      {/* Top bar */}
      <header className="pointer-events-auto absolute inset-x-0 top-0 flex items-start justify-between p-5 sm:p-8">
        <button onClick={() => scrollToProgress(0)} className="group text-left" aria-label="Floe, back to top">
          <span className="block font-sans text-2xl font-semibold tracking-[-0.04em]">FLOE</span>
          <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.22em] text-white/70">
            Arctic build studio
          </span>
        </button>
        <nav className="flex gap-1 font-mono text-[11px] uppercase tracking-[0.2em]">
          {[
            ["Manifesto", 0.2],
            ["Projects", 0.7],
            ["Join", 0.97],
          ].map(([label, p]) => (
            <button
              key={label}
              onClick={() => scrollToProgress(p as number)}
              className="relative hidden px-3 py-2 transition-colors hover:bg-white hover:text-[#05080d] hover:[text-shadow:none] sm:block"
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => scrollToProgress(0.97)}
            className="relative px-4 py-2 transition-colors hover:bg-white hover:text-[#05080d] hover:[text-shadow:none]"
          >
            <Corners />
            Enter
          </button>
        </nav>
      </header>

      {/* Chapter index rail */}
      <ol className="absolute left-5 top-1/2 hidden -translate-y-1/2 flex-col gap-3 font-mono text-[10px] tracking-[0.2em] sm:left-8 md:flex">
        {CHAPTERS.map((c, i) => (
          <li key={c.index} className="flex items-center gap-3">
            <span
              className={`block h-px transition-all duration-500 ${i === chapter ? "w-8 bg-white" : "w-3 bg-white/40"}`}
            />
            <span className={i === chapter ? "text-white" : "text-white/40"}>{c.index}</span>
          </li>
        ))}
      </ol>

      {/* Chapter copy */}
      <main className="absolute inset-x-5 bottom-28 sm:inset-x-8 md:bottom-auto md:left-24 md:top-[26vh] md:right-auto md:w-[min(34rem,42vw)]">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/80">
          <span className="text-[#ffcf9e]">[{current.index}]</span> <Scramble text={current.kicker} />
        </p>
        <h1
          key={current.title}
          className={`mt-4 font-sans font-semibold leading-[0.95] tracking-[-0.045em] ${
            chapter === 0 ? "text-[clamp(4.5rem,14vw,11rem)]" : "text-[clamp(2.4rem,5vw,4.4rem)]"
          }`}
        >
          <Scramble text={current.title} speed={1.1} />
        </h1>
        <p key={current.body} className="hud-fade mt-5 max-w-sm text-base leading-relaxed text-white/85 sm:text-lg">
          {current.body}
        </p>

        {chapter === 4 && (
          <ul className="mt-8 max-w-sm border-t border-white/20 font-mono text-xs uppercase tracking-[0.16em]">
            {PROJECTS.map((pr, i) => (
              <li
                key={pr.name}
                className={`flex items-center justify-between border-b border-white/20 py-3 transition-all duration-500 ${
                  i === project ? "pl-3 text-white" : "text-white/45"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`h-1.5 w-1.5 rotate-45 transition-all duration-500 ${
                      i === project ? "scale-150 bg-[#ff9a4d] shadow-[0_0_10px_#ff9a4d]" : "bg-white/40"
                    }`}
                  />
                  {pr.name}
                </span>
                <span className="hidden text-[10px] sm:inline">{pr.tag}</span>
              </li>
            ))}
          </ul>
        )}

        {chapter === 5 && (
          <div className="pointer-events-auto">
            <JoinForm />
          </div>
        )}
      </main>

      {/* Bottom-left telemetry */}
      <dl className="absolute bottom-5 left-5 hidden gap-6 font-mono text-[10px] uppercase tracking-[0.2em] text-white/75 sm:bottom-8 sm:left-8 sm:flex">
        <div>
          <dt className="text-white/45">Position</dt>
          <dd>78.2232° N / 15.6267° E</dd>
        </div>
        <div>
          <dt className="text-white/45">UTC</dt>
          <dd className="tabular-nums">{time}</dd>
        </div>
        <div>
          <dt className="text-white/45">Air</dt>
          <dd>{chapter >= 4 ? "+18°C" : "−24°C"}</dd>
        </div>
      </dl>

      {/* Bottom-right progress */}
      <div className="absolute bottom-5 right-5 flex items-end gap-4 sm:bottom-8 sm:right-8">
        <div className="text-right font-mono text-[10px] uppercase tracking-[0.2em] text-white/75">
          <div className="text-white/45">{chapter < 4 ? "Build" : "Explore"}</div>
          <div className="text-2xl tracking-normal text-white tabular-nums">
            <span ref={percentRef}>000</span>%
          </div>
        </div>
        <span className="relative block h-16 w-px overflow-hidden bg-white/25">
          <span ref={barRef} className="absolute inset-0 origin-top scale-y-0 bg-white" />
        </span>
      </div>

      {/* Scroll hint */}
      <div
        ref={hintRef}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-white/80 md:flex"
      >
        Scroll to build
        <span className="hud-scroll-line block h-10 w-px bg-white/70" />
      </div>
    </div>
  );
}
