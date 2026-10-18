"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ALL_LESSONS, MODULES, lessonKey } from "../lib/content";
import { levelFor } from "../lib/levels";
import { mulberry32 } from "../lib/random";
import { isModuleComplete, overallProgress, useProgress } from "../lib/progress";
import { COLORS, fibonacciSphere, glowTexture } from "./shared";

type Node = { pos: THREE.Vector3; shell: 0 | 1 | 2; owner: number };

const SHELLS = [
  { r: 1.35, n: 14 },
  { r: 2.55, n: 36 },
  { r: 3.75, n: 72 },
];

/** Builds the network once: nodes on three shells, wired outer → inner */
function buildNetwork() {
  const nodes: Node[] = [];
  SHELLS.forEach((s, shell) =>
    fibonacciSphere(s.n, s.r, shell * 0.7).forEach((pos, i) => {
      // Outer nodes belong to a lesson, middle to a module, inner to the final
      const owner = shell === 2 ? i % ALL_LESSONS.length : shell === 1 ? i % MODULES.length : 0;
      nodes.push({ pos, shell: shell as 0 | 1 | 2, owner });
    })
  );

  const edges: [number, number][] = [];
  const seen = new Set<string>();
  const add = (a: number, b: number) => {
    const k = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (a !== b && !seen.has(k)) {
      seen.add(k);
      edges.push([a, b]);
    }
  };
  const nearest = (from: number, shell: number, count: number) =>
    nodes
      .map((n, i) => ({ i, d: n.shell === shell ? n.pos.distanceToSquared(nodes[from].pos) : Infinity }))
      .sort((a, b) => a.d - b.d)
      .slice(0, count)
      .map((x) => x.i);

  nodes.forEach((n, i) => {
    if (n.shell === 2) {
      nearest(i, 1, 2).forEach((j) => add(i, j));
      nearest(i, 2, 3).forEach((j) => add(i, j));
    } else if (n.shell === 1) {
      nearest(i, 0, 2).forEach((j) => add(i, j));
    } else {
      nearest(i, 0, 3).forEach((j) => add(i, j));
    }
  });
  return { nodes, edges };
}

const MAX_PULSES = 48;

// Scratch objects reused every frame
const tmp = { m: new THREE.Matrix4(), v: new THREE.Vector3(), s: new THREE.Vector3(), q: new THREE.Quaternion() };

