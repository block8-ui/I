"use client";

import { useMemo } from "react";
import * as THREE from "three";

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function valueNoise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x: number, y: number, octaves = 5) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise(x * freq, y * freq);
    freq *= 2.03;
    amp *= 0.5;
  }
  return sum;
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default function Terrain() {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(260, 260, 220, 220);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const d = Math.hypot(x, z);
      // Soft drifts near the igloo, flattened where it stands
      let h = (fbm(x * 0.05, z * 0.05) - 0.5) * 2.4 * smoothstep(6, 20, d);
      // Wind-carved ridges further out
      h += Math.pow(fbm(x * 0.02 + 10, z * 0.02 - 4, 4), 2) * 9 * smoothstep(18, 55, d);
      // Distant ice mountains on the horizon
      h += Math.pow(fbm(x * 0.012 - 7, z * 0.012 + 3, 5), 1.6) * 55 * smoothstep(55, 120, d);
      pos.setY(i, h - 0.32);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color="#eef4f8" roughness={0.93} metalness={0} envMapIntensity={0.5} />
    </mesh>
  );
}
