"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { groupAccuracy, isBalanced } from "../../lib/engines";
import { useSession } from "../../lib/session";
import { COLORS } from "../shared";
import { Label, hoverProps, useSurfaceDrag } from "./kit";

const A = "#7fb2ff";
const B = "#ff9a6b";
const BLOCKS = 20;
const TRACK = { x0: -2.6, x1: 2.6, y: -2.35 };

/** Stack of training-photo blocks for one group */
function Stack({ x, count, color, label }: { x: number; count: number; color: string; label: string }) {
  return (
    <group position={[x, -1.6, 0]}>
      {Array.from({ length: BLOCKS }, (_, i) => {
        const on = i < count;
        const col = i % 4;
        const row = Math.floor(i / 4);
        return (
          <mesh key={i} position={[(col - 1.5) * 0.24, row * 0.24 + 0.12, 0]} scale={on ? 1 : 0.0001}>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.4} />
          </mesh>
        );
      })}
      <Label size={0.12} color={color} position={[0, -0.22, 0.2]}>
        {`${label}: ${count * 50} photos`}
      </Label>
    </group>
  );
}

function Pillar({ x, acc, color, label }: { x: number; acc: number; color: string; label: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const h = ((acc - 50) / 50) * 3.2;
  useFrame((_, d) => {
    const m = ref.current!;
    m.scale.y = THREE.MathUtils.damp(m.scale.y, h, 6, d);
    m.position.y = -1.6 + m.scale.y / 2;
  });
  return (
    <group>
      <mesh ref={ref} position={[x, -1.6, 0]} scale={[1, 0.001, 1]}>
        <cylinderGeometry args={[0.32, 0.32, 1, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.9} flatShading />
      </mesh>
      <Label size={0.22} color="#ffffff" position={[x, -1.6 + h + 0.3, 0.3]}>
        {`${acc}%`}
      </Label>
      <Label size={0.11} color={color} position={[x, -1.82, 0.4]}>
        {label}
      </Label>
    </group>
  );
}

export default function Bias3D() {
  const share = useSession((s) => s.biasShare);
  const { a, b } = groupAccuracy(share);
  const nA = Math.round(share * BLOCKS);
  const balanced = isBalanced(share);
  const knob = useRef<THREE.Group>(null);

  const setShare = (x: number) => {
    const t = THREE.MathUtils.clamp((x - TRACK.x0) / (TRACK.x1 - TRACK.x0), 0.05, 0.95);
    // Slider runs from all Group B (left) to all Group A (right)
    useSession.getState().set({ biasShare: Math.round(t * 20) / 20 });
  };
  const drag = useSurfaceDrag({ target: knob, onMove: (p) => setShare(p.x), onDrop: (p) => setShare(p.x) });
  const knobX = TRACK.x0 + share * (TRACK.x1 - TRACK.x0);

  return (
    <group>
      <Label size={0.13} color="#8fa0bd" position={[-1.75, 2.35, 0]}>
        TRAINING DATA
      </Label>
      <Label size={0.13} color="#8fa0bd" position={[1.75, 2.35, 0]}>
        ACCURACY ON NEW PHOTOS
      </Label>

      <Stack x={-2.45} count={nA} color={A} label="Group A" />
      <Stack x={-1.05} count={BLOCKS - nA} color={B} label="Group B" />

      <Pillar x={1.15} acc={a} color={A} label="GROUP A" />
      <Pillar x={2.35} acc={b} color={B} label="GROUP B" />

      <Label size={0.17} color={balanced ? COLORS.good : COLORS.bad} position={[1.75, 1.95, 0.2]}>
        {balanced ? `FAIR: GAP ${Math.abs(a - b)} POINTS` : `UNFAIR: GAP ${Math.abs(a - b)} POINTS`}
      </Label>

      {/* 3D slider */}
      <mesh position={[0, TRACK.y, 0]}>
        <boxGeometry args={[TRACK.x1 - TRACK.x0, 0.05, 0.05]} />
        <meshBasicMaterial color="#3a4660" />
      </mesh>
      <mesh position={[0, TRACK.y, 0.03]}>
        <boxGeometry args={[0.02, 0.2, 0.02]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <group ref={knob} position={[knobX, TRACK.y, 0.1]} {...drag} {...hoverProps}>
        <mesh>
          <sphereGeometry args={[0.2, 24, 24]} />
          <meshStandardMaterial color="#ffffff" emissive="#b48cff" emissiveIntensity={0.9} />
        </mesh>
      </group>
      <Label size={0.1} color={B} position={[TRACK.x0, TRACK.y - 0.3, 0]} anchorX="left">
        MORE GROUP B
      </Label>
      <Label size={0.1} color={A} position={[TRACK.x1, TRACK.y - 0.3, 0]} anchorX="right">
        MORE GROUP A
      </Label>
      <Label size={0.11} color="#ffffff" position={[0, TRACK.y - 0.3, 0]}>
        {`${Math.round(share * 100)}% A  /  ${Math.round((1 - share) * 100)}% B`}
      </Label>
    </group>
  );
}