export default function Core() {
  const { nodes, edges } = useMemo(() => buildNetwork(), []);
  const group = useRef<THREE.Group>(null);
  const nodeMesh = useRef<THREE.InstancedMesh>(null);
  const lineGeo = useRef<THREE.BufferGeometry>(null);
  const heart = useRef<THREE.MeshStandardMaterial>(null);
  const heartGlow = useRef<THREE.SpriteMaterial>(null);
  const pulseMesh = useRef<THREE.InstancedMesh>(null);
  const rings = useRef<(THREE.Mesh | null)[]>([]);

  const lessons = useProgress((s) => s.lessons);
  const final = useProgress((s) => s.final);
  const xp = useProgress((s) => s.xp);
  const level = levelFor(xp).index;
  const overall = overallProgress({ lessons, final });

  // Target colour for every node, recomputed when progress changes
  const targets = useMemo(() => {
    const lessonDone = ALL_LESSONS.map(({ module, lesson }) => !!lessons[lessonKey(module.id, lesson.id)]?.complete);
    const moduleDone = MODULES.map((m) => isModuleComplete(lessons, m.id));
    const lit = new THREE.Color();
    return nodes.map((n) => {
      if (n.shell === 2 && lessonDone[n.owner]) {
        return lit.set(ALL_LESSONS[n.owner].module.color).multiplyScalar(2.4).clone();
      }
      if (n.shell === 1 && moduleDone[n.owner]) return lit.set(MODULES[n.owner].color).multiplyScalar(2.8).clone();
      if (n.shell === 0 && final.passed) return new THREE.Color(3, 3, 3);
      return COLORS.dim.clone().multiplyScalar(1 + overall * 1.5);
    });
  }, [nodes, lessons, final.passed, overall]);

  // Per-frame mutable state lives in a ref (created on first use)
  const live = useRef<{
    colors: THREE.Color[];
    pulses: { edge: number; t: number; speed: number }[];
    ringScale: number[];
  } | null>(null);

  const linePositions = useMemo(() => {
    const arr = new Float32Array(edges.length * 6);
    edges.forEach(([a, b], i) => {
      nodes[a].pos.toArray(arr, i * 6);
      nodes[b].pos.toArray(arr, i * 6 + 3);
    });
    return arr;
  }, [nodes, edges]);
  const lineColors = useMemo(() => new Float32Array(edges.length * 6), [edges.length]);

  useLayoutEffect(() => {
    const mesh = nodeMesh.current!;
    nodes.forEach((n, i) => {
      const size = n.shell === 2 ? 0.075 : n.shell === 1 ? 0.1 : 0.14;
      tmp.m.compose(n.pos, tmp.q.identity(), tmp.s.setScalar(size));
      mesh.setMatrixAt(i, tmp.m);
      mesh.setColorAt(i, COLORS.dim);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor!.needsUpdate = true;
  }, [nodes]);

  useFrame((frame, delta) => {
    if (!live.current) {
      const rand = mulberry32(9);
      live.current = {
        colors: nodes.map(() => COLORS.dim.clone()),
        pulses: Array.from({ length: MAX_PULSES }, (_, i) => ({ edge: (i * 37) % edges.length, t: rand(), speed: 0.4 })),
        ringScale: [0, 0, 0, 0, 0],
      };
    }
    const state = live.current;
    const t = frame.clock.elapsedTime;
    group.current!.rotation.y += delta * 0.05;

    // Ease node colours towards their targets
    const k = 1 - Math.exp(-delta * 2.5);
    const mesh = nodeMesh.current!;
    nodes.forEach((_, i) => {
      state.colors[i].lerp(targets[i], k);
      mesh.setColorAt(i, state.colors[i]);
    });
    mesh.instanceColor!.needsUpdate = true;

    const colorAttr = lineGeo.current!.attributes.color as THREE.BufferAttribute;
    const lc = colorAttr.array as Float32Array;
    edges.forEach(([a, b], i) => {
      const ca = state.colors[a];
      const cb = state.colors[b];
      lc.set([ca.r * 0.55, ca.g * 0.55, ca.b * 0.55, cb.r * 0.55, cb.g * 0.55, cb.b * 0.55], i * 6);
    });
    colorAttr.needsUpdate = true;

    // Heart brightens and beats faster as the student progresses
    const beat = 1 + Math.sin(t * (1.2 + overall * 2.5)) * 0.08;
    heart.current!.emissiveIntensity = (0.5 + overall * 2.8) * beat;
    heartGlow.current!.color.setRGB(0.35, 0.75, 1).multiplyScalar((0.35 + overall * 1.2) * beat);

    // Signal pulses travelling along edges towards the centre
    const active = Math.round(10 + overall * (MAX_PULSES - 10));
    const pm = pulseMesh.current!;
    state.pulses.forEach((p, i) => {
      if (i >= active) {
        tmp.m.makeScale(0, 0, 0);
        pm.setMatrixAt(i, tmp.m);
        return;
      }
      p.t += delta * p.speed * (0.6 + overall);
      if (p.t >= 1) {
        p.t = 0;
        p.edge = (p.edge * 7 + 13 + i) % edges.length;
        p.speed = 0.35 + ((p.edge * 0.618) % 1) * 0.5;
      }
      const [a, b] = edges[p.edge];
      // Travel from the outer node towards the inner one
      const [from, to] = nodes[a].shell >= nodes[b].shell ? [a, b] : [b, a];
      tmp.v.lerpVectors(nodes[from].pos, nodes[to].pos, p.t);
      const s = 0.045 * Math.sin(p.t * Math.PI);
      tmp.m.compose(tmp.v, tmp.q.identity(), tmp.s.setScalar(s));
      pm.setMatrixAt(i, tmp.m);
    });
    pm.instanceMatrix.needsUpdate = true;

    // One ring per level reached
    rings.current.forEach((ring, i) => {
      if (!ring) return;
      state.ringScale[i] = THREE.MathUtils.damp(state.ringScale[i], i <= level ? 1 : 0, 3, delta);
      ring.scale.setScalar(Math.max(0.0001, state.ringScale[i]));
      ring.rotation.z += delta * (0.05 + i * 0.02) * (i % 2 ? -1 : 1);
    });
  });

  const glow = useMemo(() => glowTexture(), []);

  return (
    <group>
      <group ref={group}>
        <instancedMesh ref={nodeMesh} args={[undefined, undefined, nodes.length]} frustumCulled={false}>
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>

        <lineSegments frustumCulled={false}>
          <bufferGeometry ref={lineGeo}>
            <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
            <bufferAttribute attach="attributes-color" args={[lineColors, 3]} />
          </bufferGeometry>
          <lineBasicMaterial vertexColors transparent opacity={0.75} toneMapped={false} depthWrite={false} />
        </lineSegments>

        <instancedMesh ref={pulseMesh} args={[undefined, undefined, MAX_PULSES]} frustumCulled={false}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={[3, 3.2, 3.5]} toneMapped={false} />
        </instancedMesh>
      </group>

      <mesh>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial ref={heart} color="#0b1a2c" emissive="#5ecfff" emissiveIntensity={0.5} metalness={0.6} roughness={0.2} flatShading />
      </mesh>
      <mesh scale={0.78}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color={[0.5, 1.4, 2]} wireframe toneMapped={false} transparent opacity={0.35} />
      </mesh>
      <sprite scale={[4, 4, 1]}>
        <spriteMaterial ref={heartGlow} map={glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>

      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          ref={(m) => {
            rings.current[i] = m;
          }}
          rotation={[Math.PI / 2 + (i - 2) * 0.32, i * 0.6, 0]}
          scale={0.0001}
        >
          <torusGeometry args={[4.5 + i * 0.42, 0.014, 6, 180]} />
          <meshBasicMaterial color={[1.4, 1.6, 2]} toneMapped={false} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}
