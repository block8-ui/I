"use client";

import { useEffect, useState } from "react";
import type { Interactive, Lesson } from "../../lib/content";
import {
  NEURON_INPUTS,
  SCENARIOS,
  TRAIN_POINTS,
  TRAIN_TARGET,
  groupAccuracy,
  isBalanced,
  neuronFires,
  scenariosCorrect,
  testAccuracy,
} from "../../lib/engines";
import { useSession } from "../../lib/session";
import { builderScore } from "../../three/interactives/Builder3D";
import { btn } from "../primitives";

type Spec<K extends Interactive["kind"]> = Extract<Interactive, { kind: K }>;

/** Calls `onSolved` (with an optional badge) the moment a challenge is solved */
type Solved = (badge?: string) => void;

const chip = (on: boolean) =>
  `rounded-lg border px-3 py-2 text-xs font-medium transition ${
    on ? "border-[var(--accent)] bg-[var(--accent)] text-[#05070d]" : "border-white/15 bg-white/5 text-white/80 hover:border-white/30"
  }`;

/* ---------- Sort ---------- */

function SortControls({ spec, onSolved }: { spec: Spec<"sort">; onSolved: Solved }) {
  const sort = useSession((s) => s.sort);
  const wrong = useSession((s) => s.sortWrong);
  const attempts = useSession((s) => s.attempts);
  const set = useSession((s) => s.set);
  const placed = spec.items.filter((it) => sort[it.id]).length;
  // Explanations unlock once a check passes
  const [solved, setSolved] = useState(false);

  const check = () => {
    const bad = spec.items.filter((it) => sort[it.id] && sort[it.id] !== it.bin).map((it) => it.id);
    const next = { ...sort };
    bad.forEach((id) => (next[id] = null));
    const nextAttempts = attempts + 1;
    set({ sortWrong: bad, sort: next, attempts: nextAttempts });
    if (bad.length === 0 && placed === spec.items.length) {
      setSolved(true);
      onSolved(spec.skin === "holo" && nextAttempts === 1 ? "deepfake-detective" : undefined);
    }
  };

  return (
    <div>
      <ul className="grid gap-2">
        {spec.items.map((it) => {
          const at = sort[it.id] ?? null;
          const isWrong = wrong.includes(it.id);
          return (
            <li key={it.id} className={`rounded-xl border p-3 ${isWrong ? "border-[#ff6b8a]/60 bg-[#ff6b8a]/5" : "border-white/10 bg-white/[0.03]"}`}>
              <p className="text-sm text-white">{it.label}</p>
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={`Place: ${it.label}`}>
                {spec.bins.map((b) => (
                  <button
                    key={b.id}
                    className={chip(at === b.id)}
                    aria-pressed={at === b.id}
                    onClick={() => set({ sort: { ...sort, [it.id]: at === b.id ? null : b.id }, sortWrong: wrong.filter((x) => x !== it.id) })}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              {isWrong && <p className="mt-2 text-xs text-[#ffc2cf]">Not that one. It went back to the tray. Think again!</p>}
              {solved && <p className="mt-2 text-xs text-[#b8ffe1]">{it.explain}</p>}
            </li>
          );
        })}
      </ul>
      {!solved && (
        <div className="mt-4 flex items-center gap-3">
          <button className={btn.primary} disabled={placed < spec.items.length} onClick={check}>
            Check my sorting
          </button>
          <span className="font-mono text-xs text-white/50">
            {placed}/{spec.items.length} placed
          </span>
        </div>
      )}
    </div>
  );
}

/* ---------- Select (fact-check) ---------- */

function SelectControls({ spec, onSolved }: { spec: Spec<"select">; onSolved: Solved }) {
  const select = useSession((s) => s.select);
  const checked = useSession((s) => s.selectChecked);
  const attempts = useSession((s) => s.attempts);
  const set = useSession((s) => s.set);
  const allRight = spec.statements.every((st) => !!select[st.id] === st.isFalse);

  return (
    <div>
      <ul className="grid gap-2">
        {spec.statements.map((st) => {
          const on = !!select[st.id];
          const right = on === st.isFalse;
          return (
            <li key={st.id}>
              <label
                className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm ${
                  checked ? (right ? "border-[#7dffc4]/60 bg-[#7dffc4]/5" : "border-[#ff6b8a]/60 bg-[#ff6b8a]/5") : on ? "border-[#ff6b8a]/60 bg-white/[0.05]" : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-[#ff6b8a]"
                  checked={on}
                  onChange={() => set({ select: { ...select, [st.id]: !on }, selectChecked: false })}
                />
                <span>
                  <span className="text-white">{st.text}</span>
                  {checked && <span className={`mt-1 block text-xs ${right ? "text-[#b8ffe1]" : "text-[#ffc2cf]"}`}>{st.explain}</span>}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex items-center gap-3">
        <button
          className={btn.primary}
          onClick={() => {
            const n = attempts + 1;
            set({ selectChecked: true, attempts: n });
            if (allRight) onSolved(n === 1 ? "fact-checker" : undefined);
          }}
        >
          Scan for false claims
        </button>
        {checked && !allRight && <span className="text-xs text-[#ffc2cf]">Some targets are off. Adjust and scan again.</span>}
      </div>
    </div>
  );
}

/* ---------- Sequence (next word) ---------- */

function SequenceControls({ spec, onSolved }: { spec: Spec<"sequence">; onSolved: Solved }) {
  const round = useSession((s) => s.seqRound);
  const picks = useSession((s) => s.seqPicks);
  const set = useSession((s) => s.set);
  const r = spec.rounds[Math.min(round, spec.rounds.length - 1)];
  const picked = picks[round] ?? null;
  const done = picks.filter(Boolean).length >= spec.rounds.length;

  useEffect(() => {
    if (done) onSolved();
  }, [done, onSolved]);

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">
        Round {Math.min(round + 1, spec.rounds.length)} of {spec.rounds.length}
      </p>
      <p className="mt-2 text-xl font-semibold text-white">
        {r.context} <span className="text-[var(--accent)]">{picked ?? "___"}</span>
      </p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Pick the next word">
        {r.options.map((o) => (
          <button
            key={o.word}
            className={chip(picked === o.word)}
            disabled={!!picked}
            onClick={() => {
              const next = [...picks];
              next[round] = o.word;
              set({ seqPicks: next });
            }}
          >
            {o.word}
            {picked && <span className="ml-2 font-mono opacity-70">{Math.round(o.p * 100)}%</span>}
          </button>
        ))}
      </div>
      {picked && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3.5 text-sm text-white/80">
          {r.note}
          {round < spec.rounds.length - 1 && (
            <button className={`${btn.ghost} mt-3 w-full`} onClick={() => set({ seqRound: round + 1 })}>
              Next sentence →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Train ---------- */

function TrainControls({ onSolved }: { onSolved: Solved }) {
  const labels = useSession((s) => s.train);
  const set = useSession((s) => s.set);
  const acc = testAccuracy(labels);
  const allLabelled = TRAIN_POINTS.every((p) => labels[p.id]);
  const solved = allLabelled && acc >= TRAIN_TARGET;

  useEffect(() => {
    if (solved) onSolved();
  }, [solved, onSolved]);

  return (
    <div>
      <p className="text-sm text-white/70">
        Each &ldquo;photo&rdquo; below is a training example. Click a dot in 3D, or use the buttons here, to give it a
        label.
      </p>
      <ul className="mt-3 grid grid-cols-2 gap-2">
        {TRAIN_POINTS.map((p, i) => (
          <li key={p.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-white/50">#{i + 1}</span>
              <span className="text-2xl" role="img" aria-label={`Photo of a ${p.truth}`}>
                {p.truth === "cat" ? "🐱" : "🐶"}
              </span>
            </div>
            <div className="mt-1 font-mono text-[10px] text-white/45">
              ears {Math.round(p.ears * 100)} · size {Math.round(p.size * 100)}
            </div>
            <div className="mt-2 flex gap-1.5">
              {(["cat", "dog"] as const).map((k) => (
                <button
                  key={k}
                  className={`${chip(labels[p.id] === k)} flex-1 px-2 py-1.5`}
                  aria-pressed={labels[p.id] === k}
                  aria-label={`Label example ${i + 1} as ${k}`}
                  onClick={() => set({ train: { ...labels, [p.id]: labels[p.id] === k ? null : k } })}
                >
                  {k}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <p className={`mt-4 font-mono text-sm ${solved ? "text-[#7dffc4]" : "text-white/70"}`} role="status">
        Test accuracy: {Math.round(acc * 100)}% {solved ? "· trained!" : `· goal ${Math.round(TRAIN_TARGET * 100)}% with all 8 labelled`}
      </p>
    </div>
  );
}

/* ---------- Weights ---------- */

function WeightsControls({ onSolved }: { onSolved: Solved }) {
  const w = useSession((s) => s.weights);
  const scenario = useSession((s) => s.scenario);
  const set = useSession((s) => s.set);
  const correct = scenariosCorrect(w);
  const solved = correct === SCENARIOS.length;

  useEffect(() => {
    if (solved) onSolved();
  }, [solved, onSolved]);

  const names = [...NEURON_INPUTS.map((n) => `Weight: ${n}`), "Bias"];
  return (
    <div>
      <div className="grid gap-3">
        {names.map((n, i) => (
          <label key={n} className="block">
            <span className="flex justify-between text-sm text-white/80">
              {n} <span className="font-mono tabular-nums text-[var(--accent)]">{w[i].toFixed(1)}</span>
            </span>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.1}
              value={w[i]}
              onChange={(e) => {
                const next = [...w];
                next[i] = Number(e.target.value);
                set({ weights: next });
              }}
              className="mt-1 w-full accent-[var(--accent)]"
            />
          </label>
        ))}
      </div>
      <table className="mt-4 w-full text-left text-xs">
        <caption className="sr-only">Days, inputs and whether the neuron is right</caption>
        <thead className="font-mono uppercase tracking-[0.14em] text-white/45">
          <tr>
            <th className="py-1 font-normal">Day</th>
            <th className="py-1 font-normal">Inputs</th>
            <th className="py-1 font-normal">Should</th>
            <th className="py-1 font-normal">Neuron</th>
          </tr>
        </thead>
        <tbody>
          {SCENARIOS.map((s, i) => {
            const fires = neuronFires(w, s.inputs);
            const ok = fires === s.target;
            return (
              <tr
                key={s.id}
                onClick={() => set({ scenario: i })}
                className={`cursor-pointer border-t border-white/10 ${i === scenario ? "bg-white/[0.06]" : ""}`}
              >
                <td className="py-2 text-white">{s.name}</td>
                <td className="py-2 text-white/60">{s.desc}</td>
                <td className="py-2">{s.target ? "Yes" : "No"}</td>
                <td className={`py-2 font-semibold ${ok ? "text-[#7dffc4]" : "text-[#ff6b8a]"}`}>
                  {fires ? "Yes" : "No"} {ok ? "✓" : "✗"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className={`mt-3 font-mono text-sm ${solved ? "text-[#7dffc4]" : "text-white/70"}`} role="status">
        {correct}/4 days correct {solved ? "· you trained it by hand!" : "· hint: which input should matter most?"}
      </p>
    </div>
  );
}

/* ---------- Bias ---------- */

function BiasControls({ onSolved }: { onSolved: Solved }) {
  const share = useSession((s) => s.biasShare);
  const set = useSession((s) => s.set);
  const { a, b } = groupAccuracy(share);
  const balanced = isBalanced(share);

  useEffect(() => {
    if (balanced) onSolved("bias-buster");
  }, [balanced, onSolved]);

  return (
    <div>
      <label className="block">
        <span className="flex justify-between text-sm text-white/80">
          Training photos from Group A <span className="font-mono tabular-nums text-[var(--accent)]">{Math.round(share * 100)}%</span>
        </span>
        <input
          type="range"
          min={0.05}
          max={0.95}
          step={0.05}
          value={share}
          onChange={(e) => set({ biasShare: Number(e.target.value) })}
          className="mt-2 w-full accent-[var(--accent)]"
        />
      </label>
      <div className="mt-4 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#7fb2ff]">Group A accuracy</div>
          <div className="text-2xl font-semibold tabular-nums">{a}%</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#ff9a6b]">Group B accuracy</div>
          <div className="text-2xl font-semibold tabular-nums">{b}%</div>
        </div>
      </div>
      <p className={`mt-3 text-sm ${balanced ? "text-[#7dffc4]" : "text-[#ffc2cf]"}`} role="status">
        {balanced
          ? "Balanced! With a fairer training mix, the model works about equally well for both groups."
          : `Gap: ${Math.abs(a - b)} points. The model is much worse for the group it rarely saw.`}
      </p>
    </div>
  );
}

/* ---------- Builder ---------- */

function BuilderControls({ spec, onSolved }: { spec: Spec<"builder">; onSolved: Solved }) {
  const picks = useSession((s) => s.builder);
  const set = useSession((s) => s.set);
  const score = builderScore(spec, picks);
  const max = spec.slots.length * 2;
  const complete = spec.slots.every((s) => picks[s.id] != null);
  const strong = complete && score >= 6;

  useEffect(() => {
    if (strong) onSolved(score === max ? "prompt-master" : undefined);
  }, [strong, score, max, onSolved]);

  const prompt = spec.slots
    .map((s) => (picks[s.id] != null ? s.options[picks[s.id]!].text : ""))
    .filter((t) => t && !t.startsWith("("))
    .join(" ");

  return (
    <div>
      {spec.slots.map((slot) => (
        <fieldset key={slot.id} className="mb-4">
          <legend className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--accent)]">{slot.label}</legend>
          <div className="mt-2 grid gap-1.5">
            {slot.options.map((o, i) => (
              <label
                key={i}
                className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 text-sm ${
                  picks[slot.id] === i ? "border-[var(--accent)] bg-white/[0.06] text-white" : "border-white/10 bg-white/[0.02] text-white/75 hover:border-white/25"
                }`}
              >
                <input
                  type="radio"
                  name={slot.id}
                  checked={picks[slot.id] === i}
                  onChange={() => set({ builder: { ...picks, [slot.id]: i } })}
                  className="mt-1 accent-[var(--accent)]"
                />
                <span>
                  {o.text}
                  {picks[slot.id] === i && <span className="mt-1 block text-xs text-white/55">{o.feedback}</span>}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="rounded-xl border border-white/10 bg-black/30 p-3.5">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Your prompt</div>
        <p className="mt-1 text-sm text-white">{prompt || "Pick blocks to build your prompt…"}</p>
      </div>
      <p className={`mt-3 font-mono text-sm ${strong ? "text-[#7dffc4]" : "text-white/70"}`} role="status">
        Prompt strength {score}/{max} {score === max ? "· perfect prompt!" : strong ? "· strong! Can you make it perfect?" : "· aim for 6+"}
      </p>
    </div>
  );
}

/* ---------- Inspect ---------- */

function InspectControls({ spec, onSolved }: { spec: Spec<"inspect">; onSolved: Solved }) {
  const inspecting = useSession((s) => s.inspecting);
  const inspected = useSession((s) => s.inspected);
  const set = useSession((s) => s.set);
  const count = spec.tools.filter((t) => inspected[t.id]).length;
  const all = count === spec.tools.length;
  const tool = spec.tools.find((t) => t.id === inspecting);

  useEffect(() => {
    if (all) onSolved();
  }, [all, onSolved]);

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Inspect a tool">
        {spec.tools.map((t) => (
          <button
            key={t.id}
            className={chip(inspecting === t.id)}
            aria-pressed={inspecting === t.id}
            onClick={() => set({ inspecting: t.id, inspected: { ...inspected, [t.id]: true } })}
          >
            {inspected[t.id] ? "✓ " : ""}
            {t.name}
          </button>
        ))}
      </div>
      {tool ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4" aria-live="polite">
          <h3 className="text-lg font-semibold text-white">{tool.name}</h3>
          <p className="font-mono text-[11px] text-white/45">e.g. {tool.examples}</p>
          <p className="mt-3 text-sm">
            <strong className="text-[#7dffc4]">Good at: </strong>
            <span className="text-white/80">{tool.goodAt}</span>
          </p>
          <p className="mt-2 text-sm">
            <strong className="text-[#ffb3c3]">Watch out: </strong>
            <span className="text-white/80">{tool.watchOut}</span>
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-white/60">Click a hologram in the 3D workshop, or a button above.</p>
      )}
      <p className="mt-3 font-mono text-sm text-white/70" role="status">
        {count}/{spec.tools.length} inspected
      </p>
    </div>
  );
}

export default function TryControls({ lesson, onSolved }: { lesson: Lesson; onSolved: Solved }) {
  const it = lesson.interactive;
  switch (it.kind) {
    case "sort":
      return <SortControls spec={it} onSolved={onSolved} />;
    case "select":
      return <SelectControls spec={it} onSolved={onSolved} />;
    case "sequence":
      return <SequenceControls spec={it} onSolved={onSolved} />;
    case "train":
      return <TrainControls onSolved={onSolved} />;
    case "weights":
      return <WeightsControls onSolved={onSolved} />;
    case "bias":
      return <BiasControls onSolved={onSolved} />;
    case "builder":
      return <BuilderControls spec={it} onSolved={onSolved} />;
    case "inspect":
      return <InspectControls spec={it} onSolved={onSolved} />;
  }
}
