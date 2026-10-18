/**
 * The maths behind the hands-on challenges. Pure functions, shared by the
 * 3D scenes and the on-screen controls so both always agree.
 */
import { mulberry32 } from "./random";

/* ---------- Train: nearest-centroid cat/dog classifier ---------- */

export type Animal = "cat" | "dog";
export type Point = { id: string; ears: number; size: number; truth: Animal };

function gauss(rand: () => number) {
  // Box–Muller
  const u = Math.max(1e-6, rand());
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function makePoints(seed: number, count: number, prefix: string): Point[] {
  const rand = mulberry32(seed);
  const clamp = (x: number) => Math.min(0.97, Math.max(0.03, x));
  return Array.from({ length: count }, (_, i) => {
    const truth: Animal = i % 2 === 0 ? "cat" : "dog";
    // Cats: pointier ears, smaller. Dogs: rounder/floppier ears, bigger. Some overlap.
    const c = truth === "cat" ? { e: 0.74, s: 0.3 } : { e: 0.34, s: 0.66 };
    return {
      id: `${prefix}${i + 1}`,
      ears: clamp(c.e + gauss(rand) * 0.12),
      size: clamp(c.s + gauss(rand) * 0.12),
      truth,
    };
  });
}

export const TRAIN_POINTS = makePoints(42, 8, "T");
export const TEST_POINTS = makePoints(7, 16, "X");
export const TRAIN_TARGET = 0.9;

export type Labels = Record<string, Animal | null>;

export function centroids(labels: Labels) {
  const acc: Record<Animal, { e: number; s: number; n: number }> = {
    cat: { e: 0, s: 0, n: 0 },
    dog: { e: 0, s: 0, n: 0 },
  };
  for (const p of TRAIN_POINTS) {
    const l = labels[p.id];
    if (!l) continue;
    acc[l].e += p.ears;
    acc[l].s += p.size;
    acc[l].n++;
  }
  const out: Partial<Record<Animal, { ears: number; size: number }>> = {};
  (["cat", "dog"] as const).forEach((k) => {
    if (acc[k].n) out[k] = { ears: acc[k].e / acc[k].n, size: acc[k].s / acc[k].n };
  });
  return out;
}

export function predict(labels: Labels, p: { ears: number; size: number }): Animal | null {
  const c = centroids(labels);
  if (!c.cat && !c.dog) return null;
  if (!c.cat) return "dog";
  if (!c.dog) return "cat";
  const d = (q: { ears: number; size: number }) => (q.ears - p.ears) ** 2 + (q.size - p.size) ** 2;
  return d(c.cat) <= d(c.dog) ? "cat" : "dog";
}

export function testAccuracy(labels: Labels) {
  const hits = TEST_POINTS.filter((p) => predict(labels, p) === p.truth).length;
  return hits / TEST_POINTS.length;
}

/* ---------- Weights: one neuron deciding "bring an umbrella?" ---------- */

export const NEURON_INPUTS = ["Dark clouds", "Rain forecast", "Sunny now"];

export const SCENARIOS = [
  { id: "A", name: "Monday", inputs: [1, 1, 0], target: true, desc: "Dark clouds and rain is forecast" },
  { id: "B", name: "Tuesday", inputs: [0, 0, 1], target: false, desc: "Sunny, no rain forecast" },
  { id: "C", name: "Wednesday", inputs: [0, 1, 1], target: true, desc: "Sunny now, but rain forecast later" },
  { id: "D", name: "Thursday", inputs: [0, 0, 0], target: false, desc: "Grey but dry, no rain forecast" },
];

/** weights = [w1, w2, w3, bias] */
export const neuronSum = (w: number[], inputs: number[]) =>
  inputs.reduce((sum, x, i) => sum + x * w[i], 0) + w[3];

export const neuronFires = (w: number[], inputs: number[]) => neuronSum(w, inputs) > 0;

export const scenariosCorrect = (w: number[]) =>
  SCENARIOS.filter((s) => neuronFires(w, s.inputs) === s.target).length;

/* ---------- Bias: training mix vs. per-group accuracy ---------- */

/** share = fraction of training photos from Group A */
export function groupAccuracy(share: number) {
  const acc = (x: number) => Math.round(60 + 37 * Math.sqrt(Math.max(0, x)));
  return { a: acc(share), b: acc(1 - share) };
}

export const isBalanced = (share: number) => {
  const { a, b } = groupAccuracy(share);
  return Math.abs(a - b) <= 5;
};
