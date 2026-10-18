"use client";

import Link from "next/link";
import { MODULES, lessonHref, lessonKey } from "../../lib/content";
import { completedCount, nextLesson, useProgress } from "../../lib/progress";
import { ButtonLink, Kicker, Panel, ProgressBar, Title } from "../primitives";

export default function HomeView() {
  const lessons = useProgress((s) => s.lessons);
  const done = completedCount(lessons);
  const next = nextLesson(lessons);
  const started = done > 0 || Object.keys(lessons).length > 0;

  return (
    <Panel accent="#5ee7ff">
      <Kicker>AI learning portal · Grades 9–12</Kicker>
      <Title>Learn how AI really works. Then power up the core.</Title>
      <p className="mt-4 text-[15px] leading-relaxed text-white/75">
        The glowing network behind this panel is your <strong className="text-white">Neural Core</strong>. Every lesson
        you finish lights up part of it. Fly to three islands to learn how AI works, how to use it well, and how to use
        it responsibly. Earn XP and badges as you go.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href={next ? lessonHref(next.module.id, next.lesson.id) : "/final"}>
          {!started ? "Start learning" : next ? "Continue" : "Final challenge"} →
        </ButtonLink>
        <ButtonLink href="/dashboard" variant="ghost">
          My dashboard
        </ButtonLink>
      </div>

      <h2 className="mt-8 font-mono text-[11px] uppercase tracking-[0.22em] text-white/50">The three islands</h2>
      <ul className="mt-3 grid gap-2.5">
        {MODULES.map((m) => {
          const n = m.lessons.filter((l) => lessons[lessonKey(m.id, l.id)]?.complete).length;
          return (
            <li key={m.id}>
              <Link
                href={`/modules/${m.id}`}
                className="group block rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/25 hover:bg-white/[0.06]"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: m.color }}>
                    0{m.number} · {m.place}
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-white/50">
                    {n}/{m.lessons.length}
                  </span>
                </div>
                <div className="mt-1 font-semibold text-white">
                  {m.title} <span className="inline-block transition group-hover:translate-x-1">→</span>
                </div>
                <div className="mt-0.5 text-sm text-white/60">{m.tagline}</div>
                <div className="mt-3">
                  <ProgressBar value={n / m.lessons.length} color={m.color} label={`${m.title} progress`} />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-8 font-mono text-[11px] uppercase tracking-[0.22em] text-white/50">How it works</h2>
      <ol className="mt-3 grid gap-2 text-sm text-white/70 sm:grid-cols-3">
        {[
          ["Learn", "Short readings with the key ideas."],
          ["Try", "A hands-on 3D challenge for every lesson."],
          ["Check", "A quick quiz. Answer by clicking crystals."],
        ].map(([t, d], i) => (
          <li key={t} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <span className="font-mono text-[11px] text-[#5ee7ff]">0{i + 1}</span>
            <span className="ml-2 font-semibold text-white">{t}</span>
            <span className="mt-1 block text-xs leading-relaxed">{d}</span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
