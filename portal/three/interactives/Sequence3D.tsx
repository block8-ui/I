"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { Interactive } from "../../lib/content";
import { useSession } from "../../lib/session";
import { Label, Tile, hoverProps } from "./kit";

type SeqSpec = Extract<Interactive, { kind: "sequence" }>;

function Bar({ x, p, show, accent, chosen }: { x: number; p: number; show: boolean; accent: string; chosen: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, d) => {
    const h = show ? Math.max(0.02, p * 2.2) : 0.001;
    const m = ref.current!;
    m.scale.y = THREE.MathUtils.damp(m.scale.y, h, 6, d);
    m.position.y = -2.45 + m.scale.y / 2;
  });
  return (
    <group>
      <mesh ref={ref} position={[x, -2.45, 0]} scale={[1, 0.001, 1]}>
        <boxGeometry args={[0.9, 1, 0.3]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={chosen ? 1.2 : 0.35} transparent opacity={0.85} />
      </mesh>
      {show && (
        <Label size={0.16} color={chosen ? "#ffffff" : "#b9c6dc"} position={[x, -2.45 + p * 2.2 + 0.2, 0.2]}>
          {`${Math.round(p * 100)}%`}
        </Label>
      )}
    </group>
  );
}

export default function Sequence3D({ spec, accent }: { spec: SeqSpec; accent: string }) {
  const round = useSession((s) => s.seqRound);
  const picks = useSession((s) => s.seqPicks);
  const r = spec.rounds[Math.min(round, spec.rounds.length - 1)];
  const picked = picks[round] ?? null;
  const xs = r.options.map((_, i) => (i - (r.options.length - 1) / 2) * 1.35);

  return (
    <group>
      <group position={[0, 1.85, 0]}>
        <Tile width={6} height={0.95} accent={accent} glow={0.25}>
          <Label size={0.26} maxWidth={5.6}>{`${r.context} ${picked ?? "___"}`}</Label>
        </Tile>
        <Label size={0.12} color="#8fa0bd" position={[0, 0.7, 0]}>
          {`ROUND ${Math.min(round + 1, spec.rounds.length)} OF ${spec.rounds.length}  ·  PICK THE NEXT WORD`}
        </Label>
      </group>

      {r.options.map((o, i) => {
        const chosen = picked === o.word;
        return (
          <group
            key={o.word + round}
            position={[xs[i], 0.35, chosen ? 0.25 : 0]}
            onClick={(e) => {
              e.stopPropagation();
              const s = useSession.getState();
              if (s.seqPicks[s.seqRound]) return;
              const next = [...s.seqPicks];
              next[s.seqRound] = o.word;
              s.set({ seqPicks: next });
            }}
            {...(picked ? {} : hoverProps)}
          >
            <Tile width={1.2} height={0.7} accent={accent} glow={chosen ? 1 : picked ? 0.05 : 0.35} dim={!!picked && !chosen}>
              <Label size={0.18}>{o.word}</Label>
            </Tile>
          </group>
        );
      })}

      {/* Probability bars appear once a word is picked */}
      {r.options.map((o, i) => (
        <Bar key={o.word + round} x={xs[i]} p={o.p} show={!!picked} accent={accent} chosen={picked === o.word} />
      ))}
      <mesh position={[0, -2.46, 0]}>
        <boxGeometry args={[5.8, 0.02, 0.4]} />
        <meshBasicMaterial color="#3a4660" />
      </mesh>
      <Label size={0.11} color="#8fa0bd" position={[0, -2.75, 0.2]}>
        MODEL&apos;S PREDICTED PROBABILITY
      </Label>
    </group>
  );
}
