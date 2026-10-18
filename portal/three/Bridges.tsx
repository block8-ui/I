"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { MODULES, type Module, lessonKey } from "../lib/content";
import { useProgress } from "../lib/progress";
import { ISLANDS, ISLAND_TOP } from "../lib/world";

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// uv.x runs from the island (0) to the core (1)
const FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uFill;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    float x = vUv.x;
    float dash = step(0.55, fract(x * 70.0 - uTime * 0.4));
    float built = step(x, uFill);
    float flow = 0.55 + 0.45 * sin(x * 60.0 - uTime * 4.0);
    vec3 col = uColor * (built * (1.2 + flow * 1.6) + (1.0 - built) * dash * 0.25);
    float a = built * 0.95 + (1.0 - built) * dash * 0.35;
    gl_FragColor = vec4(col, a);
  }
`;

/** Light bridge from an island to the core that builds as lessons are completed */
function Bridge({ module }: { module: Module }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const fill = useRef(0);
  const lessons = useProgress((s) => s.lessons);
  const done = module.lessons.filter((l) => lessons[lessonKey(module.id, l.id)]?.complete).length;
  const target = done / module.lessons.length;

  const geometry = useMemo(() => {
    const isl = ISLANDS[module.id];
    const start = isl.pos.clone().addScaledVector(isl.out, -4.6).add(new THREE.Vector3(0, ISLAND_TOP + 0.3, 0));
    const end = isl.out.clone().multiplyScalar(4.4);
    const mid = start.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 3.5, 0));
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return new THREE.TubeGeometry(curve, 96, 0.06, 6, false);
  }, [module.id]);

  const uniforms = useMemo(
    () => ({ uColor: { value: new THREE.Color(module.color) }, uFill: { value: 0 }, uTime: { value: 0 } }),
    [module.color]
  );

  useFrame((s, delta) => {
    fill.current = THREE.MathUtils.damp(fill.current, target, 1.5, delta);
    mat.current!.uniforms.uFill.value = fill.current;
    mat.current!.uniforms.uTime.value = s.clock.elapsedTime;
  });

  return (
    <mesh geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

export default function Bridges() {
  return (
    <>
      {MODULES.map((m) => (
        <Bridge key={m.id} module={m} />
      ))}
    </>
  );
}
