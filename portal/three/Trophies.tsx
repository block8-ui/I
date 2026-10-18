"use client";

import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { BADGES, type Badge, type BadgeShape } from "../lib/content";
import { useProgress } from "../lib/progress";
import { useSession } from "../lib/session";
import { TROPHY_HALL } from "../lib/world";
import { FONT } from "./shared";

function shape(kind: BadgeShape): THREE.Shape {
  const s = new THREE.Shape();
  const poly = (pts: [number, number][]) => {
    s.moveTo(...pts[0]);
    pts.slice(1).forEach((p) => s.lineTo(...p));
    s.closePath();
  };
  const ring = (n: number, r: number, rot = 0) =>
    Array.from({ length: n }, (_, i) => {
      const a = rot + (i / n) * Math.PI * 2;
      return [Math.cos(a) * r, Math.sin(a) * r] as [number, number];
    });

  switch (kind) {
    case "star": {
      const pts: [number, number][] = [];
      for (let i = 0; i < 10; i++) {
        const a = Math.PI / 2 + (i / 10) * Math.PI * 2;
        const r = i % 2 ? 0.2 : 0.48;
        pts.push([Math.cos(a) * r, Math.sin(a) * r]);
      }
      poly(pts);
      break;
    }
    case "hex":
      poly(ring(6, 0.45, Math.PI / 6));
      break;
    case "diamond":
      poly([
        [0, 0.5],
        [0.34, 0],
        [0, -0.5],
        [-0.34, 0],
      ]);
      break;
    case "bolt":
      poly([
        [0.08, 0.5],
        [-0.28, 0.02],
        [-0.02, 0.02],
        [-0.12, -0.5],
        [0.3, 0.06],
        [0.04, 0.06],
      ]);
      break;
    case "shield":
      s.moveTo(0, 0.48);
      s.lineTo(0.38, 0.34);
      s.quadraticCurveTo(0.38, -0.2, 0, -0.5);
      s.quadraticCurveTo(-0.38, -0.2, -0.38, 0.34);
      s.closePath();
      break;
    case "ring": {
      s.absarc(0, 0, 0.45, 0, Math.PI * 2, false);
      const hole = new THREE.Path();
      hole.absarc(0, 0, 0.24, 0, Math.PI * 2, true);
      s.holes.push(hole);
      break;
    }
  }
  return s;
}

const geometryCache = new Map<BadgeShape, THREE.ExtrudeGeometry>();
function medalGeometry(kind: BadgeShape) {
  if (!geometryCache.has(kind)) {
    const g = new THREE.ExtrudeGeometry(shape(kind), {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.03,
      bevelSegments: 3,
    });
    g.center();
    geometryCache.set(kind, g);
  }
  return geometryCache.get(kind)!;
}

const LOCKED = new THREE.Color("#3a4766");

function Medal({ badge, index, total }: { badge: Badge; index: number; total: number }) {
  const ref = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const earned = useProgress((s) => !!s.badges[badge.id]);
  const selected = useSession((s) => s.selectedBadge === badge.id);
  const color = useMemo(() => new THREE.Color(badge.color), [badge.color]);

  // Amphitheatre arc facing the camera
  const a = (index / (total - 1) - 0.5) * Math.PI * 1.15;
  const r = 6.2;
  const x = Math.sin(a) * r;
  const z = -Math.cos(a) * r + 1.5;

  useFrame((s, d) => {
    const g = ref.current!;
    g.rotation.y += d * (selected ? 1.6 : earned ? 0.6 : 0.15);
    const lift = selected ? 0.35 : 0;
    g.position.y = THREE.MathUtils.damp(g.position.y, 1.75 + lift + Math.sin(s.clock.elapsedTime + index) * 0.05, 6, d);
    const m = mat.current!;
    m.color.lerp(earned ? color : LOCKED, 1 - Math.exp(-d * 4));
    m.emissive.copy(color);
    m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity, earned ? (selected ? 0.9 : 0.4) : 0, 4, d);
  });

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.45, 0.55, 1, 6]} />
        <meshStandardMaterial color="#141c2a" metalness={0.5} roughness={0.5} flatShading />
      </mesh>
      <mesh position={[0, 1.005, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.32, 0.36, 6]} />
        <meshBasicMaterial color={earned ? badge.color : "#2a3448"} toneMapped={false} />
      </mesh>
      <group
        ref={ref}
        position={[0, 1.75, 0]}
        onClick={(e) => {
          e.stopPropagation();
          useSession.getState().set({ selectedBadge: badge.id });
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <mesh geometry={medalGeometry(badge.shape)} castShadow>
          <meshStandardMaterial ref={mat} metalness={0.85} roughness={0.25} color={LOCKED} />
        </mesh>
      </group>
      <Text
        font={FONT}
        fontSize={0.17}
        position={[0, 0.25, 0.62]}
        color={earned ? "#ffffff" : "#5d6b84"}
        anchorX="center"
        maxWidth={1.6}
        textAlign="center"
      >
        {badge.name}
      </Text>
    </group>
  );
}

export default function Trophies() {
  // A spotlight's target must live in the scene to follow this group
  const spotTarget = useMemo(() => new THREE.Object3D(), []);
  return (
    <group position={TROPHY_HALL}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[10, 64]} />
        <meshStandardMaterial color="#0a0f19" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
        <ringGeometry args={[9.6, 9.7, 128]} />
        <meshBasicMaterial color="#ffd27a" toneMapped={false} transparent opacity={0.6} />
      </mesh>
      {/* Rock beneath the floor; its top sits just below the floor to avoid z-fighting */}
      <mesh position={[0, -1.65, 0]}>
        <cylinderGeometry args={[9.9, 0.6, 3.2, 12]} />
        <meshStandardMaterial color="#121926" roughness={0.9} flatShading />
      </mesh>
      {BADGES.map((b, i) => (
        <Medal key={b.id} badge={b} index={i} total={BADGES.length} />
      ))}
      <primitive object={spotTarget} />
      <spotLight position={[0, 12, 6]} angle={0.7} penumbra={0.8} intensity={180} color="#fff1d6" castShadow shadow-bias={-0.002} shadow-normalBias={0.05} target={spotTarget} />
      <pointLight position={[0, 3, 4]} color="#ffd27a" intensity={12} distance={14} decay={2} />
    </group>
  );
}
