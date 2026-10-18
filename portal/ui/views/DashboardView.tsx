"use client";

import Link from "next/link";
import { useState } from "react";
import { ALL_LESSONS, BADGES, MODULES, lessonHref, lessonKey } from "../../lib/content";
import { LEVELS, levelFor } from "../../lib/levels";
import { completedCount, isModuleComplete, nextLesson, useProgress } from "../../lib/progress";
import BadgeIcon from "../BadgeIcon";
import { ButtonLink, Kicker, Panel, ProgressBar, Stat, Title, btn } from "../primitives";

export default function DashboardView() {
  const p = useProgress();
  const lvl = levelFor(p.xp);
  const done = completedCount(p.lessons);
  const next = nextLesson(p.lessons);
  const earned = BADGES.filter((b) => p.badges[b.id]);
  const quizzes = Object.values(p.lessons).filter((l) => l.quizBest !== undefined);
  const quizTotal = quizzes.length * 4;
  const quizRight = quizzes.reduce((s, l) => s + (l.quizBest ?? 0), 0);
  const allModules = MODULES.every((m) => isModuleComplete(p.lessons, m.id));
  const [confirming, setConfirming] = useState(false);

  return (
    <Panel accent="#ffd27a" wide>
      <Kicker>Command center</Kicker>
      <Title>{p.name ? `Welcome back, ${p.name}` : "Your dashboard"}</Title>

      <label className="mt-4 block max-w-xs">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">Your name (for your certificate)</span>
        <input
          value={p.name}
          onChange={(e) => p.setName(e.target.value)}
          placeholder="First name"
          autoComplete="given-name"
          className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#ffd27a] focus:outline-none"
        />
        <span className="mt-1 block text-[11px] text-white/40">Saved only in this browser. First name only, please.</span>
      </label>

      {/* Level */}
      <div className="mt-6 rounded-2xl border border-[#ffd27a]/25 bg-[#ffd27a]/[0.05] p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#ffd27a]">Level {lvl.index + 1}</div>
            <div className="text-3xl font-semibold text-white">{lvl.name}</div>
          </div>
          <div className="text-right font-mono text-sm tabular-nums text-white/70">
            {p.xp} XP
            <span className="block text-xs text-white/45">{lvl.next ? `${lvl.toNext} XP to ${lvl.next.name}` : "Max level reached"}</span>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar value={lvl.progress} color="#ffd27a" label="Progress to next level" />
        </div>
        <ol className="mt-3 flex justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-white/40 sm:text-[10px]">
          {LEVELS.map((l, i) => (
            <li key={l.name} className={i <= lvl.index ? "text-[#ffd27a]" : ""}>
              {l.name}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Lessons" value={`${done}/${ALL_LESSONS.length}`} />
        <Stat label="Badges" value={`${earned.length}/${BADGES.length}`} />
        <Stat label="Streak" value={`${p.streak.count}`} sub={p.streak.count === 1 ? "day" : "days"} />
        <Stat label="Quiz accuracy" value={quizTotal ? `${Math.round((quizRight / quizTotal) * 100)}%` : "–"} />
      </div>

      {/* Next up */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">Next up</div>
          <div className="font-semibold text-white">
            {next ? `${next.module.place}: ${next.lesson.title}` : p.final.passed ? "Everything complete. The core is online!" : "Final challenge"}
          </div>
        </div>
        <ButtonLink href={next ? lessonHref(next.module.id, next.lesson.id) : "/final"}>{next ? "Continue →" : "Go →"}</ButtonLink>
      </div>

      {/* Modules */}
      <h2 className="mt-7 font-mono text-[11px] uppercase tracking-[0.22em] text-white/50">Modules</h2>
      <div className="mt-3 grid gap-3">
        {MODULES.map((m) => {
          const n = m.lessons.filter((l) => p.lessons[lessonKey(m.id, l.id)]?.complete).length;
          return (
            <div key={m.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-baseline justify-between">
                <Link href={`/modules/${m.id}`} className="font-semibold text-white hover:underline">
                  <span style={{ color: m.color }}>0{m.number}</span> {m.title}
                </Link>
                <span className="font-mono text-xs tabular-nums text-white/50">
                  {n}/{m.lessons.length}
                </span>
              </div>
              <div className="mt-2">
                <ProgressBar value={n / m.lessons.length} color={m.color} label={`${m.title} progress`} />
              </div>
              <ul className="mt-3 grid gap-1 sm:grid-cols-2">
                {m.lessons.map((l) => {
                  const c = !!p.lessons[lessonKey(m.id, l.id)]?.complete;
                  return (
                    <li key={l.id}>
                      <Link href={lessonHref(m.id, l.id)} className="flex items-center gap-2 text-sm text-white/70 hover:text-white">
                        <span
                          className="grid h-4 w-4 place-items-center rounded-full text-[9px]"
                          style={{ background: c ? m.color : "rgba(255,255,255,0.1)", color: "#05070d" }}
                          aria-hidden="true"
                        >
                          {c ? "✓" : ""}
                        </span>
                        {l.title}
                        <span className="sr-only">{c ? "(complete)" : "(not complete)"}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Final */}
      <div className="mt-4 rounded-xl border border-white/15 bg-gradient-to-br from-white/[0.06] to-transparent p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">Final challenge</div>
        <div className="mt-1 font-semibold text-white">
          {p.final.passed ? `Passed (${p.final.best}/10). Core online.` : allModules ? "All modules done. Power up the core!" : "Unlocks fully when all three modules are complete."}
        </div>
        <Link href="/final" className="mt-2 inline-block text-sm text-[#5ee7ff] hover:underline">
          {p.final.passed ? "View certificate →" : "Open the final challenge →"}
        </Link>
      </div>

      {/* Badges */}
      <div className="mt-7 flex items-baseline justify-between">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/50">Badges</h2>
        <Link href="/trophies" className="text-sm text-[#ffd27a] hover:underline">
          Trophy hall →
        </Link>
      </div>
      <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
        {BADGES.map((b) => (
          <li key={b.id} className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-2 text-center" title={b.description}>
            <BadgeIcon shape={b.shape} color={b.color} earned={!!p.badges[b.id]} size={34} />
            <span className={`text-[10px] leading-tight ${p.badges[b.id] ? "text-white" : "text-white/35"}`}>{b.name}</span>
          </li>
        ))}
      </ul>

      {/* Reset */}
      <div className="mt-8 border-t border-white/10 pt-4">
        {confirming ? (
          <div className="flex flex-wrap items-center gap-3 text-sm" role="alert">
            <span className="text-white/80">Erase all XP, badges and progress?</span>
            <button
              className={`${btn.ghost} border-[#ff6b8a]/50 text-[#ffc2cf]`}
              onClick={() => {
                p.reset();
                setConfirming(false);
              }}
            >
              Yes, reset
            </button>
            <button className={btn.quiet} onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button className={btn.quiet} onClick={() => setConfirming(true)}>
            Reset progress
          </button>
        )}
      </div>
    </Panel>
  );
}
