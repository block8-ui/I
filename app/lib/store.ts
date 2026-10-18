/**
 * Shared, mutable scroll/pointer state. Read inside animation loops (useFrame,
 * requestAnimationFrame) so scrolling never triggers React re-renders.
 */
export const store = {
  /** Raw scroll progress 0..1 */
  target: 0,
  /** Damped scroll progress 0..1 — drive all animation from this */
  current: 0,
  pointerX: 0,
  pointerY: 0,
  /** True once every shader has compiled and the loader can lift */
  warm: false,
  /** Progress the camera is parked at during warm-up, behind the loader */
  warmupView: 0,
};

/** Progress where the camera passes through the door into the crystal chamber */
export const PORTAL_AT = 0.66;

/** Where the crystal chamber lives in world space (far from the igloo) */
export const CHAMBER_ORIGIN: [number, number, number] = [0, 0, -500];

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInCubic = (t: number) => t * t * t;
export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export type Chapter = {
  index: string;
  kicker: string;
  title: string;
  body: string;
  start: number;
  end: number;
};

export const CHAPTERS: Chapter[] = [
  {
    index: "00",
    kicker: "Arctic build studio",
    title: "Floe",
    body: "A shelter for people building at the edge of the map. Scroll to raise it.",
    start: 0,
    end: 0.12,
  },
  {
    index: "01",
    kicker: "Foundation",
    title: "Every block is laid by a member",
    body: "Nothing here is handed down. Each block is cut, carried and set by someone who wants a place to work.",
    start: 0.12,
    end: 0.32,
  },
  {
    index: "02",
    kicker: "Structure",
    title: "The weight is shared, so it holds",
    body: "A dome stands because every block leans on the ones beside it. So does the community.",
    start: 0.32,
    end: 0.5,
  },
  {
    index: "03",
    kicker: "Entrance",
    title: "Then someone lights the door",
    body: "Step through. It's warmer inside.",
    start: 0.5,
    end: PORTAL_AT,
  },
  {
    index: "04",
    kicker: "Inside",
    title: "What we're building",
    body: "Each crystal is a project grown by members, in the open.",
    start: PORTAL_AT,
    end: 0.88,
  },
  {
    index: "05",
    kicker: "Join",
    title: "Get a spot by the fire",
    body: "We're letting people in a few at a time.",
    start: 0.88,
    end: 1.01,
  },
];

export const PROJECTS = [
  { name: "Driftwork", tag: "Tools for remote crews" },
  { name: "Northlight", tag: "Open weather data" },
  { name: "Kiln", tag: "Hardware co-op" },
  { name: "Polar Labs", tag: "Research grants" },
  { name: "Aurora Grid", tag: "Community energy" },
];

/** Angle the camera faces the chamber from when the project list begins */
const CHAMBER_START_ANGLE = -0.3;

/** Camera orbit angle around the chamber for scroll progress p */
export function chamberAngle(p: number) {
  const [a, b] = PROJECTS_RANGE;
  return (
    CHAMBER_START_ANGLE -
    0.5 * (1 - range(p, PORTAL_AT, a)) +
    Math.PI * 2 * range(p, a, b) +
    0.5 * range(p, b, 1)
  );
}

/** Scroll window where the project list is stepped through */
export const PROJECTS_RANGE: [number, number] = [0.68, 0.86];

export function activeProjectAt(p: number) {
  if (p < PROJECTS_RANGE[0] || p > PROJECTS_RANGE[1] + 0.02) return -1;
  return Math.min(PROJECTS.length - 1, Math.floor(range(p, ...PROJECTS_RANGE) * PROJECTS.length));
}
