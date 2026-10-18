"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { mulberry32 } from "../lib/random";
import { glowTexture } from "./shared";

const STAR_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  uniform float uTime;
  varying float vTwinkle;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    vTwinkle = 0.65 + 0.35 * sin(uTime * (0.6 + aSeed) + aSeed * 40.0);
    gl_PointSize = aSize * (300.0 / -mv.z);
  }
`;
const STAR_FRAG = /* glsl */ `
  varying float vTwinkle;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vec3(0.8, 0.88, 1.0) * vTwinkle, a * vTwinkle);
  }
`;

/** Deep-space void: twinkling stars, faint nebula glows and drifting dust */
export default function Backdrop() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const dust = useRef<THREE.Points>(null);

  const stars = useMemo(() => {
    const rand = mulberry32(3);
    const n = 2600;
    const pos = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const u = rand() * 2 - 1;
      const t = rand() * Math.PI * 2;
      const r = 140 + rand() * 90;
      const s = Math.sqrt(1 - u * u);
      pos.set([Math.cos(t) * s * r, u * r, Math.sin(t) * s * r], i * 3);
      size[i] = 0.6 + rand() * rand() * 3.2;
      seed[i] = rand();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, []);

  const dustGeo = useMemo(() => {
    const rand = mulberry32(8);
    const n = 900;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) pos.set([(rand() - 0.5) * 90, (rand() - 0.5) * 50, (rand() - 0.5) * 90], i * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  const glow = useMemo(() => glowTexture(), []);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((s, d) => {
    mat.current!.uniforms.uTime.value = s.clock.elapsedTime;
    dust.current!.rotation.y += d * 0.004;
  });

  const nebulae: { pos: [number, number, number]; scale: number; color: string }[] = [
    { pos: [-90, 30, -120], scale: 140, color: "#1f5d8c" },
    { pos: [110, -20, -90], scale: 120, color: "#4b2a7a" },
    { pos: [20, 60, 130], scale: 110, color: "#123d5c" },
    { pos: [-60, -50, 90], scale: 100, color: "#5a3a1a" },
  ];

  return (
    <group>
      <points geometry={stars} frustumCulled={false}>
        <shaderMaterial ref={mat} vertexShader={STAR_VERT} fragmentShader={STAR_FRAG} uniforms={uniforms} transparent depthWrite={false} />
      </points>
      {nebulae.map((n, i) => (
        <sprite key={i} position={n.pos} scale={[n.scale, n.scale, 1]}>
          <spriteMaterial map={glow} color={n.color} transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
        </sprite>
      ))}
      <points ref={dust} geometry={dustGeo}>
        <pointsMaterial size={0.08} color="#9fc4ff" transparent opacity={0.45} depthWrite={false} sizeAttenuation />
      </points>
    </group>
  );
}
