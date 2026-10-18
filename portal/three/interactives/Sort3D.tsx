"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Interactive, SortSkin } from "../../lib/content";
import { useSession } from "../../lib/session";
import { COLORS } from "../shared";
import { Label, Tile, hoverProps, useGlide, useSurfaceDrag } from "./kit";

type SortSpec = Extract<Interactive, { kind: "sort" }>;

const TILE_W = 1.5;
const TILE_H = 0.7;
const BIN_Y = -1.25;
const BIN_X = 1.65;
const BIN_W = 2.9;
const BIN_H = 1.9;

function homeSlot(index: number, count: number) {
  const cols = count > 6 ? 4 : 3;
  const col = index % cols;
  const row = Math.floor(index / cols);
  const gap = cols === 4 ? 1.62 : 1.7;
  return new THREE.Vector3((col - (cols - 1) / 2) * gap, 1.95 - row * 0.78, 0.2);
}

/** Slot for the n-th item inside a bin (two small columns, filling upward) */
function binSlot(binIndex: number, n: number) {
  const x = (binIndex === 0 ? -BIN_X : BIN_X) + (n % 2 === 0 ? -0.62 : 0.62);
  const y = BIN_Y - 0.55 + Math.floor(n / 2) * 0.42;
  return new THREE.Vector3(x, y, 0.25);
}

function SortTile({
  spec,
  item,
  index,
  accent,
}: {
  spec: SortSpec;
  item: SortSpec["items"][number];
  index: number;
  accent: string;
}) {
  const ref = useRef<THREE.Group>(null);
  const dragging = useRef(false);
  const assigned = useSession((s) => s.sort[item.id] ?? null);
  const wrong = useSession((s) => s.sortWrong.includes(item.id));
  const peers = useSession((s) => s.sort);

  const target = useMemo(() => {
    if (!assigned) return homeSlot(index, spec.items.length);
    const binIndex = spec.bins.findIndex((b) => b.id === assigned);
    const n = spec.items.filter((it) => peers[it.id] === assigned).findIndex((it) => it.id === item.id);
    return binSlot(binIndex, n);
  }, [assigned, index, item.id, peers, spec]);

  useGlide(ref, () => (dragging.current ? null : target));
  useFrame((_, d) => {
    const s = assigned ? 0.72 : dragging.current ? 1.08 : 1;
    ref.current!.scale.setScalar(THREE.MathUtils.damp(ref.current!.scale.x, s, 10, d));
  });

  const drag = useSurfaceDrag({
    target: ref,
    onStart: () => {
      dragging.current = true;
    },
    onMove: (p) => ref.current!.position.set(p.x, p.y, 0.6),
    onDrop: (p, moved) => {
      dragging.current = false;
      const set = useSession.getState().set;
      const sort = { ...useSession.getState().sort };
      const wrongList = useSession.getState().sortWrong.filter((id) => id !== item.id);
      if (!moved) {
        // A tap cycles the item: tray → bin 1 → bin 2 → tray
        const order = [null, ...spec.bins.map((b) => b.id)];
        sort[item.id] = order[(order.indexOf(assigned) + 1) % order.length];
      } else if (p.y < BIN_Y + BIN_H / 2 + 0.2) {
        sort[item.id] = spec.bins[p.x < 0 ? 0 : 1].id;
      } else {
        sort[item.id] = null;
      }
      set({ sort, sortWrong: wrongList });
    },
  });

  return (
    <group ref={ref} position={homeSlot(index, spec.items.length)} {...drag} {...hoverProps}>
      <Tile width={TILE_W} height={TILE_H} accent={wrong ? COLORS.bad : accent} glow={wrong ? 0.8 : assigned ? 0.15 : 0.35}>
        <Label size={0.1} maxWidth={TILE_W - 0.14}>
          {item.label}
        </Label>
      </Tile>
    </group>
  );
}

