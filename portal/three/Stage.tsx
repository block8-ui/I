"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { type Lesson, type Module, type ModuleId, FINAL_QUESTIONS, getLesson } from "../lib/content";
import { useNav } from "../lib/nav";
import { useSession } from "../lib/session";
import { FINAL_DISTANCE, GAP_DIR, STAGE_OFFSET } from "../lib/world";
import Bias3D from "./interactives/Bias3D";
import Builder3D from "./interactives/Builder3D";
import Inspect3D from "./interactives/Inspect3D";
import { Label } from "./interactives/kit";
import Quiz3D from "./interactives/Quiz3D";
import Select3D from "./interactives/Select3D";
import Sequence3D from "./interactives/Sequence3D";
import Sort3D from "./interactives/Sort3D";
import Train3D from "./interactives/Train3D";
import Weights3D from "./interactives/Weights3D";

const pickAnswer = (i: number) => {
  const s = useSession.getState();
  const answers = [...s.quizAnswers];
  answers[s.quizIndex] = i;
  s.set({ quizAnswers: answers });
};

/** Dark holographic screen behind the challenge, so props behind it don't compete */
function Backdrop({ color }: { color: string }) {
  return (
    <group position={[0, 0.1, -0.7]}>
      <mesh>
        <planeGeometry args={[7.6, 6.3]} />
        <meshBasicMaterial color="#04070e" />
      </mesh>
      {[-1, 1].map((k) => (
        <mesh key={k} position={[0, k * 3.15, 0.01]}>
          <planeGeometry args={[7.6, 0.02]} />
          <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.7} />
        </mesh>
      ))}
      {[-1, 1].map((k) => (
        <mesh key={`c${k}`} position={[k * 3.8, 0, 0.01]}>
          <planeGeometry args={[0.02, 6.3]} />
          <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.25} />
        </mesh>
      ))}
    </group>
  );
}

/** Lesson title hologram shown while the student reads */
function LearnHolo({ module, lesson, number }: { module: Module; lesson: Lesson; number: number }) {
  const emblem = useRef<THREE.Group>(null);
  useFrame((s) => {
    emblem.current!.rotation.y = s.clock.elapsedTime * 0.4;
    emblem.current!.rotation.x = Math.sin(s.clock.elapsedTime * 0.3) * 0.3;
  });
  return (
    <group>
      <group ref={emblem} position={[0, 0.45, -0.3]}>
        <mesh>
          <icosahedronGeometry args={[1.25, 1]} />
          <meshBasicMaterial color={module.color} wireframe toneMapped={false} transparent opacity={0.55} />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial color={module.color} emissive={module.color} emissiveIntensity={1.2} flatShading />
        </mesh>
      </group>
      <Label size={0.15} color={module.color} position={[0, 2.35, 0]}>
        {`MODULE ${module.number}  ·  LESSON ${number}`}
      </Label>
      <Label size={0.42} position={[0, -1.4, 0.2]} maxWidth={5}>
        {lesson.title}
      </Label>
      <Label size={0.13} color="#9fb0cf" position={[0, -1.95, 0.2]} maxWidth={4.4}>
        {lesson.summary}
      </Label>
    </group>
  );
}

function LessonStage({ module, lesson, number }: { module: Module; lesson: Lesson; number: number }) {
  const step = useSession((s) => s.step);
  const quizIndex = useSession((s) => s.quizIndex);
  const answers = useSession((s) => s.quizAnswers);
  const revealed = useSession((s) => s.quizRevealed);
  const accent = module.color;
  const it = lesson.interactive;

  if (step === "learn") return <LearnHolo module={module} lesson={lesson} number={number} />;
  if (step === "check") {
    const q = lesson.quiz[Math.min(quizIndex, lesson.quiz.length - 1)];
    return (
      <Quiz3D
        question={q}
        index={quizIndex}
        total={lesson.quiz.length}
        picked={answers[quizIndex] ?? null}
        revealed={!!revealed[quizIndex]}
        accent={accent}
        onPick={pickAnswer}
      />
    );
  }
  switch (it.kind) {
    case "sort":
      return <Sort3D spec={it} accent={accent} />;
    case "select":
      return <Select3D spec={it} accent={accent} />;
    case "sequence":
      return <Sequence3D spec={it} accent={accent} />;
    case "train":
      return <Train3D />;
    case "weights":
      return <Weights3D accent={accent} />;
    case "bias":
      return <Bias3D />;
    case "builder":
      return <Builder3D spec={it} accent={accent} />;
    case "inspect":
      return <Inspect3D spec={it} accent={accent} />;
  }
}

/** Mounted inside each island (local +Z faces the camera); shows the open lesson */
export default function Stage({ moduleId }: { moduleId: ModuleId }) {
  const location = useNav((s) => s.location);
  const step = useSession((s) => s.step);
  const group = useRef<THREE.Group>(null);
  const appear = useRef(0);

  const found = location.kind === "lesson" && location.module === moduleId ? getLesson(moduleId, location.lesson) : undefined;

  useFrame((_, d) => {
    const g = group.current;
    if (!g) return;
    appear.current = THREE.MathUtils.damp(appear.current, found ? 1 : 0, 5, d);
    g.scale.setScalar(0.6 + appear.current * 0.4);
  });

  if (!found) return null;
  const number = found.module.lessons.indexOf(found.lesson) + 1;
  return (
    <group ref={group} position={STAGE_OFFSET} key={`${found.lesson.id}-${step}`}>
      <Backdrop color={found.module.color} />
      <LessonStage module={found.module} lesson={found.lesson} number={number} />
    </group>
  );
}

/** The final challenge floats in front of the core */
export function FinalStage() {
  const location = useNav((s) => s.location);
  const quizIndex = useSession((s) => s.quizIndex);
  const answers = useSession((s) => s.quizAnswers);
  const revealed = useSession((s) => s.quizRevealed);
  const lessonKey = useSession((s) => s.lessonKey);
  if (location.kind !== "final" || lessonKey !== "final" || quizIndex >= FINAL_QUESTIONS.length) return null;
  return (
    <group position={GAP_DIR.clone().multiplyScalar(FINAL_DISTANCE).setY(0.4)} rotation-y={Math.atan2(GAP_DIR.x, GAP_DIR.z)}>
      <Quiz3D
        question={FINAL_QUESTIONS[quizIndex]}
        index={quizIndex}
        total={FINAL_QUESTIONS.length}
        picked={answers[quizIndex] ?? null}
        revealed={!!revealed[quizIndex]}
        accent="#9fe8ff"
        onPick={pickAnswer}
      />
    </group>
  );
}
