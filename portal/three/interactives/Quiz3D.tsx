"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { Question } from "../../lib/content";
import { COLORS } from "../shared";
import { Label, Tile, hoverProps } from "./kit";

const LETTERS = ["A", "B", "C", "D"];

function Crystal({
  index,
  x,
  text,
  state,
  accent,
  onPick,
}: {
  index: number;
  x: number;
  text: string;
  state: "idle" | "picked" | "right" | "wrong" | "faded";
  accent: string;
  onPick: () => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const color = state === "right" ? COLORS.good : state === "wrong" ? COLORS.bad : accent;

  useFrame((s, d) => {
    const g = ref.current!;
    g.rotation.y += d * (state === "picked" || state === "right" ? 1.8 : 0.5);
    g.position.y = 0.05 + Math.sin(s.clock.elapsedTime * 1.4 + index) * 0.06 + (state === "picked" || state === "right" ? 0.15 : 0);
    const target = state === "faded" ? 0.75 : state === "idle" ? 1 : 1.18;
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, target, 8, d));
    const m = mat.current!;
    m.color.set(color);
    m.emissive.set(color);
    m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity, state === "idle" ? 0.25 : state === "faded" ? 0.05 : 1.1, 8, d);
    m.opacity = state === "faded" ? 0.4 : 0.9;
  });

  return (
    <group position={[x, -0.55, 0]}>
      <group
        onClick={(e) => {
          e.stopPropagation();
          onPick();
        }}
        {...hoverProps}
      >
        <group ref={ref}>
          <mesh>
            <octahedronGeometry args={[0.42, 0]} />
            <meshStandardMaterial ref={mat} metalness={0.4} roughness={0.15} transparent flatShading />
          </mesh>
        </group>
        <Label size={0.2} position={[0, 0.72, 0.1]} color={color}>
          {LETTERS[index]}
        </Label>
      </group>
      <Label size={0.092} maxWidth={1.38} position={[0, -0.72, 0.1]} anchorY="top" color={state === "faded" ? "#5d6b84" : "#dfe8f7"}>
        {text}
      </Label>
    </group>
  );
}

/**
 * Answer crystals for the current question. Clicking one picks that answer;
 * the overlay's "Lock in" button reveals right and wrong.
 */
export default function Quiz3D({
  question,
  index,
  total,
  picked,
  revealed,
  accent,
  onPick,
}: {
  question: Question;
  index: number;
  total: number;
  picked: number | null;
  revealed: boolean;
  accent: string;
  onPick: (i: number) => void;
}) {
  const xs = question.options.map((_, i) => (i - (question.options.length - 1) / 2) * 1.6);
  return (
    <group>
      <group position={[0, 1.75, 0]}>
        <Tile width={6.3} height={1.1} accent={accent} glow={0.2}>
          <Label size={0.16} maxWidth={5.9}>
            {question.q}
          </Label>
        </Tile>
        <Label size={0.11} color="#8fa0bd" position={[0, 0.78, 0]}>
          {`QUESTION ${index + 1} OF ${total}`}
        </Label>
      </group>
      {question.options.map((opt, i) => {
        let state: "idle" | "picked" | "right" | "wrong" | "faded" = picked === i ? "picked" : "idle";
        if (revealed) state = i === question.answer ? "right" : picked === i ? "wrong" : "faded";
        return (
          <Crystal
            key={`${index}-${i}`}
            index={i}
            x={xs[i]}
            text={opt}
            state={state}
            accent={accent}
            onPick={() => {
              if (!revealed) onPick(i);
            }}
          />
        );
      })}
    </group>
  );
}
