"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mulberry32 } from "../../lib/random";
import { easeOutCubic, range, smooth, store } from "../../lib/store";

type Block = {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  scale: THREE.Vector3;
  fromPos: THREE.Vector3;
  fromQuat: THREE.Quaternion;
  /** 0..1, when in the build sequence this block lands */
  delay: number;
  seed: number;
};

const R = 4; // dome radius to block centres
const ROWS = 8;
const PHI_MAX = (Math.PI / 2) * 0.9;
const DOOR_HALF_ANGLE = 0.22;
const DOOR_ROWS = 2;

function buildBlocks(): Block[] {
  const rand = mulberry32(11);
  const dummy = new THREE.Object3D();
  const blocks: Block[] = [];
  const dPhi = PHI_MAX / ROWS;

  const scatter = (pos: THREE.Vector3, delay: number) => {
    const angle = Math.atan2(pos.x, pos.z) + (rand() - 0.5) * 1.4;
    const dist = 6 + rand() * 9;
    const fromPos = new THREE.Vector3(Math.sin(angle) * dist, 2.5 + rand() * 7.5, Math.cos(angle) * dist);
    const fromQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(rand() * Math.PI * 2, rand() * Math.PI * 2, rand() * Math.PI * 2)
    );
    return { fromPos, fromQuat, delay, seed: rand() * 100 };
  };

  // Dome: rings of blocks on a hemisphere, offset half a block per row (brick bond)
  for (let i = 0; i < ROWS; i++) {
    const phi = (i + 0.5) * dPhi;
    const r = R * Math.cos(phi);
    const y = R * Math.sin(phi);
    const n = Math.max(5, Math.round((2 * Math.PI * r) / 1.05));
    const step = (2 * Math.PI) / n;
    const offset = (i % 2) * step * 0.5;

    for (let j = 0; j < n; j++) {
      const theta = j * step + offset;
      const wrapped = Math.atan2(Math.sin(theta), Math.cos(theta));
      if (i < DOOR_ROWS && Math.abs(wrapped) < DOOR_HALF_ANGLE) continue;

      dummy.position.set(r * Math.sin(theta), y, r * Math.cos(theta));
      dummy.lookAt(0, 0, 0);
      const pos = dummy.position.clone();
      blocks.push({
        pos,
        quat: dummy.quaternion.clone(),
        scale: new THREE.Vector3(((2 * Math.PI * r) / n) * 0.97, R * dPhi * 0.95, 0.6),
        ...scatter(pos, (i / ROWS) * 0.82 + rand() * 0.1),
      });
    }
  }

  // Cap stone
  {
    const pos = new THREE.Vector3(0, R * Math.sin(PHI_MAX) + 0.05, 0);
    blocks.push({
      pos,
      quat: new THREE.Quaternion(),
      scale: new THREE.Vector3(1.45, 0.34, 1.45),
      ...scatter(pos, 0.9),
    });
  }

  // Entrance tunnel: half-ring arches stepping out from the dome
  const archR = 1.1;
  const archN = 7;
  [3.85, 4.42, 4.99].forEach((z, ring) => {
    for (let k = 0; k < archN; k++) {
      const a = ((k + 0.5) / archN) * Math.PI;
      dummy.position.set(archR * Math.cos(a), archR * Math.sin(a) * 1.15, z);
      dummy.rotation.set(0, 0, a + Math.PI / 2);
      const pos = dummy.position.clone();
      blocks.push({
        pos,
        quat: dummy.quaternion.clone(),
        scale: new THREE.Vector3(((archR * Math.PI) / archN) * 1.02, 0.44, 0.55),
        ...scatter(pos, 0.86 + ring * 0.04 + k * 0.004),
      });
    }
  });

  return blocks;
}

// Scratch objects reused every frame
const tmp = { m: new THREE.Matrix4(), p: new THREE.Vector3(), q: new THREE.Quaternion() };

export default function Igloo() {
  const blocks = useMemo(() => buildBlocks(), []);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const doorRef = useRef<THREE.MeshBasicMaterial>(null);
  const doorMesh = useRef<THREE.Mesh>(null);
  const innerLight = useRef<THREE.PointLight>(null);
  const spillLight = useRef<THREE.PointLight>(null);
  const lastBuild = useRef(-1);

  const geometry = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 3, 0.09), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current!;
    const rand = mulberry32(3);
    const c = new THREE.Color();
    blocks.forEach((_, i) => {
      // Slight variation between packed-snow white and glacier blue
      c.setHSL(0.55 + rand() * 0.04, 0.35 + rand() * 0.25, 0.8 + rand() * 0.12);
      mesh.setColorAt(i, c);
    });
    mesh.instanceColor!.needsUpdate = true;
  }, [blocks]);

  useFrame((state) => {
    const p = store.current;
    const t = state.clock.elapsedTime;
    const build = range(p, 0.03, 0.46);
    const mesh = meshRef.current!;

    // Once fully built (and before), skip the per-instance work unless something moves
    const settled = build >= 1 && lastBuild.current >= 1;
    if (!settled) {
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        const k = easeOutCubic(range(build, b.delay * 0.78, b.delay * 0.78 + 0.22));
        tmp.p.lerpVectors(b.fromPos, b.pos, k);
        // Unplaced blocks hover and bob in the air
        tmp.p.y += Math.sin(t * 0.8 + b.seed) * 0.35 * (1 - k);
        tmp.q.slerpQuaternions(b.fromQuat, b.quat, k);
        tmp.m.compose(tmp.p, tmp.q, b.scale);
        mesh.setMatrixAt(i, tmp.m);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
    lastBuild.current = build;
    doorMesh.current!.visible = build > 0.8;

    // Warms up once the dome is complete, then breathes slowly (no flicker)
    const glow = smooth(range(p, 0.44, 0.56)) * (1 + Math.sin(t * 0.9) * 0.03);
    doorRef.current!.color.setRGB(0.04 + glow * 4.2, 0.03 + glow * 1.9, 0.03 + glow * 0.55);
    innerLight.current!.intensity = glow * 60;
    spillLight.current!.intensity = glow * 22;
  });

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[geometry, undefined, blocks.length]}
        castShadow
        receiveShadow
        frustumCulled={false}
      >
        <meshPhysicalMaterial
          roughness={0.22}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.15}
          envMapIntensity={1.1}
        />
      </instancedMesh>

      {/* Firelight seen through the tunnel */}
      <mesh ref={doorMesh} position={[0, 0, 3.62]} scale={[1, 1.15, 1]}>
        <circleGeometry args={[0.92, 40, 0, Math.PI]} />
        <meshBasicMaterial ref={doorRef} toneMapped={false} />
      </mesh>

      <pointLight ref={innerLight} position={[0, 1.2, 0]} color="#ff9445" distance={9} decay={2} intensity={0} />
      <pointLight ref={spillLight} position={[0, 0.5, 5.4]} color="#ffa25c" distance={7} decay={2} intensity={0} />
    </group>
  );
}
