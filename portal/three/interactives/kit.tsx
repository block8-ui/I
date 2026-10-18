"use client";

import { RoundedBox, Text } from "@react-three/drei";
import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { type ReactNode, useMemo, useRef } from "react";
import * as THREE from "three";
import { FONT } from "../shared";

export { FONT };

/** Pointer cursor while hovering something clickable */
export const hoverProps = {
  onPointerOver: (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = "pointer";
  },
  onPointerOut: () => {
    document.body.style.cursor = "";
  },
};

export function Label({
  children,
  size = 0.12,
  color = "#e8f1ff",
  maxWidth,
  align = "center",
  anchorX = "center",
  anchorY = "middle",
  position,
  opacity = 1,
}: {
  children: ReactNode;
  size?: number;
  color?: string;
  maxWidth?: number;
  align?: "left" | "center" | "right";
  anchorX?: "left" | "center" | "right";
  anchorY?: "top" | "middle" | "bottom";
  position?: [number, number, number];
  opacity?: number;
}) {
  return (
    <Text
      font={FONT}
      fontSize={size}
      color={color}
      maxWidth={maxWidth}
      textAlign={align}
      anchorX={anchorX}
      anchorY={anchorY}
      position={position}
      lineHeight={1.25}
      fillOpacity={opacity}
    >
      {children}
    </Text>
  );
}

/** Rounded glass tile with an accent edge glow; the building block of most challenges */
export function Tile({
  width,
  height,
  depth = 0.08,
  accent,
  glow = 0,
  dim = false,
  children,
}: {
  width: number;
  height: number;
  depth?: number;
  accent: string;
  /** 0..1 emissive accent strength */
  glow?: number;
  dim?: boolean;
  children?: ReactNode;
}) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const edge = useRef<THREE.MeshBasicMaterial>(null);
  const color = useMemo(() => new THREE.Color(accent), [accent]);
  useFrame((_, d) => {
    const m = mat.current!;
    m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity, glow * 0.22, 8, d);
    m.opacity = THREE.MathUtils.damp(m.opacity, dim ? 0.4 : 0.95, 8, d);
    edge.current!.color.copy(color).multiplyScalar(0.45 + glow * 1.8);
    edge.current!.opacity = dim ? 0.25 : 1;
  });
  return (
    <group>
      <RoundedBox args={[width, height, depth]} radius={Math.min(0.06, height / 4)} smoothness={3}>
        <meshStandardMaterial
          ref={mat}
          color="#0a101c"
          emissive={color}
          emissiveIntensity={0}
          metalness={0.2}
          roughness={0.55}
          envMapIntensity={0.25}
          transparent
          opacity={0.95}
        />
      </RoundedBox>
      {/* Thin glowing outline just behind the face */}
      <mesh position={[0, 0, -depth / 2 - 0.004]}>
        <planeGeometry args={[width + 0.05, height + 0.05]} />
        <meshBasicMaterial ref={edge} color={accent} toneMapped={false} transparent />
      </mesh>
      <group position={[0, 0, depth / 2 + 0.006]}>{children}</group>
    </group>
  );
}

/**
 * Drag on the challenge surface (the stage's local XY plane). Returns pointer
 * handlers; `onMove` and `onDrop` receive the point in the parent's local space.
 */
export function useSurfaceDrag({
  target,
  onStart,
  onMove,
  onDrop,
}: {
  target: React.RefObject<THREE.Object3D | null>;
  onStart?: () => void;
  onMove?: (local: THREE.Vector3) => void;
  onDrop: (local: THREE.Vector3, moved: boolean) => void;
}) {
  const state = useRef({
    active: false,
    moved: false,
    plane: new THREE.Plane(),
    hit: new THREE.Vector3(),
    normal: new THREE.Vector3(),
    origin: new THREE.Vector3(),
    start: new THREE.Vector2(),
  });

  const toLocal = (e: ThreeEvent<PointerEvent>) => {
    const s = state.current;
    if (!e.ray.intersectPlane(s.plane, s.hit)) return null;
    const parent = target.current!.parent!;
    return parent.worldToLocal(s.hit.clone());
  };

  return {
    onPointerDown: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      const s = state.current;
      const obj = target.current!;
      const parent = obj.parent!;
      // Plane through the parent's origin, facing along its local +Z
      parent.getWorldPosition(s.origin);
      s.normal.set(0, 0, 1).transformDirection(parent.matrixWorld);
      s.plane.setFromNormalAndCoplanarPoint(s.normal, s.origin);
      s.active = true;
      s.moved = false;
      s.start.set(e.clientX, e.clientY);
      (e.target as unknown as Element).setPointerCapture(e.pointerId);
      onStart?.();
    },
    onPointerMove: (e: ThreeEvent<PointerEvent>) => {
      const s = state.current;
      if (!s.active) return;
      e.stopPropagation();
      if (!s.moved && Math.hypot(e.clientX - s.start.x, e.clientY - s.start.y) > 5) s.moved = true;
      const p = toLocal(e);
      if (p && s.moved) onMove?.(p);
    },
    onPointerUp: (e: ThreeEvent<PointerEvent>) => {
      const s = state.current;
      if (!s.active) return;
      e.stopPropagation();
      s.active = false;
      (e.target as unknown as Element).releasePointerCapture(e.pointerId);
      const p = toLocal(e) ?? target.current!.position.clone();
      onDrop(p, s.moved);
    },
  };
}

/** Smoothly moves an object towards a target position each frame */
export function useGlide(ref: React.RefObject<THREE.Object3D | null>, target: () => THREE.Vector3 | null, speed = 9) {
  useFrame((_, d) => {
    const o = ref.current;
    const t = target();
    if (!o || !t) return;
    o.position.x = THREE.MathUtils.damp(o.position.x, t.x, speed, d);
    o.position.y = THREE.MathUtils.damp(o.position.y, t.y, speed, d);
    o.position.z = THREE.MathUtils.damp(o.position.z, t.z, speed, d);
  });
}
