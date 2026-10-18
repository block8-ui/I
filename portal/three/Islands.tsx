"use client";

import { Billboard, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { MODULES, type Module, type ModuleId } from "../lib/content";
import { mulberry32 } from "../lib/random";
import { useNav } from "../lib/nav";
import { ISLANDS, ISLAND_TOP } from "../lib/world";
import { FONT } from "./shared";
import Stage from "./Stage";

/* ---------- Geometry ---------- */

/** Floating rock: flat top, jagged sides tapering to a point underneath */
function rockGeometry(seed: number) {
  const rand = mulberry32(seed);
  const g = new THREE.CylinderGeometry(5.2, 0.5, 6.5, 11, 6).toNonIndexed();
  g.translate(0, ISLAND_TOP - 3.25, 0);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const jitter = new Map<string, [number, number]>();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (y >= ISLAND_TOP - 0.001) continue; // keep the platform flat
    const key = `${x.toFixed(2)},${y.toFixed(2)},${z.toFixed(2)}`;
    if (!jitter.has(key)) jitter.set(key, [0.75 + rand() * 0.5, (rand() - 0.5) * 0.6]);
    const [k, dy] = jitter.get(key)!;
    pos.setXYZ(i, x * k, y + dy, z * k);
  }
  g.computeVertexNormals();
  return g;
}

function gearShape(teeth: number, r: number, depth: number) {
  const shape = new THREE.Shape();
  const steps = teeth * 4;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const rr = i % 4 < 2 ? r : r - depth;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  const hole = new THREE.Path();
  hole.absarc(0, 0, r * 0.35, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  return shape;
}

/* ---------- Platform surface ---------- */

const PLATFORM_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const PLATFORM_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    // Fine grid that fades towards the rim
    vec2 g = abs(fract(p * 9.0) - 0.5);
    float grid = smoothstep(0.47, 0.5, max(g.x, g.y));
    float rings = smoothstep(0.02, 0.0, abs(fract(r * 4.0 - uTime * 0.15) - 0.5) - 0.48);
    float rim = smoothstep(0.93, 0.99, r) * (1.0 - smoothstep(0.99, 1.0, r));
    vec3 base = vec3(0.035, 0.05, 0.08);
    vec3 col = base + uColor * (grid * 0.18 * (1.0 - r) + rings * 0.12 + rim * 1.6);
    gl_FragColor = vec4(col, 1.0);
  }
