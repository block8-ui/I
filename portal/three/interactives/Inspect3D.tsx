"use client";

import { useFrame } from "@react-three/fiber";
import { type ReactNode, useRef } from "react";
import * as THREE from "three";
import type { Interactive } from "../../lib/content";
import { useSession } from "../../lib/session";
import { COLORS } from "../shared";
import { Label, hoverProps } from "./kit";

type InspectSpec = Extract<Interactive, { kind: "inspect" }>;

function Holo({ color, children }: { color: string; children: ReactNode }) {
  return (
    <group>
      {children}
      <mesh position={[0, -0.55, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.36, 0.42, 32]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.12, 0]}>
        <cylinderGeometry args={[0.5, 0.4, 0.85, 24, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.012} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Small hologram model for each kind of tool */
function ToolModel({ id, color }: { id: string; color: string }) {
  const bars = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (bars.current)
      bars.current.children.forEach((b, i) => {
        b.scale.y = 0.4 + Math.abs(Math.sin(s.clock.elapsedTime * 3 + i * 1.3)) * 1.1;
      });
  });
  const mat = <meshBasicMaterial color={color} wireframe toneMapped={false} />;
  const solid = <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} transparent opacity={0.85} />;

  switch (id) {
    case "chat":
      return (
        <group>
          <mesh>
            <boxGeometry args={[0.7, 0.45, 0.12]} />
            {solid}
          </mesh>
          <mesh position={[-0.2, -0.3, 0]} rotation-z={0.4}>
            <coneGeometry args={[0.09, 0.2, 3]} />
            {solid}
          </mesh>
        </group>
      );
    case "image":
      return (
        <group>
          <mesh>
            <planeGeometry args={[0.75, 0.55, 4, 3]} />
            {mat}
          </mesh>
          <mesh position={[0, -0.05, 0.02]}>
            <coneGeometry args={[0.22, 0.32, 3]} />
            {solid}
          </mesh>
          <mesh position={[0.22, 0.14, 0.02]}>
            <circleGeometry args={[0.07, 16]} />
            <meshBasicMaterial color="#fff2b0" toneMapped={false} />
          </mesh>
        </group>
      );
    case "speech":
      return (
        <group ref={bars}>
          {[-0.3, -0.15, 0, 0.15, 0.3].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <boxGeometry args={[0.08, 0.35, 0.08]} />
              {solid}
            </mesh>
          ))}
        </group>
      );
    case "translate":
      return (
        <group>
          <mesh position={[-0.13, 0.05, 0]}>
            <torusGeometry args={[0.2, 0.025, 8, 32]} />
            {solid}
          </mesh>
          <mesh position={[0.13, -0.05, 0.05]}>
            <torusGeometry args={[0.2, 0.025, 8, 32]} />
            {solid}
          </mesh>
          <Label size={0.16} position={[-0.13, 0.05, 0.05]} color={color}>
            A
          </Label>
          <Label size={0.16} position={[0.13, -0.05, 0.1]} color={color}>
            B
          </Label>
        </group>
      );
    case "code":
      return (
        <Label size={0.42} color={color}>
          {"</>"}
        </Label>
      );
    default:
      return (
        <group rotation-z={-0.5}>
          <mesh position={[0.05, 0.08, 0]}>
            <torusGeometry args={[0.18, 0.04, 10, 32]} />
            {solid}
          </mesh>
          <mesh position={[0.05, -0.22, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.3, 10]} />
            {solid}
          </mesh>
        </group>
      );
  }
}

function Tool({ tool, index, accent }: { tool: InspectSpec["tools"][number]; index: number; accent: string }) {
  const ref = useRef<THREE.Group>(null);
  const model = useRef<THREE.Group>(null);
  const inspecting = useSession((s) => s.inspecting);
  const seen = useSession((s) => !!s.inspected[tool.id]);
  const active = inspecting === tool.id;
  const col = index % 3;
  const row = Math.floor(index / 3);
  const home = new THREE.Vector3((col - 1) * 1.95, 1.05 - row * 2.15, 0);

  useFrame((s, d) => {
    const g = ref.current!;
    const scale = active ? 1.35 : inspecting ? 0.85 : 1;
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, scale, 8, d));
    g.position.z = THREE.MathUtils.damp(g.position.z, active ? 0.6 : 0, 8, d);
    model.current!.rotation.y = s.clock.elapsedTime * (active ? 1.4 : 0.5) + index;
    model.current!.position.y = 0.15 + Math.sin(s.clock.elapsedTime * 1.5 + index) * 0.05;
  });

  const ring = seen ? COLORS.good : accent;
  return (
    <group
      ref={ref}
      position={home}
      onClick={(e) => {
        e.stopPropagation();
        const s = useSession.getState();
        s.set({ inspecting: tool.id, inspected: { ...s.inspected, [tool.id]: true } });
      }}
      {...hoverProps}
    >
      <Holo color={ring}>
        <group ref={model}>
          <ToolModel id={tool.id} color={accent} />
        </group>
      </Holo>
      <Label size={0.14} position={[0, -0.82, 0.1]} color={seen ? "#ffffff" : "#b9c6dc"}>
        {tool.name}
      </Label>
      <Label size={0.085} position={[0, -1.02, 0.1]} color={seen ? COLORS.good : "#7d8aa3"}>
        {seen ? "INSPECTED" : "CLICK TO INSPECT"}
      </Label>
    </group>
  );
}

export default function Inspect3D({ spec, accent }: { spec: InspectSpec; accent: string }) {
  return (
    <group>
      {/* Two workbench shelves */}
      {[0.42, -1.73].map((y) => (
        <mesh key={y} position={[0, y, -0.1]}>
          <boxGeometry args={[6.1, 0.1, 0.9]} />
          <meshStandardMaterial color="#222c3e" metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
      {spec.tools.map((t, i) => (
        <Tool key={t.id} tool={t} index={i} accent={accent} />
      ))}
    </group>
  );
}
