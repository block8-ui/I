/**
 * Fire-and-forget events from the progress system to the UI and 3D world
 * (XP pop-ups, badge reveals, orbs flying into the XP meter).
 */
export type PortalEvent =
  | { type: "xp"; amount: number; reason: string }
  | { type: "badge"; id: string }
  | { type: "level"; index: number; name: string }
  | { type: "module"; id: string };

type Listener = (e: PortalEvent) => void;
const listeners = new Set<Listener>();

export function emit(e: PortalEvent) {
  listeners.forEach((l) => l(e));
}

export function subscribe(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
