"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { CHAMBER_ORIGIN, PORTAL_AT, store } from "../../lib/store";
import CameraRig from "./CameraRig";
import Chamber from "./Chamber";
import Igloo from "./Igloo";
import Snow from "./Snow";
import Terrain from "./Terrain";

const OUTSIDE = { color: new THREE.Color("#7d95a8"), near: 18, far: 95 };
const INSIDE = { color: new THREE.Color("#030508"), near: 12, far: 40 };

/**
 * Shows or hides everything drawable under `root` but leaves lights switched
 * on. three.js compiles shaders per light count, so hiding a light would
 * recompile every material in the scene the moment the camera crosses over.
 */
function setDrawablesVisible(root: THREE.Object3D, visible: boolean) {
  root.traverse((o) => {
    if (o !== root && !(o instanceof THREE.Light) && !(o instanceof THREE.Group)) o.visible = visible;
  });
}

/**
 * The snowfield and the crystal chamber. Compiles both up front (behind the
 * loader), then swaps atmosphere and which world is drawn as the camera
 * crosses the door.
 */
function Worlds({ onReady }: { onReady?: () => void }) {
  const outside = useRef<THREE.Group>(null);
  const inside = useRef<THREE.Group>(null);
  const fog = useRef<THREE.Fog>(null);
  const bg = useRef<THREE.Color>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const shown = useRef<"outside" | "inside" | null>(null);
  /** -1 while shaders compile, then counts warm-up frames */
  const warmFrames = useRef(-1);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  // Warm-up: draw both worlds while every shader compiles in parallel
  useEffect(() => {
    if (store.warm) return;
    let cancelled = false;
    setDrawablesVisible(outside.current!, true);
    setDrawablesVisible(inside.current!, true);
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => {
        if (!cancelled) warmFrames.current = 0;
      });
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera, onReady]);

  useFrame(() => {
    const inChamber = store.current >= PORTAL_AT;
    const look = inChamber ? INSIDE : OUTSIDE;
    fog.current!.color.copy(look.color);
    fog.current!.near = look.near;
    fog.current!.far = look.far;
    bg.current!.copy(look.color);
    hemi.current!.intensity = inChamber ? 0.08 : 1.1;
    sun.current!.intensity = inChamber ? 0 : 2.2;

    if (!store.warm) {
      // Some passes (glass refraction, mirror blur, shadows) only build when
      // actually seen, so look into the chamber, then back outside, before
      // the loader lifts.
      if (warmFrames.current < 0) return;
      warmFrames.current++;
      store.warmupView = warmFrames.current < 8 ? 0.8 : 0;
      if (warmFrames.current > 14) {
        store.warm = true;
        onReady?.();
      }
      return;
    }
    const want = inChamber ? "inside" : "outside";
    if (shown.current !== want) {
      shown.current = want;
      setDrawablesVisible(outside.current!, !inChamber);
      setDrawablesVisible(inside.current!, inChamber);
    }
  });

  return (
    <>
      <color ref={bg} attach="background" args={[OUTSIDE.color]} />
      <fog ref={fog} attach="fog" args={[OUTSIDE.color, OUTSIDE.near, OUTSIDE.far]} />

      <hemisphereLight ref={hemi} args={["#d6e6f2", "#6d8396", 1.1]} />
      <directionalLight
        ref={sun}
        position={[-10, 13, 9]}
        intensity={2.2}
        color="#f1f6ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={1}
        shadow-camera-far={45}
      />

      <group ref={outside}>
        <Igloo />
        <Terrain />
        <Snow />
      </group>

      <group ref={inside} position={CHAMBER_ORIGIN}>
        <Chamber />
        <Snow count={1600} area={[36, 16, 36]} position={[0, 5, 0]} color="#e8f2ff" size={0.45} speed={-0.12} opacity={0.5} />
      </group>
    </>
  );
}

export default function Scene({ onReady }: { onReady?: () => void }) {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.5]}
      camera={{ fov: 40, near: 0.1, far: 400, position: [12, 9, 20] }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
    >
      {/* Generated studio lighting for reflections — no HDR download needed */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} color="#dff1ff" position={[0, 6, -8]} scale={[16, 4, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#9cc8ff" position={[-8, 2, 4]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} />
        <Lightformer form="ring" intensity={2} color="#ffd7b0" position={[8, 3, 6]} rotation-y={-Math.PI / 2} scale={3} />
        <Lightformer form="rect" intensity={0.6} color="#ffffff" position={[0, -6, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} />
      </Environment>

      <Worlds onReady={onReady} />
      <CameraRig />

      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={0.95} luminanceSmoothing={0.2} intensity={0.9} radius={0.75} />
        <ToneMapping mode={ToneMappingMode.AGX} />
        <Vignette offset={0.25} darkness={0.55} />
        <Noise opacity={0.02} premultiply />
      </EffectComposer>
    </Canvas>
  );
}
