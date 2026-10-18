"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { type Block, getLesson, lessonHref, lessonKey } from "../../lib/content";
import { XP } from "../../lib/levels";
import { useProgress } from "../../lib/progress";
import { type Step, useSession } from "../../lib/session";
import { ButtonLink, Kicker, Panel, Title, btn } from "../primitives";
import QuizPanel from "./QuizPanel";
import TryControls from "./TryControls";

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-white/80">
      {blocks.map((b, i) => {
        switch (b.t) {
          case "p":
            return <p key={i}>{b.text}</p>;
          case "h":
            return (
              <h3 key={i} className="pt-2 text-lg font-semibold text-white">
                {b.text}
              </h3>
            );
          case "list":
            return (
              <ul key={i} className="space-y-2">
                {b.items.map((item, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-[var(--accent)]" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );
          case "callout":
            return (
              <aside key={i} className="rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/[0.07] p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--accent)]">{b.title}</p>
                <p className="mt-1.5 text-white/90">{b.text}</p>
              </aside>
            );
        }
      })}
    </div>
  );
}

/** One stable "challenge solved" handler per lesson, so effects that call it don't re-run */
const solvers = new Map<string, (badge?: string) => void>();
function solverFor(key: string) {
  if (!solvers.has(key)) solvers.set(key, (badge?: string) => useProgress.getState().completeTry(key, badge));
  return solvers.get(key)!;
}

const STEPS: { id: Step; label: string }[] = [
  { id: "learn", label: "Learn" },
  { id: "try", label: "Try" },
  { id: "check", label: "Check" },
];

export default function LessonView({ moduleId, lessonId }: { moduleId: string; lessonId: string }) {
  const key = lessonKey(moduleId, lessonId);
  const { module, lesson } = getLesson(moduleId, lessonId)!;
  const index = module.lessons.indexOf(lesson);
  const prev = module.lessons[index - 1];
  const next = module.lessons[index + 1];

  const progress = useProgress((s) => s.lessons[key]) ?? {};
  const step = useSession((s) => s.step);
  const setStep = useSession((s) => s.setStep);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    useSession.getState().begin(key, lesson.quiz.length);
  }, [key, lesson.quiz.length]);

  const go = (s: Step) => {
    setStep(s);
    top.current?.closest(".portal-panel")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSolved = solverFor(key);

  const done = { learn: !!progress.learn, try: !!progress.try, check: progress.quizBest !== undefined };

  return (
    <Panel accent={module.color}>
      <div ref={top} />
      <Kicker>
        <Link href={`/modules/${module.id}`} className="hover:underline">
          {module.place}
        </Link>{" "}
        · Lesson {index + 1} of {module.lessons.length}
      </Kicker>
      <Title>{lesson.title}</Title>

      {/* Step tabs */}
      <div role="tablist" aria-label="Lesson steps" className="mt-5 grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-black/20 p-1">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={step === s.id}
            aria-controls="lesson-step"
            onClick={() => go(s.id)}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm transition ${
              step === s.id ? "bg-white text-[#05070d]" : "text-white/70 hover:text-white"
            }`}
          >
            <span
              className={`grid h-5 w-5 place-items-center rounded-full font-mono text-[10px] ${
                done[s.id] ? "bg-[var(--accent)] text-[#05070d]" : step === s.id ? "bg-black/10" : "bg-white/10"
              }`}
              aria-hidden="true"
            >
              {done[s.id] ? "✓" : i + 1}
            </span>
            {s.label}
            {done[s.id] && <span className="sr-only">(done)</span>}
          </button>
        ))}
      </div>

      <div id="lesson-step" role="tabpanel" className="mt-6">
        {step === "learn" && (
          <>
            <Blocks blocks={lesson.learn} />
            <button
              className={`${btn.primary} mt-6 w-full`}
              onClick={() => {
                useProgress.getState().completeLearn(key);
                go("try");
              }}
            >
              {done.learn ? "Go to the challenge →" : `I've read this · +${XP.learn} XP →`}
            </button>
          </>
        )}

        {step === "try" && (
          <>
            <p className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] p-3.5 text-sm leading-relaxed text-white/85">
              {lesson.interactive.prompt}
            </p>
            <TryControls lesson={lesson} onSolved={onSolved} />
            {done.try && (
              <div className="mt-5 rounded-xl border border-[#7dffc4]/40 bg-[#7dffc4]/[0.07] p-4" role="status">
                <p className="font-semibold text-[#b8ffe1]">Challenge complete!</p>
                <button className={`${btn.primary} mt-3 w-full`} onClick={() => go("check")}>
                  Check your knowledge →
                </button>
              </div>
            )}
          </>
        )}

        {step === "check" && (
          <QuizPanel
            key={key}
            questions={lesson.quiz}
            onFinish={(correct) => useProgress.getState().submitQuiz(key, correct, lesson.quiz.length)}
            renderResult={(correct, retake) => (
              <div className="text-center">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">Quiz complete</p>
                <p className="mt-2 text-5xl font-semibold tabular-nums text-white">
                  {correct}/{lesson.quiz.length}
                </p>
                <p className="mt-2 text-sm text-white/70">
                  {correct === lesson.quiz.length
                    ? "Perfect score!"
                    : "Nice work. Retake it any time. Only improvements earn more XP."}
                </p>
                {!(done.learn && done.try) && (
                  <p className="mt-3 text-sm text-[#ffd27a]">
                    Finish {!done.learn ? "Learn" : ""}
                    {!done.learn && !done.try ? " and " : ""}
                    {!done.try ? "Try" : ""} to complete this lesson.
                  </p>
                )}
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <button className={btn.ghost} onClick={retake}>
                    Retake quiz
                  </button>
                  {next ? (
                    <ButtonLink href={lessonHref(module.id, next.id)}>Next lesson →</ButtonLink>
                  ) : (
                    <ButtonLink href={`/modules/${module.id}`}>Back to {module.place} →</ButtonLink>
                  )}
                </div>
              </div>
            )}
          />
        )}
      </div>

      <nav aria-label="Lessons" className="mt-8 flex justify-between gap-3 border-t border-white/10 pt-4 text-sm">
        {prev ? (
          <Link href={lessonHref(module.id, prev.id)} className="text-white/60 hover:text-white">
            ← {prev.title}
          </Link>
        ) : (
          <Link href={`/modules/${module.id}`} className="text-white/60 hover:text-white">
            ← {module.place}
          </Link>
        )}
        {next && (
          <Link href={lessonHref(module.id, next.id)} className="text-right text-white/60 hover:text-white">
            {next.title} →
          </Link>
        )}
      </nav>
    </Panel>
  );
}
