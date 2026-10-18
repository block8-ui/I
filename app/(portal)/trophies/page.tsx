import type { Metadata } from "next";
import TrophiesView from "@/portal/ui/views/TrophiesView";

export const metadata: Metadata = { title: "Trophy hall" };

export default function Trophies() {
  return <TrophiesView />;
}
