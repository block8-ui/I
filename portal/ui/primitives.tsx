import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

/**
 * The glass panel all page content sits in. On landscape screens it docks
 * left (the 3D scene is framed to its right); on portrait screens it becomes
 * a bottom sheet (the scene is framed above it).
 */
export function Panel({ children, accent, wide = false }: { children: ReactNode; accent?: string; wide?: boolean }) {
  return (
    <section
      style={accent ? ({ "--accent": accent } as CSSProperties) : undefined}
      className={`portal-panel pointer-events-auto fixed inset-x-3 bottom-3 z-20 max-h-[54vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#070b14]/80 p-5 shadow-2xl shadow-black/50 backdrop-blur-xl landscape:inset-x-auto landscape:bottom-5 landscape:left-5 landscape:top-24 landscape:max-h-none sm:p-7 ${
        wide ? "landscape:w-[min(40rem,calc(100vw-2.5rem))]" : "landscape:w-[min(34rem,calc(100vw-2.5rem))]"
      }`}
    >
      {children}
    </section>
  );
}

export function Kicker({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--accent,#5ee7ff)] ${className}`}>{children}</p>
  );
}

export function Title({ children, as: As = "h1" }: { children: ReactNode; as?: "h1" | "h2" }) {
  return (
    <As
      id="page-title"
      tabIndex={-1}
      className="mt-2 text-[clamp(1.9rem,4vw,2.7rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white outline-none"
    >
      {children}
    </As>
  );
}

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40";

export const btn = {
  primary: `${btnBase} bg-[var(--accent,#5ee7ff)] text-[#05070d] hover:brightness-110 hover:-translate-y-px shadow-[0_0_24px_-6px_var(--accent,#5ee7ff)]`,
  ghost: `${btnBase} border border-white/15 bg-white/5 text-white hover:bg-white/10`,
  quiet: `${btnBase} px-3 text-white/70 hover:text-white`,
};

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: keyof typeof btn }) {
  return (
    <Link href={href} className={btn[variant]}>
      {children}
    </Link>
  );
}

export function ProgressBar({ value, color, label }: { value: number; color?: string; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
    >
      <div
        className="h-full rounded-full transition-[width] duration-700"
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color ?? "var(--accent,#5ee7ff)", boxShadow: `0 0 12px ${color ?? "var(--accent,#5ee7ff)"}` }}
      />
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-white">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-white/50">{sub}</div>}
    </div>
  );
}
