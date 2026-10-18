"use client";

import { create } from "zustand";
import { type Location, locationFromPath } from "./world";

/**
 * Where the student is, mirrored from the URL so the 3D world (which lives
 * in its own renderer) can follow page navigation.
 */
type Nav = {
  location: Location;
  pointer: { x: number; y: number };
  setPath: (path: string) => void;
};

export const useNav = create<Nav>()((set) => ({
  location: { kind: "core" },
  pointer: { x: 0, y: 0 },
  setPath: (path) => set({ location: locationFromPath(path) }),
}));

/** Mutable flags read inside animation loops */
export const runtime = {
  warm: false,
  reducedMotion: false,
};
