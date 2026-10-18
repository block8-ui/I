/**
 * World layout: where everything sits and where the camera goes for each page.
 */
import * as THREE from "three";
import type { ModuleId } from "./content";

export const ISLAND_RADIUS = 24;

const islandAt = (i: number, y: number) => {
  const a = Math.PI / 2 + (i * Math.PI * 2) / 3;
  return new THREE.Vector3(Math.cos(a) * ISLAND_RADIUS, y, Math.sin(a) * ISLAND_RADIUS);
};

export const ISLANDS: Record<ModuleId, { pos: THREE.Vector3; out: THREE.Vector3; index: number }> = {
  lab: { pos: islandAt(0, 0), out: new THREE.Vector3(), index: 0 },
  workshop: { pos: islandAt(1, 2), out: new THREE.Vector3(), index: 1 },
  council: { pos: islandAt(2, -1), out: new THREE.Vector3(), index: 2 },
};
for (const k of Object.keys(ISLANDS) as ModuleId[]) {
  const i = ISLANDS[k];
  i.out.set(i.pos.x, 0, i.pos.z).normalize();
}

/** Height of an island's platform above its centre */
export const ISLAND_TOP = 0.6;
/** Where lesson challenges float, relative to the island centre */
export const STAGE_OFFSET = new THREE.Vector3(0, ISLAND_TOP + 3.1, 0);

export const TROPHY_HALL = new THREE.Vector3(0, -60, 0);

/** Direction of the gap between the Lab and the Council: clear sightlines to the core */
export const GAP_DIR = new THREE.Vector3(Math.cos(Math.PI / 6), 0, Math.sin(Math.PI / 6));
/** The final challenge floats this far out from the core, facing the camera */
export const FINAL_DISTANCE = 6.4;

export type Location =
  | { kind: "core" }
  | { kind: "dashboard" }
  | { kind: "island"; module: ModuleId }
  | { kind: "lesson"; module: ModuleId; lesson: string }
  | { kind: "trophies" }
  | { kind: "archive" }
  | { kind: "final" };

export function locationFromPath(path: string): Location {
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "dashboard") return { kind: "dashboard" };
  if (parts[0] === "trophies") return { kind: "trophies" };
  if (parts[0] === "archive") return { kind: "archive" };
  if (parts[0] === "final") return { kind: "final" };
  if (parts[0] === "modules" && (parts[1] === "lab" || parts[1] === "workshop" || parts[1] === "council")) {
    return parts[2] ? { kind: "lesson", module: parts[1], lesson: parts[2] } : { kind: "island", module: parts[1] };
  }
  return { kind: "core" };
}

export const locationKey = (l: Location) =>
  l.kind === "lesson" ? `lesson:${l.module}:${l.lesson}` : l.kind === "island" ? `island:${l.module}` : l.kind;

export type View = { pos: THREE.Vector3; look: THREE.Vector3 };

export function viewFor(l: Location): View {
  switch (l.kind) {
    case "core":
      // From the gap between the Lab and the Council, so no island hides the core
      return { pos: new THREE.Vector3(44, 19, 27), look: new THREE.Vector3(0, -1.5, 0) };
    case "dashboard":
      return { pos: new THREE.Vector3(7, 3, 11), look: new THREE.Vector3(0, 0.3, 0) };
    case "final":
      return {
        pos: GAP_DIR.clone().multiplyScalar(FINAL_DISTANCE + 9.4).setY(1.6),
        look: GAP_DIR.clone().multiplyScalar(3).setY(0.4),
      };
    case "archive":
      return { pos: new THREE.Vector3(-34, 30, 38), look: new THREE.Vector3(0, -2, 0) };
    case "trophies":
      return {
        pos: TROPHY_HALL.clone().add(new THREE.Vector3(0, 3.4, 11.5)),
        look: TROPHY_HALL.clone().add(new THREE.Vector3(0, 1.5, -1.5)),
      };
    case "island": {
      const i = ISLANDS[l.module];
      return {
        pos: i.pos.clone().addScaledVector(i.out, 17).add(new THREE.Vector3(0, 7, 0)),
        look: i.pos.clone().add(new THREE.Vector3(0, 2.2, 0)),
      };
    }
    case "lesson": {
      const i = ISLANDS[l.module];
      const stage = i.pos.clone().add(STAGE_OFFSET);
      return {
        pos: stage.clone().addScaledVector(i.out, 11).add(new THREE.Vector3(0, 0.4, 0)),
        look: stage.clone().add(new THREE.Vector3(0, 0.1, 0)),
      };
    }
  }
}

/** Where XP orbs burst from for a location */
export function focusPoint(l: Location) {
  if (l.kind === "lesson") return ISLANDS[l.module].pos.clone().add(STAGE_OFFSET);
  if (l.kind === "island") return ISLANDS[l.module].pos.clone().add(new THREE.Vector3(0, 2, 0));
  if (l.kind === "trophies") return TROPHY_HALL.clone().add(new THREE.Vector3(0, 2, 0));
  return new THREE.Vector3(0, 0, 0);
}
