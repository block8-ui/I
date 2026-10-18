"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BADGES, MODULES } from "../lib/content";
import { subscribe } from "../lib/events";
import { levelFor } from "../lib/levels";
import { useProgress } from "../lib/progress";
import BadgeIcon from "./BadgeIcon";

const NAV = [
  { href: "/", label: "Core" },
  { href: "/dashboard", label: "Dashboard" },
  ...MODULES.map((m) => ({ href: `/modules/${m.id}`, label: m.place.replace("The ", ""), color: m.color })),
  { href: "/trophies", label: "Trophies" },
  { href: "/archive", label: "Archive" },
];

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);
}

/* ---------- XP meter ---------- */

export function XpMeter() {
  const xp = useProgress((s) => s.xp);
  const lvl = levelFor(xp);
  const [pulse, setPulse] = useState(0);
  useEffect(() => subscribe((e) => e.type === "xp" && setPulse((p) => p + 1)), []);
  const r = 17;
  const c = 2 * Math.PI * r;

  return (
    <Link
      href="/dashboard"
      className="group pointer-events-auto flex items-center gap-3 rounded-full border border-white/10 bg-[#070b14]/80 py-1.5 pl-1.5 pr-4 backdrop-blur-xl transition hover:border-white/25"
      aria-label={`Level ${lvl.index + 1}, ${lvl.name}, ${xp} XP. Open dashboard.`}
    >
      <span className="relative block h-10 w-10">
        <svg viewBox="0 0 40 40" className="h-10 w-10 -rotate-90">
          <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
          <circle
            cx="20"
            cy="20"
            r={r}
            fill="none"
            stroke="#ffd27a"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - lvl.progress)}
            className="transition-[stroke-dashoffset] duration-700"
            style={{ filter: "drop-shadow(0 0 4px #ffd27a)" }}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-sm font-semibold text-white">{lvl.index + 1}</span>
      </span>
      <span className="leading-tight">
        <span key={pulse} className="xp-pop block font-mono text-sm font-semibold tabular-nums text-[#ffd27a]">
          {xp} XP
        </span>
        <span className="block text-[11px] text-white/60">{lvl.name}</span>
      </span>
    </Link>
  );
}

/* ---------- Top bar ---------- */

