"use client";

import { useState } from "react";
import type { Question } from "../../lib/content";
import { useSession } from "../../lib/session";
import { btn } from "../primitives";

const LETTERS = ["A", "B", "C", "D"];

/**
 * Quiz controls. The 3D crystals and these buttons share the same session
 * state, so students can answer either way.
 */
export default function QuizPanel({
  questions,
  onFinish,
  renderResult,
}: {
  questions: Question[];
  onFinish: (correct: number) => void;
  renderResult: (correct: number, retake: () => void) => React.ReactNode;
}) {
  const index = useSession((s) => s.quizIndex);
  const answers = useSession((s) => s.quizAnswers);
  const revealed = useSession((s) => s.quizRevealed);
  const set = useSession((s) => s.set);
  const [finished, setFinished] = useState<number | null>(null);

  const retake = () => {
    set({ quizIndex: 0, quizAnswers: Array(questions.length).fill(null), quizRevealed: Array(questions.length).fill(false) });
    setFinished(null);
  };

  if (finished !== null) return <>{renderResult(finished, retake)}</>;

  const q = questions[index];
  const picked = answers[index] ?? null;
  const isRevealed = !!revealed[index];
  const correctSoFar = answers.filter((a, i) => revealed[i] && a === questions[i].answer).length;
  const last = index === questions.length - 1;

  return (
    <div>
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">
        <span>
          Question {index + 1} / {questions.length}
        </span>
        <span className="tabular-nums">{correctSoFar} correct</span>
      </div>
      <div className="mt-2 flex gap-1" aria-hidden="true">
        {questions.map((qq, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full ${
              revealed[i] ? (answers[i] === qq.answer ? "bg-[#7dffc4]" : "bg-[#ff6b8a]") : i === index ? "bg-white/60" : "bg-white/10"
            }`}
          />
        ))}
      </div>

      <fieldset className="mt-5">
        <legend className="text-lg font-semibold leading-snug text-white">{q.q}</legend>
        <div className="mt-4 grid gap-2">
          {q.options.map((opt, i) => {
            const isRight = isRevealed && i === q.answer;
            const isWrong = isRevealed && picked === i && i !== q.answer;
            return (
              <label
                key={i}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm transition ${
                  isRight
                    ? "border-[#7dffc4] bg-[#7dffc4]/10 text-white"
                    : isWrong
                      ? "border-[#ff6b8a] bg-[#ff6b8a]/10 text-white"
                      : picked === i
                        ? "border-[var(--accent)] bg-white/[0.07] text-white"
                        : "border-white/10 bg-white/[0.03] text-white/80 hover:border-white/25"
                } ${isRevealed ? "cursor-default" : ""}`}
              >
                <input
                  type="radio"
                  name={`q-${index}`}
                  className="sr-only"
                  checked={picked === i}
                  disabled={isRevealed}
                  onChange={() => {
                    const a = [...answers];
                    a[index] = i;
                    set({ quizAnswers: a });
                  }}
                />
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-md font-mono text-xs ${
                    picked === i ? "bg-[var(--accent)] text-[#05070d]" : "bg-white/10 text-white/70"
                  }`}
                >
                  {LETTERS[i]}
                </span>
                <span className="pt-0.5">{opt}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {isRevealed && (
        <p role="status" className={`mt-4 rounded-xl p-3.5 text-sm ${picked === q.answer ? "bg-[#7dffc4]/10 text-[#b8ffe1]" : "bg-[#ff6b8a]/10 text-[#ffc2cf]"}`}>
          <strong>{picked === q.answer ? "Correct. " : `Not quite. The answer is ${LETTERS[q.answer]}. `}</strong>
          {q.explain}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {!isRevealed ? (
          <button
            className={btn.primary}
            disabled={picked === null}
            onClick={() => {
              const r = [...revealed];
              r[index] = true;
              set({ quizRevealed: r });
            }}
          >
            Lock in answer
          </button>
        ) : last ? (
          <button
            className={btn.primary}
            onClick={() => {
              const correct = answers.filter((a, i) => a === questions[i].answer).length;
              setFinished(correct);
              onFinish(correct);
            }}
          >
            See results →
          </button>
        ) : (
          <button className={btn.primary} onClick={() => set({ quizIndex: index + 1 })}>
            Next question →
          </button>
        )}
      </div>
      <p className="mt-3 text-xs text-white/45">Tip: you can also click the crystals in the 3D scene to choose.</p>
    </div>
  );
}
