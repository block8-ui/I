"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { mulberry32 } from "../../lib/random";
import { store } from "../../lib/store";

type Props = {
  count?: number;
  /** Width/height/depth of the box the flakes wrap within */
  area?: [number, number, number];
  position?: [number, number, number];
  color?: string;
  size?: number;
  /** Fall speed; negative values drift upwards (embers, dust) */
  speed?: number;
  opacity?: number;
};

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uSpeed;
  uniform float uScroll;
  uniform vec3 uArea;
  attribute float aScale;
  attribute float aSeed;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    float fall = uTime * uSpeed * (0.6 + aScale * 0.6) + uScroll * 18.0 * aScale;
    p.y = mod(p.y - fall, uArea.y) - uArea.y * 0.5;
    p.x += sin(uTime * 0.45 + aSeed) * 0.8 + sin(uTime * 0.9 + aSeed * 3.1) * 0.25;
    p.z += cos(uTime * 0.37 + aSeed * 1.7) * 0.6;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aScale * (90.0 / -mv.z);

    // Fade with distance so flakes melt into the fog
    vAlpha = smoothstep(60.0, 8.0, -mv.z) * smoothstep(0.3, 1.6, -mv.z);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor, a * a * vAlpha * uOpacity);
  }
`;

export default function Snow({
  count = 3500,
  area = [70, 36, 70],
  position = [0, 14, 0],
  color = "#ffffff",
  size = 1,
  speed = 1.1,
  opacity = 0.9,
}: Props) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const dpr = useThree((s) => s.viewport.dpr);

  const geometry = useMemo(() => {
    const rand = mulberry32(count);
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rand() - 0.5) * area[0];
      positions[i * 3 + 1] = rand() * area[1];
      positions[i * 3 + 2] = (rand() - 0.5) * area[2];
      scales[i] = 0.35 + rand() * 0.9;
      seeds[i] = rand() * 100;
    }
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return g;
  }, [count, area]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: size },
      uSpeed: { value: speed },
      uScroll: { value: 0 },
      uArea: { value: new THREE.Vector3(...area) },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
    }),
    [size, speed, area, color, opacity]
  );

  useFrame((state) => {
    const u = matRef.current!.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    // Scrolling stirs the flakes upward, like walking into the wind
    u.uScroll.value = -store.current;
    u.uSize.value = size * Math.min(dpr, 2);
  });

  return (
    <points geometry={geometry} position={position} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}