export function TopBar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [prevPath, setPrevPath] = useState(path);
  if (path !== prevPath) {
    setPrevPath(path);
    setOpen(false);
  }

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-3 sm:p-5">
      <div className="pointer-events-auto flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2.5 rounded-full border border-white/10 bg-[#070b14]/80 py-2 pl-2 pr-4 backdrop-blur-xl">
          <span className="relative grid h-7 w-7 place-items-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-[#5ee7ff]/20 [animation-duration:3s]" />
            <span className="h-3 w-3 rounded-full bg-[#5ee7ff] shadow-[0_0_14px_#5ee7ff]" />
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.02em] text-white">
            Neural<span className="text-[#5ee7ff]">Core</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden rounded-full border border-white/10 bg-[#070b14]/80 p-1 backdrop-blur-xl lg:flex">
          {NAV.map((n) => {
            const active = isActive(path, n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3.5 py-1.5 text-[13px] transition ${active ? "bg-white text-[#05070d]" : "text-white/70 hover:text-white"}`}
              >
                {"color" in n && n.color && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: n.color }} />}
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="relative lg:hidden">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="rounded-full border border-white/10 bg-[#070b14]/80 px-4 py-2.5 text-sm text-white backdrop-blur-xl"
          >
            Menu
          </button>
          {open && (
            <nav id="mobile-nav" aria-label="Main" className="absolute left-0 top-12 grid w-52 gap-1 rounded-2xl border border-white/10 bg-[#070b14]/95 p-2 backdrop-blur-xl">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={isActive(path, n.href) ? "page" : undefined}
                  className={`rounded-xl px-3 py-2.5 text-sm ${isActive(path, n.href) ? "bg-white text-[#05070d]" : "text-white/80 hover:bg-white/10"}`}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
      <XpMeter />
    </header>
  );
}

/* ---------- Toasts ---------- */

type Toast = { id: number; kind: "xp" | "badge" | "level" | "module"; title: string; detail?: string; badge?: string };

export function Toasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  useEffect(
    () =>
      subscribe((e) => {
        const id = ++nextId.current;
        let t: Toast;
        if (e.type === "xp") t = { id, kind: "xp", title: `+${e.amount} XP`, detail: e.reason };
        else if (e.type === "badge") {
          const b = BADGES.find((x) => x.id === e.id)!;
          t = { id, kind: "badge", title: `Badge unlocked: ${b.name}`, detail: b.description, badge: b.id };
        } else if (e.type === "level") t = { id, kind: "level", title: `Level up! You're now ${e.name}`, detail: "A new ring forms around the core." };
        else {
          const m = MODULES.find((x) => x.id === e.id)!;
          t = { id, kind: "module", title: `${m.place} complete!`, detail: "Its bridge to the core is fully built." };
        }
        setToasts((ts) => [...ts.slice(-4), t]);
        setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), t.kind === "xp" ? 2600 : 5000);
      }),
    []
  );

  return (
    <div aria-live="polite" className="pointer-events-none fixed right-3 top-20 z-40 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col items-end gap-2 sm:right-5 sm:top-24">
      {toasts.map((t) => {
        const badge = t.badge ? BADGES.find((b) => b.id === t.badge) : undefined;
        if (t.kind === "xp")
          return (
            <div key={t.id} className="toast-in rounded-full border border-[#ffd27a]/30 bg-[#070b14]/90 px-4 py-2 font-mono text-sm text-[#ffd27a] backdrop-blur-xl">
              {t.title} <span className="text-white/50">· {t.detail}</span>
            </div>
          );
        return (
          <div
            key={t.id}
            className="toast-in flex w-full items-center gap-3 rounded-2xl border border-white/15 bg-[#070b14]/95 p-3.5 backdrop-blur-xl"
            style={{ boxShadow: `0 0 40px -10px ${badge?.color ?? "#ffd27a"}` }}
          >
            {badge ? (
              <span className="badge-reveal">
                <BadgeIcon shape={badge.shape} color={badge.color} earned size={44} />
              </span>
            ) : (
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#ffd27a]/15 text-xl text-[#ffd27a]">★</span>
            )}
            <span>
              <span className="block text-sm font-semibold text-white">{t.title}</span>
              {t.detail && <span className="block text-xs text-white/60">{t.detail}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Loader ---------- */

export function Loader({ ready }: { ready: boolean }) {
  const [count, setCount] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1500);
      const cap = ready ? 100 : 90;
      setCount((c) => Math.min(cap, Math.max(c + (ready ? 3 : 0), Math.round((1 - Math.pow(1 - t, 3)) * cap))));
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
      className={`fixed inset-0 z-50 grid place-items-center bg-[#04060c] transition-opacity duration-700 ${done ? "pointer-events-none opacity-0" : ""}`}
      role="status"
      aria-label="Loading the 3D world"
    >
      <div className="flex flex-col items-center gap-5">
        <span className="relative grid h-16 w-16 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#5ee7ff]/20" />
          <span className="h-6 w-6 rounded-full bg-[#5ee7ff] shadow-[0_0_30px_#5ee7ff]" />
        </span>
        <span className="text-xl font-semibold tracking-[-0.02em] text-white">
          Neural<span className="text-[#5ee7ff]">Core</span>
        </span>
        <span className="relative block h-px w-48 bg-white/15">
          <span className="absolute inset-y-0 left-0 bg-[#5ee7ff]" style={{ width: `${count}%` }} />
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/60 tabular-nums">
          Booting core {String(count).padStart(3, "0")}%
        </span>
      </div>
    </div>
  );
}
