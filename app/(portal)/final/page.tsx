import type { Metadata } from "next";
import FinalView from "@/portal/ui/views/FinalView";

export const metadata: Metadata = { title: "Final challenge" };

export default function Final() {
  return <FinalView />;
}