`;

function Platform({ color }: { color: string }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uColor: { value: new THREE.Color(color) }, uTime: { value: 0 } }), [color]);
  useFrame((s) => {
    mat.current!.uniforms.uTime.value = s.clock.elapsedTime;
  });
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, ISLAND_TOP + 0.01, 0]} receiveShadow>
      <circleGeometry args={[4.9, 64]} />
      <shaderMaterial ref={mat} vertexShader={PLATFORM_VERT} fragmentShader={PLATFORM_FRAG} uniforms={uniforms} />
    </mesh>
  );
}

/* ---------- Themed props (placed at the back, away from the camera) ---------- */

function LabProps({ color }: { color: string }) {
  const cubes = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);
  const rand = useMemo(() => mulberry32(4), []);
  const cubeData = useMemo(
    () => Array.from({ length: 14 }, (_, i) => ({ a: (i / 14) * Math.PI * 2, y: 1 + rand() * 3, s: 0.14 + rand() * 0.16 })),
    [rand]
  );
  useFrame((s, d) => {
    cubes.current!.rotation.y += d * 0.15;
    rings.current!.children.forEach((r, i) => {
      r.position.y = ISLAND_TOP + ((s.clock.elapsedTime * 0.6 + i * 1.2) % 3.6);
    });
  });
  return (
    <group>
      {[-1.9, 0, 1.9].map((x, i) => (
        <group key={x} position={[x, 0, -3.1 + Math.abs(x) * 0.25]}>
          <mesh position={[0, ISLAND_TOP + 1.8 + (i === 1 ? 0.4 : 0), 0]}>
            <cylinderGeometry args={[0.32, 0.32, 3.6 + (i === 1 ? 0.8 : 0), 24, 1, true]} />
            <meshStandardMaterial color={color} transparent opacity={0.05} roughness={0.1} metalness={0.2} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <mesh position={[0, ISLAND_TOP + 0.08, 0]}>
            <cylinderGeometry args={[0.42, 0.48, 0.16, 24]} />
            <meshStandardMaterial color="#1a2436" metalness={0.6} roughness={0.35} />
          </mesh>
        </group>
      ))}
      <group ref={rings}>
        {[-1.9, 0, 1.9].map((x) => (
          <mesh key={x} position={[x, ISLAND_TOP, -3.1 + Math.abs(x) * 0.25]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.36, 0.02, 6, 32]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <group ref={cubes}>
        {cubeData.map((c, i) => (
          <mesh key={i} position={[Math.cos(c.a) * 5.8, ISLAND_TOP + c.y, Math.sin(c.a) * 5.8]} rotation={[c.a, c.a * 2, 0]}>
            <boxGeometry args={[c.s, c.s, c.s]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function WorkshopProps({ color }: { color: string }) {
  const g1 = useRef<THREE.Mesh>(null);
  const g2 = useRef<THREE.Mesh>(null);
  const big = useMemo(() => new THREE.ExtrudeGeometry(gearShape(14, 1.3, 0.22), { depth: 0.18, bevelEnabled: false }), []);
  const small = useMemo(() => new THREE.ExtrudeGeometry(gearShape(9, 0.85, 0.2), { depth: 0.18, bevelEnabled: false }), []);
  useFrame((_, d) => {
    g1.current!.rotation.z += d * 0.3;
    g2.current!.rotation.z -= d * 0.3 * (14 / 9);
  });
  return (
    <group position={[0, 0, -3.2]}>
      {/* Gantry */}
      {[-2.6, 2.6].map((x) => (
        <mesh key={x} position={[x, ISLAND_TOP + 1.9, 0]}>
          <boxGeometry args={[0.22, 3.8, 0.22]} />
          <meshStandardMaterial color="#222c3e" metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, ISLAND_TOP + 3.8, 0]}>
        <boxGeometry args={[5.5, 0.22, 0.22]} />
        <meshStandardMaterial color="#222c3e" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, ISLAND_TOP + 3.65, 0.12]}>
        <boxGeometry args={[5.1, 0.04, 0.04]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh ref={g1} geometry={big} position={[-0.9, ISLAND_TOP + 2.1, -0.1]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh ref={g2} geometry={small} position={[1.18, ISLAND_TOP + 2.55, -0.1]}>
        <meshStandardMaterial color="#c9d3e6" metalness={0.9} roughness={0.25} />
      </mesh>
    </group>
  );
}

function CouncilProps({ color }: { color: string }) {
  const halo = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    halo.current!.rotation.z = s.clock.elapsedTime * 0.2;
    halo.current!.position.y = ISLAND_TOP + 4.3 + Math.sin(s.clock.elapsedTime * 0.8) * 0.12;
  });
  const stones = Array.from({ length: 7 }, (_, i) => {
    // Semicircle behind the stage (negative local Z)
    const a = Math.PI * (0.12 + (i / 6) * 0.76);
    return { x: Math.cos(a) * 3.9, z: -Math.sin(a) * 3.9, a, h: 2.1 + (i % 3) * 0.35 };
  });
  return (
    <group>
      {stones.map((st, i) => (
        <group key={i} position={[st.x, ISLAND_TOP, st.z]} rotation-y={Math.PI / 2 - st.a}>
          <mesh position={[0, st.h / 2, 0]}>
            <boxGeometry args={[0.7, st.h, 0.38]} />
            <meshStandardMaterial color="#1b2232" roughness={0.85} flatShading />
          </mesh>
          <mesh position={[0, st.h * 0.55, 0.2]}>
            <boxGeometry args={[0.06, st.h * 0.6, 0.01]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <mesh ref={halo} position={[0, ISLAND_TOP + 4.3, -2.6]}>
        <torusGeometry args={[1.1, 0.03, 8, 96]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ---------- Island ---------- */

function Island({ module }: { module: Module }) {
  const info = ISLANDS[module.id];
  const root = useRef<THREE.Group>(null);
  const rock = useMemo(() => rockGeometry(7 + info.index * 5), [info.index]);
  const bits = useMemo(() => {
    const rand = mulberry32(30 + info.index);
    return Array.from({ length: 7 }, (_, i) => ({
      a: (i / 7) * Math.PI * 2 + rand(),
      r: 6.4 + rand() * 1.6,
      y: -2.5 + rand() * 2.5,
      s: 0.25 + rand() * 0.45,
    }));
  }, [info.index]);
  const facing = Math.atan2(info.out.x, info.out.z);
  // The big name label would sit on top of an open lesson, so hide it then
  const inLesson = useNav((s) => s.location.kind === "lesson" && s.location.module === module.id);

  useFrame((s) => {
    // Gentle bobbing, each island out of phase
    root.current!.position.y = info.pos.y + Math.sin(s.clock.elapsedTime * 0.5 + info.index * 2) * 0.12;
  });

  return (
    <group ref={root} position={[info.pos.x, info.pos.y, info.pos.z]}>
      <group rotation-y={facing}>
        <mesh geometry={rock} castShadow receiveShadow>
          <meshStandardMaterial color="#161d2b" roughness={0.9} metalness={0.1} flatShading />
        </mesh>
        <Platform color={module.color} />
        {bits.map((b, i) => (
          <mesh key={i} position={[Math.cos(b.a) * b.r, b.y, Math.sin(b.a) * b.r]} rotation={[b.a, b.a * 1.3, 0]}>
            <dodecahedronGeometry args={[b.s, 0]} />
            <meshStandardMaterial color="#161d2b" roughness={0.9} flatShading />
          </mesh>
        ))}

        {module.id === "lab" && <LabProps color={module.color} />}
        {module.id === "workshop" && <WorkshopProps color={module.color} />}
        {module.id === "council" && <CouncilProps color={module.color} />}

        <Stage moduleId={module.id} />

        <pointLight position={[0, ISLAND_TOP + 3, 1]} color={module.color} intensity={10} distance={12} decay={2} />

        <Billboard position={[0, ISLAND_TOP + 6.2, -2.8]} visible={!inLesson}>
          <Text font={FONT} fontSize={0.62} letterSpacing={0.08} color={module.color} anchorY="bottom">
            {`0${module.number}  ${module.place.toUpperCase()}`}
          </Text>
          <Text font={FONT} fontSize={0.3} color="#c9d6ea" anchorY="top" position={[0, -0.12, 0]}>
            {module.title}
          </Text>
        </Billboard>
      </group>
    </group>
  );
}

export default function Islands() {
  return (
    <>
      {MODULES.map((m) => (
        <Island key={m.id} module={m} />
      ))}
    </>
  );
}

export const islandColor = (id: ModuleId) => MODULES.find((m) => m.id === id)!.color;
