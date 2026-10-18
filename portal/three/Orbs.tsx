"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { subscribe } from "../lib/events";
import { runtime, useNav } from "../lib/nav";
import { focusPoint } from "../lib/world";

const MAX = 64;
const tmp = { m: new THREE.Matrix4(), v: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3(), target: new THREE.Vector3() };

type Orb = { from: THREE.Vector3; jitter: THREE.Vector3; t: number; delay: number; alive: boolean };

/**
 * XP orbs: on every XP award, glowing orbs burst from what the student just
 * did and stream into the XP meter in the top-right corner of the screen.
 */
export default function Orbs() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const orbs = useRef<Orb[]>([]);

  useEffect(
    () =>
      subscribe((e) => {
        if (e.type !== "xp" || runtime.reducedMotion) return;
        const origin = focusPoint(useNav.getState().location);
        const count = Math.min(14, Math.max(3, Math.round(e.amount / 5)));
        for (let i = 0; i < count; i++) {
          const slot = orbs.current.find((o) => !o.alive);
          const orb: Orb = {
            from: origin.clone(),
            jitter: new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2.2, (Math.random() - 0.5) * 3),
            t: 0,
            delay: i * 0.05,
            alive: true,
          };
          if (slot) Object.assign(slot, orb);
          else if (orbs.current.length < MAX) orbs.current.push(orb);
        }
      }),
    []
  );

  useFrame(({ camera }, delta) => {
    const m = mesh.current!;
    // The XP meter sits top-right: a point just in front of the camera there
    tmp.target.set(0.82, 0.86, 0.5).unproject(camera);
    tmp.v.copy(tmp.target).sub(camera.position).normalize();
    tmp.target.copy(camera.position).addScaledVector(tmp.v, 2.5);

    for (let i = 0; i < MAX; i++) {
      const o = orbs.current[i];
      if (!o || !o.alive) {
        tmp.m.makeScale(0, 0, 0);
        m.setMatrixAt(i, tmp.m);
        continue;
      }
      if (o.delay > 0) {
        o.delay -= delta;
        tmp.m.makeScale(0, 0, 0);
        m.setMatrixAt(i, tmp.m);
        continue;
      }
      o.t += delta / 1.15;
      if (o.t >= 1) {
        o.alive = false;
        continue;
      }
      // Burst outwards first, then curve into the meter
      const burst = Math.min(1, o.t / 0.3);
      const home = Math.max(0, (o.t - 0.2) / 0.8);
      const e = home * home * (3 - 2 * home);
      tmp.v.copy(o.from).addScaledVector(o.jitter, Math.sin(burst * Math.PI * 0.5));
      tmp.v.lerp(tmp.target, e);
      const size = 0.13 * (1 - e * 0.85);
      tmp.m.compose(tmp.v, tmp.q, tmp.s.setScalar(size));
      m.setMatrixAt(i, tmp.m);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, MAX]} frustumCulled={false} renderOrder={10}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshBasicMaterial color={[4, 3.1, 1.2]} toneMapped={false} depthTest={false} />
    </instancedMesh>
  );
}
