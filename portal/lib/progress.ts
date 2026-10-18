"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ALL_LESSONS, BADGES, MODULES, lessonKey } from "./content";
import { emit } from "./events";
import { XP, levelFor } from "./levels";

/** Every place in the world; visiting all of them earns "Explorer" */
export const LOCATIONS = ["core", "dashboard", "lab", "workshop", "council", "trophies", "archive"] as const;
export type Location = (typeof LOCATIONS)[number];

export type LessonProgress = {
  learn?: boolean;
  try?: boolean;
  quizBest?: number;
  quizPerfect?: boolean;
  complete?: boolean;
};

type State = {
  name: string;
  xp: number;
  lessons: Record<string, LessonProgress>;
  badges: Record<string, number>;
  visited: string[];
  streak: { count: number; last: string | null };
  final: { best: number; passed: boolean };
};

type Actions = {
  setName: (name: string) => void;
  completeLearn: (key: string) => void;
  completeTry: (key: string, badge?: string) => void;
  submitQuiz: (key: string, correct: number, total: number) => void;
  submitFinal: (correct: number, total: number, passMark: number) => void;
  visit: (location: Location) => void;
  reset: () => void;
};

const initial: State = {
  name: "",
  xp: 0,
  lessons: {},
  badges: {},
  visited: [],
  streak: { count: 0, last: null },
  final: { best: 0, passed: false },
};

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const isModuleComplete = (lessons: State["lessons"], moduleId: string) =>
  MODULES.find((m) => m.id === moduleId)!.lessons.every((l) => lessons[lessonKey(moduleId, l.id)]?.complete);

export const completedCount = (lessons: State["lessons"]) =>
  ALL_LESSONS.filter(({ module, lesson }) => lessons[lessonKey(module.id, lesson.id)]?.complete).length;

/** Which badges the given state has earned (flag badges are awarded directly) */
function earnedBadges(s: State): string[] {
  const out: string[] = [];
  if (completedCount(s.lessons) >= 1) out.push("first-spark");
  if (isModuleComplete(s.lessons, "lab")) out.push("lab-graduate");
  if (isModuleComplete(s.lessons, "workshop")) out.push("toolsmith");
  if (isModuleComplete(s.lessons, "council")) out.push("guardian");
  if (Object.values(s.lessons).filter((l) => l.quizPerfect).length >= 3) out.push("perfectionist");
  if (s.streak.count >= 3) out.push("on-fire");
  if (LOCATIONS.every((l) => s.visited.includes(l))) out.push("explorer");
  if (s.final.passed) out.push("core-online");
  return out;
}

export const useProgress = create<State & Actions>()(
  persist(
    (set, get) => {
      /** Adds XP, announces it, and announces any level-up */
      const award = (amount: number, reason: string) => {
        if (amount <= 0) return;
        const before = levelFor(get().xp).index;
        set((s) => ({ xp: s.xp + amount }));
        emit({ type: "xp", amount, reason });
        const after = levelFor(get().xp);
        if (after.index > before) emit({ type: "level", index: after.index, name: after.name });
      };

      const grantBadge = (id: string) => {
        if (get().badges[id] || !BADGES.some((b) => b.id === id)) return;
        set((s) => ({ badges: { ...s.badges, [id]: Date.now() } }));
        emit({ type: "badge", id });
        award(XP.badge, "Badge");
      };

      const checkBadges = () => earnedBadges(get()).forEach(grantBadge);

      const patchLesson = (key: string, patch: Partial<LessonProgress>) =>
        set((s) => ({ lessons: { ...s.lessons, [key]: { ...s.lessons[key], ...patch } } }));

      /** Marks the lesson complete once learn, try and quiz are all done */
      const maybeComplete = (key: string) => {
        const l = get().lessons[key];
        if (!l || l.complete || !l.learn || !l.try || l.quizBest === undefined) return;
        patchLesson(key, { complete: true });
        award(XP.lessonComplete, "Lesson complete");

        // Streak: consecutive days with a completed lesson
        const today = dayKey(new Date());
        const yesterday = dayKey(new Date(Date.now() - 86_400_000));
        set((s) => {
          if (s.streak.last === today) return s;
          return { streak: { count: s.streak.last === yesterday ? s.streak.count + 1 : 1, last: today } };
        });

        const moduleId = key.split("/")[0];
        if (isModuleComplete(get().lessons, moduleId)) {
          emit({ type: "module", id: moduleId });
          award(XP.module, "Module complete");
        }
      };

      return {
        ...initial,

        setName: (name) => set({ name: name.slice(0, 40) }),

        completeLearn: (key) => {
          if (get().lessons[key]?.learn) return;
          patchLesson(key, { learn: true });
          award(XP.learn, "Lesson read");
          maybeComplete(key);
          checkBadges();
        },

        completeTry: (key, badge) => {
          if (badge) grantBadge(badge);
          if (get().lessons[key]?.try) return;
          patchLesson(key, { try: true });
          award(XP.try, "Challenge complete");
          maybeComplete(key);
          checkBadges();
        },

        submitQuiz: (key, correct, total) => {
          const prev = get().lessons[key] ?? {};
          const best = prev.quizBest ?? 0;
          // Only improvements earn XP, so retaking can't farm points
          award(Math.max(0, correct - best) * XP.quizCorrect, "Quiz");
          const perfect = correct === total;
          patchLesson(key, { quizBest: Math.max(best, correct), quizPerfect: prev.quizPerfect || perfect });
          if (perfect && !prev.quizPerfect) award(XP.quizPerfect, "Perfect quiz");
          maybeComplete(key);
          checkBadges();
        },

        submitFinal: (correct, total, passMark) => {
          const prev = get().final;
          award(Math.max(0, correct - prev.best) * XP.quizCorrect, "Final challenge");
          const passed = correct >= passMark;
          set({ final: { best: Math.max(prev.best, correct), passed: prev.passed || passed } });
          if (passed && !prev.passed) award(XP.finalPass, "Core online");
          checkBadges();
          void total;
        },

        visit: (location) => {
          if (get().visited.includes(location)) return;
          set((s) => ({ visited: [...s.visited, location] }));
          checkBadges();
        },

        reset: () => set({ ...initial }),
      };
    },
    {
      name: "neuralcore-progress-v1",
      storage: createJSONStorage(() => localStorage),
      // Rehydrated manually after mount so server and first client render match
      skipHydration: true,
      partialize: (s) => ({
        name: s.name,
        xp: s.xp,
        lessons: s.lessons,
        badges: s.badges,
        visited: s.visited,
        streak: s.streak,
        final: s.final,
      }),
    }
  )
);

/** Overall completion 0..1: lessons plus the final challenge */
export function overallProgress(s: Pick<State, "lessons" | "final">) {
  return (completedCount(s.lessons) + (s.final.passed ? 1 : 0)) / (ALL_LESSONS.length + 1);
}

/** The first lesson not yet complete, in course order */
export function nextLesson(lessons: State["lessons"]) {
  return ALL_LESSONS.find(({ module, lesson }) => !lessons[lessonKey(module.id, lesson.id)]?.complete);
}
