"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { runtime, useNav } from "../lib/nav";
import { locationKey, viewFor } from "../lib/world";
import { easeInOutCubic } from "./shared";

/** Width of the overlay panel on wide screens, as a fraction of the viewport */
function panelFraction(width: number) {
  return Math.min(0.46, 600 / width);
}

// Flight state (there is only one camera)
const flight = {
  key: "",
  t: 1,
  duration: 1,
  fromPos: new THREE.Vector3(),
  fromLook: new THREE.Vector3(),
  ctrl: new THREE.Vector3(),
  toPos: new THREE.Vector3(),
  toLook: new THREE.Vector3(),
  /** Last un-framed pose, so a new flight starts exactly where the old one was */
  pos: new THREE.Vector3(),
  look: new THREE.Vector3(12, 0, 0),
  sway: new THREE.Vector2(),
};
const tmp = {
  pos: new THREE.Vector3(),
  look: new THREE.Vector3(),
  a: new THREE.Vector3(),
  b: new THREE.Vector3(),
  right: new THREE.Vector3(),
};

/**
 * Flies the camera between locations along a raised arc, then frames the
 * subject beside the overlay panel (right of it on desktop, above it on phones).
 */
export default function CameraDirector() {
  useFrame((state, delta) => {
    const camera = state.camera as THREE.PerspectiveCamera;
    const { location, pointer } = useNav.getState();
    const key = locationKey(location);
    const aspect = state.size.width / state.size.height;
    // Matches the CSS `portrait:` layout, where the panel becomes a bottom sheet
    const portrait = aspect < 1;

    if (key !== flight.key) {
      const first = flight.key === "";
      flight.key = key;
      const view = viewFor(location);
      flight.toPos.copy(view.pos);
      flight.toLook.copy(view.look);
      flight.fromPos.copy(first ? view.pos.clone().add(new THREE.Vector3(30, 25, 60)) : flight.pos);
      flight.fromLook.copy(first ? view.look : flight.look);
      const dist = flight.fromPos.distanceTo(flight.toPos);
      // Arc up and away from the core so flights never pass through it
      flight.ctrl.lerpVectors(flight.fromPos, flight.toPos, 0.5);
      const outward = tmp.a.set(flight.ctrl.x, 0, flight.ctrl.z);
      if (outward.lengthSq() > 1e-4) flight.ctrl.addScaledVector(outward.normalize(), dist * 0.15);
      flight.ctrl.y += dist * 0.22;
      flight.duration = runtime.reducedMotion ? 0.001 : THREE.MathUtils.clamp(dist / 22, 1.1, 2.6) * (first ? 1.6 : 1);
      flight.t = 0;
    }

    flight.t = Math.min(1, flight.t + delta / flight.duration);
    const e = easeInOutCubic(flight.t);

    // Quadratic Bézier: from → ctrl → to
    tmp.a.lerpVectors(flight.fromPos, flight.ctrl, e);
    tmp.b.lerpVectors(flight.ctrl, flight.toPos, e);
    tmp.pos.lerpVectors(tmp.a, tmp.b, e);
    tmp.look.lerpVectors(flight.fromLook, flight.toLook, e);
    flight.look.copy(tmp.look);
    flight.pos.copy(tmp.pos);

    // Phones: pull back so the subject fits above the bottom sheet
    if (portrait) tmp.pos.sub(tmp.look).multiplyScalar(1.45).add(tmp.look);

    const dist = tmp.pos.distanceTo(tmp.look);
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    if (portrait) {
      tmp.look.y -= dist * tanV * 0.45;
    } else {
      // Put the subject in the middle of the space right of the panel
      const f = panelFraction(state.size.width);
      tmp.right.subVectors(tmp.look, tmp.pos).cross(camera.up).normalize();
      tmp.look.addScaledVector(tmp.right, -dist * tanV * aspect * f);
    }

    // Subtle pointer parallax + idle drift
    if (!runtime.reducedMotion) {
      flight.sway.x = THREE.MathUtils.damp(flight.sway.x, pointer.x, 2.5, delta);
      flight.sway.y = THREE.MathUtils.damp(flight.sway.y, pointer.y, 2.5, delta);
      const k = dist * 0.018;
      tmp.pos.x += flight.sway.x * k;
      tmp.pos.y += flight.sway.y * k * 0.6 + Math.sin(state.clock.elapsedTime * 0.4) * k * 0.3;
    }

    camera.position.copy(tmp.pos);
    camera.lookAt(tmp.look);

    const fov = portrait ? 58 : 42;
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
