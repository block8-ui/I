"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { NEURON_INPUTS, SCENARIOS, neuronFires, neuronSum } from "../../lib/engines";
import { useSession } from "../../lib/session";
import { COLORS } from "../shared";
import { Label, Tile, hoverProps } from "./kit";

const POS_W = new THREE.Color("#5ee7ff");
const NEG_W = new THREE.Color("#ff6b8a");
const OUT = new THREE.Vector3(1.75, -0.35, 0);
const INPUTS = [0.9, -0.1, -1.1].map((y) => new THREE.Vector3(-1.9, y, 0));
const BIAS = new THREE.Vector3(-1.9, -2.1, 0);

/** A connection whose thickness and colour show its weight; pulses flow when active */
function Wire({ from, weight, active }: { from: THREE.Vector3; weight: number; active: boolean }) {
  const pulse = useRef<THREE.Mesh>(null);
  const { mid, len, quat } = useMemo(() => {
    const dir = OUT.clone().sub(from);
    return {
      mid: from.clone().addScaledVector(dir, 0.5),
      len: dir.length(),
      quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()),
    };
  }, [from]);
  const color = (weight >= 0 ? POS_W : NEG_W).clone().multiplyScalar(active ? 1.8 : 0.5);
  const radius = 0.012 + Math.abs(weight) * 0.055;

  useFrame((s) => {
    const p = pulse.current!;
    p.visible = active && Math.abs(weight) > 0.05;
    const t = (s.clock.elapsedTime * 0.8) % 1;
    p.position.lerpVectors(from, OUT, t);
  });

  return (
    <group>
      <mesh position={mid} quaternion={quat}>
        <cylinderGeometry args={[radius, radius, len, 10, 1, true]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh ref={pulse}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial color={[3, 3, 3]} toneMapped={false} />
      </mesh>
      <Label size={0.13} color={weight >= 0 ? "#9ff0ff" : "#ffa3b5"} position={[mid.x, mid.y + 0.2, 0.1]}>
        {`w = ${weight.toFixed(1)}`}
      </Label>
    </group>
  );
}

export default function Weights3D({ accent }: { accent: string }) {
  const w = useSession((s) => s.weights);
  const scenario = useSession((s) => s.scenario);
  const sc = SCENARIOS[scenario];
  const fires = neuronFires(w, sc.inputs);
  const sum = neuronSum(w, sc.inputs);
  const outMat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((s, d) => {
    const m = outMat.current!;
    m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity, fires ? 1.4 + Math.sin(s.clock.elapsedTime * 4) * 0.2 : 0.05, 6, d);
  });

  return (
    <group>
      {/* Day cards */}
      {SCENARIOS.map((s, i) => {
        const ok = neuronFires(w, s.inputs) === s.target;
        return (
          <group
            key={s.id}
            position={[(i - 1.5) * 1.45, 2.25, 0]}
            onClick={(e) => {
              e.stopPropagation();
              useSession.getState().set({ scenario: i });
            }}
            {...hoverProps}
          >
            <Tile width={1.32} height={0.6} accent={ok ? COLORS.good : COLORS.bad} glow={i === scenario ? 0.9 : 0.2}>
              <Label size={0.12} position={[0, 0.1, 0]}>
                {s.name}
              </Label>
              <Label size={0.085} color={ok ? COLORS.good : COLORS.bad} position={[0, -0.13, 0]}>
                {ok ? "CORRECT" : "WRONG"}
              </Label>
            </Tile>
          </group>
        );
      })}

      {INPUTS.map((p, i) => (
        <Wire key={i} from={p} weight={w[i]} active={sc.inputs[i] === 1} />
      ))}
      <Wire from={BIAS} weight={w[3]} active />

      {INPUTS.map((p, i) => {
        const on = sc.inputs[i] === 1;
        return (
          <group key={i} position={p}>
            <mesh>
              <sphereGeometry args={[0.24, 24, 24]} />
              <meshStandardMaterial color={on ? accent : "#26324a"} emissive={accent} emissiveIntensity={on ? 1 : 0} />
            </mesh>
            <Label size={0.13} anchorX="right" position={[-0.38, 0, 0]} color={on ? "#ffffff" : "#7d8aa3"}>
              {`${NEURON_INPUTS[i]} = ${sc.inputs[i]}`}
            </Label>
          </group>
        );
      })}
      <group position={BIAS}>
        <mesh>
          <boxGeometry args={[0.32, 0.32, 0.32]} />
          <meshStandardMaterial color="#3a4660" emissive="#9fb0cf" emissiveIntensity={0.3} />
        </mesh>
        <Label size={0.13} anchorX="right" position={[-0.38, 0, 0]} color="#b9c6dc">
          Bias
        </Label>
      </group>

      <group position={OUT}>
        <mesh>
          <sphereGeometry args={[0.48, 32, 32]} />
          <meshStandardMaterial ref={outMat} color={fires ? COLORS.good : "#26324a"} emissive={COLORS.good} emissiveIntensity={0} />
        </mesh>
        <Label size={0.2} position={[0, 0.8, 0]} color={fires ? COLORS.good : "#b9c6dc"}>
          {fires ? "UMBRELLA: YES" : "UMBRELLA: NO"}
        </Label>
        <Label size={0.11} position={[0, -0.75, 0]} color="#8fa0bd">
          {`sum = ${sum.toFixed(2)}  ${fires ? "> 0, fires" : "≤ 0, stays off"}`}
        </Label>
        <Label size={0.11} position={[0, -0.95, 0]} color={sc.target === fires ? COLORS.good : COLORS.bad}>
          {`${sc.name} should be: ${sc.target ? "YES" : "NO"}`}
        </Label>
      </group>
    </group>
  );
}
