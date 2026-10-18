"use client";

import { create } from "zustand";
import type { Animal } from "./engines";

export type Step = "learn" | "try" | "check";

/**
 * Live (unsaved) state for the lesson on screen. The 3D challenge and the
 * on-screen controls both read and write it, so either can be used.
 */
type Session = {
  lessonKey: string | null;
  step: Step;

  sort: Record<string, string | null>;
  sortWrong: string[];
  attempts: number;

  select: Record<string, boolean>;
  selectChecked: boolean;

  seqRound: number;
  seqPicks: (string | null)[];

  train: Record<string, Animal | null>;
  weights: number[];
  scenario: number;
  biasShare: number;
  builder: Record<string, number | null>;
  inspected: Record<string, boolean>;
  inspecting: string | null;

  quizIndex: number;
  quizAnswers: (number | null)[];
  quizRevealed: boolean[];

  selectedBadge: string | null;

  begin: (lessonKey: string, quizLength: number) => void;
  setStep: (step: Step) => void;
  set: (patch: Partial<Session>) => void;
};

const fresh = (quizLength: number) => ({
  step: "learn" as Step,
  sort: {},
  sortWrong: [],
  attempts: 0,
  select: {},
  selectChecked: false,
  seqRound: 0,
  seqPicks: [],
  train: {},
  weights: [0, 0, 0, 0],
  scenario: 0,
  biasShare: 0.9,
  builder: {},
  inspected: {},
  inspecting: null,
  quizIndex: 0,
  quizAnswers: Array(quizLength).fill(null),
  quizRevealed: Array(quizLength).fill(false),
});

export const useSession = create<Session>()((set, get) => ({
  lessonKey: null,
  ...fresh(0),
  selectedBadge: null,
  begin: (lessonKey, quizLength) => {
    if (get().lessonKey === lessonKey) return;
    set({ lessonKey, ...fresh(quizLength) });
  },
  setStep: (step) => set({ step }),
  set: (patch) => set(patch),
}));
