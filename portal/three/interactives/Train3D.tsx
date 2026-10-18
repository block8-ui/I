"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { TEST_POINTS, TRAIN_POINTS, TRAIN_TARGET, centroids, predict, testAccuracy } from "../../lib/engines";
import { useSession } from "../../lib/session";
import { COLORS } from "../shared";
import { Label, hoverProps } from "./kit";

const CAT = "#5ee7ff";
const DOG = "#ffb547";
const SIZE = 3.9; // feature square
const ORIGIN = new THREE.Vector2(-2.55, -1.85); // bottom-left corner

const toXY = (ears: number, size: number) => new THREE.Vector3(ORIGIN.x + ears * SIZE, ORIGIN.y + size * SIZE, 0);

const FRAG = /* glsl */ `
  uniform vec2 uCat;
  uniform vec2 uDog;
  uniform float uHasCat;
  uniform float uHasDog;
  varying vec2 vUv;
  void main() {
    vec3 cat = vec3(0.37, 0.9, 1.0);
    vec3 dog = vec3(1.0, 0.71, 0.28);
    float dc = distance(vUv, uCat);
    float dd = distance(vUv, uDog);
    vec3 col = vec3(0.04, 0.06, 0.1);
    float both = uHasCat * uHasDog;
    // Tint each side of the decision boundary by the class the model predicts
    float side = step(dc, dd);
    vec3 region = mix(dog, cat, side);
    if (both < 0.5) region = uHasCat > 0.5 ? cat : (uHasDog > 0.5 ? dog : vec3(0.0));
    col += region * 0.12;
    float boundary = both * smoothstep(0.012, 0.0, abs(dc - dd));
    col += vec3(1.0) * boundary * 0.9;
    vec2 g = abs(fract(vUv * 10.0) - 0.5);
    col += vec3(0.08, 0.12, 0.2) * smoothstep(0.46, 0.5, max(g.x, g.y));
    gl_FragColor = vec4(col, 0.92);
  }
`;
const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function Gauge({ acc }: { acc: number }) {
  const fill = useRef<THREE.Mesh>(null);
  const H = 3.6;
  useFrame((_, d) => {
    const m = fill.current!;
    m.scale.y = THREE.MathUtils.damp(m.scale.y, Math.max(0.001, acc * H), 5, d);
    m.position.y = -1.85 + m.scale.y / 2;
  });
  const pass = acc >= TRAIN_TARGET;
  return (
    <group position={[2.35, 0, 0]}>
      <mesh position={[0, -1.85 + H / 2, -0.02]}>
        <boxGeometry args={[0.42, H, 0.05]} />
        <meshStandardMaterial color="#0d1424" />
      </mesh>
      <mesh ref={fill} position={[0, -1.85, 0.02]} scale={[1, 0.001, 1]}>
        <boxGeometry args={[0.34, 1, 0.06]} />
        <meshBasicMaterial color={pass ? [0.5, 2.4, 1.5] : [1.6, 1.4, 2.2]} toneMapped={false} />
      </mesh>
      <mesh position={[0, -1.85 + TRAIN_TARGET * H, 0.06]}>
        <boxGeometry args={[0.6, 0.025, 0.02]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <Label size={0.1} color="#b9c6dc" position={[0.45, -1.85 + TRAIN_TARGET * H, 0.06]} anchorX="left">
        {`TARGET ${Math.round(TRAIN_TARGET * 100)}%`}
      </Label>
      <Label size={0.24} color={pass ? COLORS.good : "#ffffff"} position={[0, 2.05, 0]}>
        {`${Math.round(acc * 100)}%`}
      </Label>
      <Label size={0.1} color="#8fa0bd" position={[0, 2.32, 0]}>
        TEST ACCURACY
      </Label>
    </group>
  );
}

export default function Train3D() {
  const labels = useSession((s) => s.train);
  const c = centroids(labels);
  const acc = testAccuracy(labels);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uCat: { value: new THREE.Vector2() },
      uDog: { value: new THREE.Vector2() },
      uHasCat: { value: 0 },
      uHasDog: { value: 0 },
    }),
    []
  );

  useFrame(() => {
    const u = mat.current!.uniforms;
    if (c.cat) u.uCat.value.set(c.cat.ears, c.cat.size);
    if (c.dog) u.uDog.value.set(c.dog.ears, c.dog.size);
    u.uHasCat.value = c.cat ? 1 : 0;
    u.uHasDog.value = c.dog ? 1 : 0;
  });

  return (
    <group>
      {/* Feature space */}
      <mesh position={[ORIGIN.x + SIZE / 2, ORIGIN.y + SIZE / 2, -0.05]}>
        <planeGeometry args={[SIZE, SIZE]} />
        <shaderMaterial ref={mat} vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} transparent />
      </mesh>
      <Label size={0.12} color="#b9c6dc" position={[ORIGIN.x + SIZE / 2, ORIGIN.y - 0.2, 0]}>
        EAR POINTINESS →
      </Label>
      <group position={[ORIGIN.x - 0.2, ORIGIN.y + SIZE / 2, 0]} rotation-z={Math.PI / 2}>
        <Label size={0.12} color="#b9c6dc">
          BODY SIZE →
        </Label>
      </group>

      {/* Test animals: hollow rings coloured by the model's prediction */}
      {TEST_POINTS.map((p) => {
        const pred = predict(labels, p);
        const wrong = pred && pred !== p.truth;
        return (
          <mesh key={p.id} position={toXY(p.ears, p.size)}>
            <ringGeometry args={[0.055, 0.085, 20]} />
            <meshBasicMaterial color={wrong ? COLORS.bad : pred === "cat" ? CAT : pred === "dog" ? DOG : "#55627a"} toneMapped={false} />
          </mesh>
        );
      })}

      {/* Class centres */}
      {(["cat", "dog"] as const).map((k) =>
        c[k] ? (
          <group key={k} position={toXY(c[k]!.ears, c[k]!.size).setZ(0.05)} rotation-z={Math.PI / 4}>
            <mesh>
              <boxGeometry args={[0.34, 0.04, 0.04]} />
              <meshBasicMaterial color={k === "cat" ? CAT : DOG} toneMapped={false} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.04, 0.34, 0.04]} />
              <meshBasicMaterial color={k === "cat" ? CAT : DOG} toneMapped={false} />
            </mesh>
          </group>
        ) : null
      )}

      {/* Training examples: click to label */}
      {TRAIN_POINTS.map((p, i) => {
        const l = labels[p.id] ?? null;
        return (
          <group
            key={p.id}
            position={toXY(p.ears, p.size).setZ(0.12)}
            onClick={(e) => {
              e.stopPropagation();
              const s = useSession.getState();
              const next = l === null ? "cat" : l === "cat" ? "dog" : null;
              s.set({ train: { ...s.train, [p.id]: next } });
            }}
            {...hoverProps}
          >
            <mesh>
              <sphereGeometry args={[0.14, 20, 20]} />
              <meshStandardMaterial
                color={l === "cat" ? CAT : l === "dog" ? DOG : "#6b7894"}
                emissive={l === "cat" ? CAT : l === "dog" ? DOG : "#000000"}
                emissiveIntensity={l ? 0.8 : 0}
              />
            </mesh>
            <Label size={0.11} position={[0, 0.25, 0.05]} color="#ffffff">
              {String(i + 1)}
            </Label>
          </group>
        );
      })}

      <Gauge acc={acc} />
    </group>
  );
}
