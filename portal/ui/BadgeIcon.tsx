import type { BadgeShape } from "../lib/content";

const PATHS: Record<BadgeShape, string> = {
  star: "M0,-48 L11,-15 L46,-15 L18,6 L29,40 L0,19 L-29,40 L-18,6 L-46,-15 L-11,-15 Z",
  hex: "M0,-46 L40,-23 L40,23 L0,46 L-40,23 L-40,-23 Z",
  diamond: "M0,-50 L34,0 L0,50 L-34,0 Z",
  bolt: "M8,-50 L-28,-2 L-2,-2 L-12,50 L30,-6 L4,-6 Z",
  shield: "M0,-48 L38,-34 Q38,20 0,50 Q-38,20 -38,-34 Z",
  ring: "M0,-45 A45,45 0 1,1 -0.1,-45 Z M0,-24 A24,24 0 1,0 0.1,-24 Z",
};

/** Flat version of the 3D medal, for the overlay */
export default function BadgeIcon({
  shape,
  color,
  earned,
  size = 40,
}: {
  shape: BadgeShape;
  color: string;
  earned: boolean;
  size?: number;
}) {
  return (
    <svg viewBox="-55 -55 110 110" width={size} height={size} aria-hidden="true" className="shrink-0">
      <path
        d={PATHS[shape]}
        fillRule="evenodd"
        fill={earned ? color : "#151d2c"}
        stroke={earned ? "#ffffff" : "#3a4660"}
        strokeOpacity={earned ? 0.5 : 1}
        strokeWidth={3}
        style={earned ? { filter: `drop-shadow(0 0 6px ${color})` } : undefined}
      />
    </svg>
  );
}
