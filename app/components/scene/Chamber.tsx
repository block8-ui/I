"use client";

import { MeshReflectorMaterial, MeshTransmissionMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { mulberry32 } from "../../lib/random";
import { PORTAL_AT, PROJECTS, PROJECTS_RANGE, activeProjectAt, chamberAngle, store } from "../../lib/store";

const FLOOR_Y = -1.5;
const EMBER = new THREE.Color("#ff9a4d");
const COLD = new THREE.Color("#7fb2ff");

/* ---------- Geometry ---------- */

/** A single quartz point: hexagonal prism with a faceted tip, base at the origin */
function quartz(radius: number, height: number, tip: number) {
  const body = new THREE.CylinderGeometry(radius * 0.94, radius, height, 6, 1, true);
  body.translate(0, height / 2, 0);
  const cap = new THREE.ConeGeometry(radius * 0.94, tip, 6, 1, true);
  cap.translate(0, height + tip / 2, 0);
  // Non-indexed so every facet gets its own flat normal
  const merged = mergeGeometries([body.toNonIndexed(), cap.toNonIndexed()])!;
  merged.computeVertexNormals();
  return merged;
}

/** Points growing out of a shared base, tilted outward around it */
function cluster(seed: number, count: number, scale: number) {
  const rand = mulberry32(seed);
  const parts: THREE.BufferGeometry[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const spin = new THREE.Quaternion();

  for (let i = 0; i < count; i++) {
    const main = i === 0;
    const az = rand() * Math.PI * 2;
    const tilt = main ? 0.05 : 0.25 + rand() * 0.75;
    const out = new THREE.Vector3(Math.cos(az), 0, Math.sin(az));
    const axis = new THREE.Vector3().crossVectors(up, out).normalize();
    q.setFromAxisAngle(axis, tilt);
    spin.setFromAxisAngle(up, rand() * Math.PI);
    q.multiply(spin);

    const r = main ? 0.62 : 0.16 + rand() * 0.34;
    const h = main ? 3.4 : 0.6 + rand() * 2.1 * (1 - tilt * 0.45);
    const g = quartz(r, h, r * (1.5 + rand() * 0.6));
    const offset = main ? 0 : 0.25 + rand() * 0.55;
    m.compose(new THREE.Vector3(out.x * offset, -0.15, out.z * offset), q, new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(m);
    parts.push(g);
  }
  const merged = mergeGeometries(parts)!;
  merged.scale(scale, scale, scale);
  return merged;
}

/** Rough dark rock the crystals grow from */
function rock(seed: number, radius: number) {
  const rand = mulberry32(seed);
  const g = new THREE.IcosahedronGeometry(radius, 1); // already non-indexed
  const pos = g.attributes.position as THREE.BufferAttribute;
  const offsets = new Map<string, number>();
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    if (!offsets.has(key)) offsets.set(key, 0.75 + rand() * 0.45);
    const k = offsets.get(key)!;
    pos.setXYZ(i, pos.getX(i) * k * 1.25, pos.getY(i) * k * 0.45, pos.getZ(i) * k * 1.25);
  }
  g.computeVertexNormals();
  return g;
}

/** Radial falloff texture for additive glows */
function glowTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.2, "rgba(255,255,255,0.5)");
  g.addColorStop(0.5, "rgba(255,255,255,0.1)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ---------- Hero crystal ---------- */

function HeroCrystal() {
  const group = useRef<THREE.Group>(null);
  const glass = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.SpriteMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const crystal = useMemo(() => cluster(7, 13, 1), []);
  const glow = useMemo(() => glowTexture(), []);
  // What the glass "sees" behind it: a cold blue haze instead of a black void
  const backdrop = useMemo(() => new THREE.Color("#2c4258"), []);
  const base = useMemo(() => rock(2, 1.25), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    group.current!.rotation.y = t * 0.06;
    // Only pay for the refraction passes while the chamber is on screen
    // Only pay for the refraction passes while the chamber is on screen (always during warm-up)
    (glass.current!.material as THREE.Material).visible = !store.warm || store.current > PORTAL_AT - 0.04;
    // A slow, steady breath rather than a flicker
    const breath = 1 + Math.sin(t * 0.9) * 0.04;
    core.current!.color.copy(EMBER).multiplyScalar(2.2 * breath);
    light.current!.intensity = 28 * breath;
  });

  return (
    <group position={[0, FLOOR_Y, 0]}>
      <group ref={group}>
        <mesh ref={glass} geometry={crystal} castShadow>
          <MeshTransmissionMaterial
            samples={6}
            resolution={512}
            backside
            backsideThickness={0.6}
            thickness={1.1}
            roughness={0.04}
            ior={1.5}
            chromaticAberration={0.35}
            anisotropicBlur={0.12}
            distortion={0.25}
            distortionScale={0.4}
            temporalDistortion={0}
            clearcoat={1}
            background={backdrop}
            color="#f2f8ff"
            attenuationColor="#bcdcff"
            attenuationDistance={3}
            envMapIntensity={2.2}
          />
        </mesh>
        <mesh geometry={base} position={[0, 0.05, 0]}>
          <meshStandardMaterial color="#0b0e13" roughness={0.75} metalness={0.2} flatShading />
        </mesh>
      </group>

      {/* The fire from the igloo, carried inside the ice */}
      <sprite position={[0, 1.3, 0]} scale={[2.4, 3.2, 1]}>
        <spriteMaterial ref={core} map={glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
      <pointLight ref={light} position={[0, 1.4, 0]} color={EMBER} distance={11} decay={2} />

      {/* Faint shaft of light falling on the cluster */}
      <mesh position={[0, 6.5, 0]}>
        <coneGeometry args={[2.6, 13, 48, 1, true]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          vertexShader={SHAFT_VERT}
          fragmentShader={SHAFT_FRAG}
        />
      </mesh>

      {/* Thin survey ring on the floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
        <ringGeometry args={[3.4, 3.415, 160]} />
        <meshBasicMaterial color="#cfe6ff" transparent opacity={0.22} toneMapped={false} />
      </mesh>
    </group>
  );
}

const SHAFT_VERT = /* glsl */ `
  varying float vY;
  varying vec3 vN;
  varying vec3 vView;
  void main() {
    vY = uv.y;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const SHAFT_FRAG = /* glsl */ `
  varying float vY;
  varying vec3 vN;
  varying vec3 vView;
  void main() {
    // Brightest near the floor, soft at the silhouette edges
    float edge = pow(abs(dot(vN, vView)), 2.0);
    float a = edge * smoothstep(1.0, 0.0, vY) * 0.028;
    gl_FragColor = vec4(vec3(0.75, 0.86, 1.0) * a, 1.0);
  }
`;

/* ---------- Project crystals ---------- */

function ProjectCrystal({ index }: { index: number }) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshPhysicalMaterial>(null);
  const ring = useRef<THREE.MeshBasicMaterial>(null);
  const glowMat = useRef<THREE.SpriteMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const level = useRef(0);
  const geometry = useMemo(() => cluster(20 + index * 7, 6, 0.5), [index]);
  const glow = useMemo(() => glowTexture(), []);

  // Evenly spaced on a circle round the hero. The camera makes one full turn
  // while the list plays, so each crystal sits just right of the hero as its
  // name comes up.
  const position = useMemo(() => {
    const [a, b] = PROJECTS_RANGE;
    const p = a + (index + 0.5) * ((b - a) / PROJECTS.length);
    const angle = chamberAngle(p) + 0.62;
    return new THREE.Vector3(Math.sin(angle) * 4.6, FLOOR_Y, Math.cos(angle) * 4.6);
  }, [index]);

  useFrame((state, delta) => {
    const active = activeProjectAt(store.current) === index;
    level.current = THREE.MathUtils.damp(level.current, active ? 1 : 0, 4, delta);
    const k = level.current;
    group.current!.rotation.y = state.clock.elapsedTime * 0.08 + index * 1.3;
    mat.current!.emissive.copy(COLD).lerp(EMBER, k);
    mat.current!.emissiveIntensity = 0.06 + k * 0.55;
    glowMat.current!.color.copy(EMBER).multiplyScalar(k * 1.1);
    ring.current!.opacity = 0.1 + k * 0.55;
    light.current!.intensity = k * 9;
  });

  return (
    <group position={position}>
      <group ref={group}>
        <mesh geometry={geometry} castShadow>
          <meshPhysicalMaterial
            ref={mat}
            color="#dcecff"
            roughness={0.12}
            metalness={0.15}
            clearcoat={1}
            clearcoatRoughness={0.05}
            iridescence={0.8}
            iridescenceIOR={1.35}
            envMapIntensity={2.6}
            transparent
            opacity={0.92}
            flatShading
          />
        </mesh>
      </group>
      <sprite position={[0, 0.4, 0]} scale={[1.8, 1.8, 1]}>
        <spriteMaterial ref={glowMat} map={glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
      <pointLight ref={light} position={[0, 0.7, 0]} color={EMBER} distance={4} decay={2} intensity={0} />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, 0]}>
        <ringGeometry args={[0.85, 0.862, 96]} />
        <meshBasicMaterial ref={ring} color="#ffd2a8" transparent opacity={0.1} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ---------- Chamber ---------- */

export default function Chamber() {
  const spotTarget = useMemo(() => new THREE.Object3D(), []);
  return (
    <group>
      <HeroCrystal />
      {PROJECTS.map((p, i) => (
        <ProjectCrystal key={p.name} index={i} />
      ))}

      {/* Black ice: a blurred mirror that catches the glow */}
      <mesh rotation-x={-Math.PI / 2} position={[0, FLOOR_Y, 0]} receiveShadow>
        <planeGeometry args={[90, 90]} />
        <MeshReflectorMaterial
          resolution={512}
          blur={[400, 120]}
          mixBlur={1}
          mixStrength={4}
          mixContrast={1}
          roughness={0.85}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.3}
          color="#06080c"
          metalness={0.55}
          mirror={0.6}
        />
      </mesh>

      {/* Cold key light from above */}
      <primitive object={spotTarget} position={[0, FLOOR_Y, 0]} />
      <spotLight
        target={spotTarget}
        position={[0, 12, 2]}
        angle={0.42}
        penumbra={1}
        intensity={140}
        color="#d8ecff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
    </group>
  );
}
