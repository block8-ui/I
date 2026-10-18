"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { Interactive } from "../../lib/content";
import { useSession } from "../../lib/session";
import { COLORS } from "../shared";
import { Label, Tile, hoverProps } from "./kit";

type BuilderSpec = Extract<Interactive, { kind: "builder" }>;

const BLOCK_W = 4.8;
const BLOCK_H = 0.78;
const BASE_Y = -2.0;

export const builderScore = (spec: BuilderSpec, picks: Record<string, number | null>) =>
  spec.slots.reduce((sum, s) => sum + (picks[s.id] != null ? s.options[picks[s.id]!].quality : 0), 0);

/** One level of the prompt tower; drops into place when a block is chosen */
function Level({ spec, index, accent }: { spec: BuilderSpec; index: number; accent: string }) {
  const slot = spec.slots[index];
  const pick = useSession((s) => s.builder[slot.id] ?? null);
  const ref = useRef<THREE.Group>(null);
  const option = pick != null ? slot.options[pick] : null;
  const y = BASE_Y + index * (BLOCK_H + 0.12);

  useFrame((_, d) => {
    const g = ref.current!;
    const targetY = option ? y : y + 0.5;
    g.position.y = THREE.MathUtils.damp(g.position.y, targetY, 8, d);
  });

  const quality = option?.quality ?? -1;
  const color = quality === 2 ? accent : quality === 1 ? "#b08a4a" : quality === 0 ? "#5a6884" : "#3a4660";

  return (
    <group
      ref={ref}
      position={[-0.45, y + 0.5, 0]}
      onClick={(e) => {
        e.stopPropagation();
        const s = useSession.getState();
        const cur = s.builder[slot.id];
        // Click cycles through the three blocks for this slot
        const next = cur == null ? 0 : (cur + 1) % slot.options.length;
        s.set({ builder: { ...s.builder, [slot.id]: next } });
      }}
      {...hoverProps}
    >
      <Tile width={BLOCK_W} height={BLOCK_H} depth={0.5} accent={color} glow={quality === 2 ? 0.9 : quality === 1 ? 0.35 : 0.05} dim={!option}>
        <Label size={0.11} color={color === "#3a4660" ? "#7d8aa3" : accent} anchorX="left" position={[-BLOCK_W / 2 + 0.18, 0.2, 0]}>
          {slot.label.toUpperCase()}
        </Label>
        <Label size={0.12} anchorX="left" maxWidth={BLOCK_W - 0.4} position={[-BLOCK_W / 2 + 0.18, -0.08, 0]}>
          {option ? option.text : "Click to choose a block"}
        </Label>
        {option && (
          <group position={[BLOCK_W / 2 - 0.3, 0.2, 0]}>
            {[0, 1].map((k) => (
              <mesh key={k} position={[k * 0.16 - 0.08, 0, 0]}>
                <circleGeometry args={[0.05, 12]} />
                <meshBasicMaterial color={k < option.quality ? accent : "#3a4660"} toneMapped={false} />
              </mesh>
            ))}
          </group>
        )}
      </Tile>
    </group>
  );
}

export default function Builder3D({ spec, accent }: { spec: BuilderSpec; accent: string }) {
  const picks = useSession((s) => s.builder);
  const score = builderScore(spec, picks);
  const max = spec.slots.length * 2;
  const beam = useRef<THREE.MeshBasicMaterial>(null);
  const strong = score >= 6;

  useFrame((s, d) => {
    beam.current!.opacity = THREE.MathUtils.damp(beam.current!.opacity, strong ? 0.35 + Math.sin(s.clock.elapsedTime * 3) * 0.08 : 0, 4, d);
  });

  return (
    <group>
      {spec.slots.map((_, i) => (
        <Level key={i} spec={spec} index={i} accent={accent} />
      ))}

      {/* Strength meter */}
      <group position={[2.55, 0, 0]}>
        {Array.from({ length: max }, (_, i) => (
          <mesh key={i} position={[0, BASE_Y - 0.2 + i * 0.44, 0]}>
            <boxGeometry args={[0.32, 0.34, 0.2]} />
            <meshStandardMaterial
              color={i < score ? (score === max ? COLORS.good : accent) : "#1c2537"}
              emissive={i < score ? (score === max ? COLORS.good : accent) : "#000000"}
              emissiveIntensity={i < score ? 0.9 : 0}
            />
          </mesh>
        ))}
        <Label size={0.2} position={[0, BASE_Y - 0.2 + max * 0.44 + 0.1, 0]} color={score === max ? COLORS.good : "#ffffff"}>
          {`${score}/${max}`}
        </Label>
        <Label size={0.09} position={[0, BASE_Y - 0.62, 0]} color="#8fa0bd">
          PROMPT STRENGTH
        </Label>
      </group>

      {/* Beacon when the prompt is strong */}
      <mesh position={[-0.45, 2.6, -0.2]}>
        <cylinderGeometry args={[0.05, 0.35, 2.4, 16, 1, true]} />
        <meshBasicMaterial ref={beam} color={[2.5, 1.8, 0.7]} toneMapped={false} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