/** Decorative receptacle for each bin; the look changes per lesson */
function BinDecor({ skin, side, accent, tilt }: { skin: SortSkin; side: 0 | 1; accent: string; tilt: number }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (ring.current) ring.current.rotation.z = s.clock.elapsedTime * (side ? -0.5 : 0.5);
  });
  const x = side === 0 ? -BIN_X : BIN_X;

  switch (skin) {
    case "tubes":
      return (
        <group position={[x, BIN_Y, -0.35]}>
          <mesh>
            <cylinderGeometry args={[1.3, 1.3, BIN_H + 0.2, 32, 1, true, Math.PI * 0.5, Math.PI]} />
            <meshBasicMaterial color={accent} transparent opacity={0.012} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          {[-1, 1].map((k) => (
            <mesh key={k} position={[0, (k * (BIN_H + 0.2)) / 2, 0]} rotation-x={Math.PI / 2}>
              <torusGeometry args={[1.3, 0.025, 6, 64, Math.PI]} />
              <meshBasicMaterial color={accent} toneMapped={false} />
            </mesh>
          ))}
        </group>
      );
    case "bench":
      return (
        <group position={[x, BIN_Y - BIN_H / 2 - 0.12, 0]}>
          <mesh>
            <boxGeometry args={[BIN_W, 0.16, 1.1]} />
            <meshStandardMaterial color="#222c3e" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.085, 0.4]}>
            <boxGeometry args={[BIN_W - 0.1, 0.012, 0.03]} />
            <meshBasicMaterial color={accent} toneMapped={false} />
          </mesh>
          {[-1, 1].map((k) => (
            <mesh key={k} position={[k * (BIN_W / 2 - 0.15), -0.5, 0]}>
              <boxGeometry args={[0.1, 0.9, 0.1]} />
              <meshStandardMaterial color="#222c3e" metalness={0.7} roughness={0.35} />
            </mesh>
          ))}
        </group>
      );
    case "scale":
      // The pans hang from a shared beam (drawn once, by side 0)
      return (
        <group position={[x, BIN_Y - BIN_H / 2 - 0.05 + tilt * (side === 0 ? -1 : 1) * BIN_X, 0]}>
          <mesh>
            <cylinderGeometry args={[1.35, 1.1, 0.12, 32]} />
            <meshStandardMaterial color="#c9b27a" metalness={0.9} roughness={0.25} />
          </mesh>
          {side === 0 && (
            <group position={[BIN_X, 2.7, -0.4]} rotation-z={tilt}>
              <mesh>
                <boxGeometry args={[BIN_X * 2 + 0.3, 0.08, 0.08]} />
                <meshStandardMaterial color="#c9b27a" metalness={0.9} roughness={0.25} />
              </mesh>
            </group>
          )}
        </group>
      );
    case "vault":
      return side === 0 ? (
        <group position={[x, BIN_Y, -0.45]}>
          <mesh rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[1.25, 1.25, 0.25, 48]} />
            <meshStandardMaterial color="#2a3346" metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh ref={ring} position={[0, 0, 0.14]}>
            <torusGeometry args={[0.95, 0.05, 8, 6]} />
            <meshStandardMaterial color="#8a97ad" metalness={0.95} roughness={0.2} />
          </mesh>
        </group>
      ) : (
        <group position={[x, BIN_Y, -0.45]}>
          <mesh ref={ring}>
            <torusGeometry args={[1.25, 0.06, 10, 96]} />
            <meshBasicMaterial color={[0.5, 2.2, 1.6]} toneMapped={false} />
          </mesh>
          <mesh>
            <circleGeometry args={[1.2, 48]} />
            <meshBasicMaterial color={accent} transparent opacity={0.015} />
          </mesh>
        </group>
      );
    case "holo":
      return (
        <group position={[x, BIN_Y - BIN_H / 2 - 0.1, 0]}>
          <mesh rotation-x={-Math.PI / 2}>
            <ringGeometry args={[1.05, 1.2, 48]} />
            <meshBasicMaterial color={side === 0 ? COLORS.bad : COLORS.good} toneMapped={false} />
          </mesh>
          <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[1.25, 1.05, 2, 32, 1, true]} />
            <meshBasicMaterial color={side === 0 ? COLORS.bad : COLORS.good} transparent opacity={0.012} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </group>
      );
  }
}

export default function Sort3D({ spec, accent }: { spec: SortSpec; accent: string }) {
  const sort = useSession((s) => s.sort);
  const counts = spec.bins.map((b) => spec.items.filter((it) => sort[it.id] === b.id).length);
  // The scale tips towards the heavier pan
  const tilt = spec.skin === "scale" ? THREE.MathUtils.clamp((counts[0] - counts[1]) * 0.035, -0.18, 0.18) : 0;

  return (
    <group>
      <group>
        {spec.bins.map((b, i) => (
          <group key={b.id}>
            <BinDecor skin={spec.skin} side={i as 0 | 1} accent={accent} tilt={tilt} />
            <group position={[i === 0 ? -BIN_X : BIN_X, BIN_Y, -0.05]}>
              <mesh>
                <planeGeometry args={[BIN_W, BIN_H]} />
                <meshBasicMaterial color={accent} transparent opacity={0.012} depthWrite={false} />
              </mesh>
              <Label size={0.15} color={accent} position={[0, -BIN_H / 2 - 0.22, 0.1]}>
                {`${b.label.toUpperCase()}  ·  ${counts[i]}`}
              </Label>
            </group>
          </group>
        ))}
      </group>
      {spec.items.map((it, i) => (
        <SortTile key={it.id} spec={spec} item={it} index={i} accent={accent} />
      ))}
    </group>
  );
}
