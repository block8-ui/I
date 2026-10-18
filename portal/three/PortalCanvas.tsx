"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useEffect, useRef } from "react";
import { runtime } from "../lib/nav";
import Backdrop from "./Backdrop";
import Bridges from "./Bridges";
import CameraDirector from "./CameraDirector";
import Core from "./Core";
import Islands from "./Islands";
import Orbs from "./Orbs";
import { FinalStage } from "./Stage";
import Trophies from "./Trophies";
import { COLORS } from "./shared";

/** Compiles every shader behind the loader, then reports ready after a few frames */
function Warmup({ onReady }: { onReady: () => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const frames = useRef(-1);

  useEffect(() => {
    let cancelled = false;
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => {
        if (!cancelled) frames.current = 0;
      });
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera]);

  useFrame(() => {
    if (frames.current < 0 || runtime.warm) return;
    if (++frames.current > 4) {
      runtime.warm = true;
      onReady();
    }
  });
  return null;
}

export default function PortalCanvas({ onReady }: { onReady: () => void }) {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.5]}
      camera={{ fov: 42, near: 0.1, far: 600, position: [30, 40, 110] }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      aria-hidden="true"
    >
      <color attach="background" args={[COLORS.void]} />
      <fogExp2 attach="fog" args={[COLORS.void, 0.0065]} />

      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.5} color="#cfe6ff" position={[0, 8, -10]} scale={[20, 5, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#b48cff" position={[-10, 2, 4]} rotation-y={Math.PI / 2} scale={[12, 3, 1]} />
        <Lightformer form="ring" intensity={2} color="#ffb547" position={[10, 3, 6]} rotation-y={-Math.PI / 2} scale={3} />
      </Environment>

      <hemisphereLight args={["#9fb8e0", "#0b1020", 0.55]} />
      <directionalLight position={[20, 30, 25]} intensity={1.4} color="#e6efff" />

      <Backdrop />
      <Core />
      <Islands />
      <Bridges />
      <Trophies />
      <FinalStage />
      <Orbs />

      <CameraDirector />
      <Warmup onReady={onReady} />

      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.2} intensity={1.0} radius={0.7} />
        <ToneMapping mode={ToneMappingMode.AGX} />
        <Vignette offset={0.3} darkness={0.6} />
      </EffectComposer>
    </Canvas>
  );
}
