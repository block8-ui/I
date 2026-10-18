"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { Interactive } from "../../lib/content";
import { useSession } from "../../lib/session";
import { COLORS } from "../shared";
import { Label, Tile, hoverProps } from "./kit";

type SelectSpec = Extract<Interactive, { kind: "select" }>;

const W = 2.95;
const H = 1.0;
const EMITTER = new THREE.Vector3(0, -2.55, 0.4);

function slot(i: number) {
  return new THREE.Vector3((i % 2 === 0 ? -1 : 1) * 1.55, 1.75 - Math.floor(i / 2) * 1.18, 0);
}

/** Scanner beam from the emitter to a targeted statement */
function Beam({ to, on }: { to: THREE.Vector3; on: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const dir = to.clone().sub(EMITTER);
  const len = dir.length();
  const mid = EMITTER.clone().addScaledVector(dir, 0.5);
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  useFrame((s, d) => {
    mat.current!.opacity = THREE.MathUtils.damp(mat.current!.opacity, on ? 0.55 + Math.sin(s.clock.elapsedTime * 12) * 0.15 : 0, 10, d);
  });
  return (
    <mesh ref={ref} position={mid} quaternion={quat}>
      <cylinderGeometry args={[0.012, 0.012, len, 6, 1, true]} />
      <meshBasicMaterial ref={mat} color={[3, 0.6, 0.9]} toneMapped={false} transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

export default function Select3D({ spec, accent }: { spec: SelectSpec; accent: string }) {
  const select = useSession((s) => s.select);
  const checked = useSession((s) => s.selectChecked);

  return (
    <group>
      {spec.statements.map((st, i) => {
        const on = !!select[st.id];
        const right = on === st.isFalse;
        const color = checked ? (right ? COLORS.good : COLORS.bad) : on ? COLORS.bad : accent;
        const p = slot(i);
        return (
          <group key={st.id}>
            <group
              position={p}
              onClick={(e) => {
                e.stopPropagation();
                const s = useSession.getState();
                s.set({ select: { ...s.select, [st.id]: !s.select[st.id] }, selectChecked: false });
              }}
              {...hoverProps}
            >
              <Tile width={W} height={H} accent={color} glow={on || checked ? 0.7 : 0.15}>
                <Label size={0.1} maxWidth={W - 0.5} position={[-0.12, 0, 0]} anchorX="center">
                  {st.text}
                </Label>
                {/* Target reticle */}
                <group position={[W / 2 - 0.24, 0, 0.01]}>
                  <mesh>
                    <ringGeometry args={[0.11, 0.135, 32]} />
                    <meshBasicMaterial color={on ? [3, 0.6, 0.9] : "#5a6884"} toneMapped={false} />
                  </mesh>
                  {on && (
                    <mesh>
                      <circleGeometry args={[0.05, 16]} />
                      <meshBasicMaterial color={[3, 0.6, 0.9]} toneMapped={false} />
                    </mesh>
                  )}
                </group>
              </Tile>
            </group>
            <Beam to={p.clone().add(new THREE.Vector3(W / 2 - 0.24, 0, 0.05))} on={on && !checked} />
          </group>
        );
      })}

      {/* Scanner emitter */}
      <group position={EMITTER}>
        <mesh>
          <cylinderGeometry args={[0.32, 0.42, 0.22, 24]} />
          <meshStandardMaterial color="#1c2537" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.13, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshBasicMaterial color={[3, 0.6, 0.9]} toneMapped={false} />
        </mesh>
        <Label size={0.12} color="#ff9ab3" position={[0, -0.32, 0.2]}>
          {`TARGETED: ${Object.values(select).filter(Boolean).length}`}
        </Label>
      </group>
    </group>
  );
}
