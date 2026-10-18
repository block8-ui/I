"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  CHAMBER_ORIGIN,
  PORTAL_AT,
  chamberAngle,
  easeInCubic,
  easeInOut,
  lerp,
  range,
  smooth,
  store,
} from "../../lib/store";

/** Writes the camera position and look target for scroll progress p */
export function cameraAt(p: number, pos: THREE.Vector3, look: THREE.Vector3) {
  if (p < PORTAL_AT) {
    if (p < 0.5) {
      // Wide establishing shot that spirals in a full turn while the igloo builds
      const t = easeInOut(range(p, 0, 0.5));
      const angle = lerp(0.55, Math.PI * 2, t);
      const radius = lerp(24, 12, t);
      pos.set(Math.sin(angle) * radius, lerp(9, 2.6, t), Math.cos(angle) * radius);
      look.set(0, lerp(3.4, 1.2, t), 0);
    } else {
      // Push in through the tunnel towards the glowing door
      const t = easeInCubic(range(p, 0.5, PORTAL_AT));
      pos.set(0, lerp(2.6, 0.62, t), lerp(12, 3.95, t));
      look.set(0, lerp(1.2, 0.55, t), 0);
    }
    return;
  }

  const [ox, oy, oz] = CHAMBER_ORIGIN;
  const q = range(p, PORTAL_AT, 1);
  const angle = chamberAngle(p);
  const radius = 17 - 4 * smooth(range(q, 0, 0.22)) + 6 * smooth(range(q, 0.72, 1));
  const y = 1.2 + 5.5 * smooth(range(q, 0.72, 1));
  pos.set(ox + Math.sin(angle) * radius, oy + y, oz + Math.cos(angle) * radius);
  look.set(ox, oy + 0.4, oz);
}

/** How far to aim left of the subject so it sits beside the HUD copy */
function framingOffset(p: number) {
  if (p < PORTAL_AT) return 2.6 * (1 - smooth(range(p, 0.5, 0.6)));
  return 3.2 * smooth(range(p, PORTAL_AT, 0.7));
}

// Scratch state reused every frame (there is only one camera rig)
const tmp = {
  pos: new THREE.Vector3(),
  look: new THREE.Vector3(),
  right: new THREE.Vector3(),
  sway: new THREE.Vector2(),
};

export default function CameraRig() {
  useFrame((state, delta) => {
    const camera = state.camera as THREE.PerspectiveCamera;
    const p = store.warm ? store.current : store.warmupView;
    cameraAt(p, tmp.pos, tmp.look);

    // Wide screens keep the copy on the left, so push the subject right
    const aspect = state.size.width / state.size.height;
    const offset = framingOffset(p) * range(aspect, 1, 1.4);
    tmp.right.subVectors(tmp.look, tmp.pos).cross(camera.up).normalize();
    tmp.look.addScaledVector(tmp.right, -offset);

    // Tall screens put the copy at the bottom: back off and lift the subject
    const portrait = 1 - range(aspect, 0.6, 0.9);
    if (portrait > 0) {
      const k = portrait * (p < PORTAL_AT ? 1 - smooth(range(p, 0.5, 0.62)) : 1);
      tmp.pos.sub(tmp.look).multiplyScalar(1 + 0.45 * k).add(tmp.look);
      tmp.look.y -= 1.6 * k;
    }

    // Gentle pointer parallax, faded out while flying through the door
    const near = 1 - range(p, 0.55, PORTAL_AT) * (1 - range(p, PORTAL_AT, 0.7));
    tmp.sway.x = THREE.MathUtils.damp(tmp.sway.x, store.pointerX, 3, delta);
    tmp.sway.y = THREE.MathUtils.damp(tmp.sway.y, store.pointerY, 3, delta);
    camera.position.copy(tmp.pos);
    camera.position.x += tmp.sway.x * 0.7 * near;
    camera.position.y += tmp.sway.y * 0.35 * near;
    // Slow breathing drift
    camera.position.y += Math.sin(state.clock.elapsedTime * 0.6) * 0.06 * near;
    camera.lookAt(tmp.look);

    const fov = aspect < 0.8 ? 62 : 40;
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
