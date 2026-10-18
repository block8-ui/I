"use client";

import Link from "next/link";
import { getModule, lessonHref, lessonKey } from "../../lib/content";
import { useProgress } from "../../lib/progress";
import { ButtonLink, Kicker, Panel, ProgressBar, Title } from "../primitives";

export default function ModuleView({ moduleId }: { moduleId: string }) {
  const mod = getModule(moduleId)!;
  const lessons = useProgress((s) => s.lessons);
  const status = mod.lessons.map((l) => lessons[lessonKey(mod.id, l.id)] ?? {});
  const done = status.filter((s) => s.complete).length;
  const nextIndex = status.findIndex((s) => !s.complete);
  const next = mod.lessons[nextIndex === -1 ? 0 : nextIndex];

  return (
    <Panel accent={mod.color}>
      <Kicker>
        Module {mod.number} · {mod.place}
      </Kicker>
      <Title>{mod.title}</Title>
      <p className="mt-3 text-[15px] leading-relaxed text-white/75">{mod.tagline}</p>

      <div className="mt-5 flex items-center gap-4">
        <div className="flex-1">
          <ProgressBar value={done / mod.lessons.length} label={`${mod.title} progress`} />
        </div>
        <span className="font-mono text-xs tabular-nums text-white/60">
          {done}/{mod.lessons.length} lessons
        </span>
      </div>

      <ol className="mt-6 grid gap-2.5">
        {mod.lessons.map((l, i) => {
          const s = status[i];
          const state = s.complete ? "Complete" : s.learn || s.try || s.quizBest !== undefined ? "In progress" : "New";
          return (
            <li key={l.id}>
              <Link
                href={lessonHref(mod.id, l.id)}
                className="group flex gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-[var(--accent)]/50 hover:bg-white/[0.06]"
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border font-mono text-sm ${
                    s.complete ? "border-transparent bg-[var(--accent)] text-[#05070d]" : "border-white/20 text-white/70"
                  }`}
                  aria-hidden="true"
                >
                  {s.complete ? "✓" : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="font-semibold text-white">{l.title}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
                      {state} · {l.minutes} min
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-white/60">{l.summary}</span>
                  <span className="mt-2 flex gap-1.5" aria-label={`Learn ${s.learn ? "done" : "to do"}, try ${s.try ? "done" : "to do"}, check ${s.quizBest !== undefined ? "done" : "to do"}`}>
                    {[s.learn, s.try, s.quizBest !== undefined].map((ok, k) => (
                      <span key={k} className={`h-1 w-8 rounded-full ${ok ? "bg-[var(--accent)]" : "bg-white/10"}`} />
                    ))}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href={lessonHref(mod.id, next.id)}>{done === 0 ? "Start module" : done === mod.lessons.length ? "Review lessons" : "Continue"} →</ButtonLink>
        <ButtonLink href="/" variant="ghost">
          Back to the core
        </ButtonLink>
      </div>
    </Panel>
  );
}
