import type { Metadata } from "next";
import ArchiveView from "@/portal/ui/views/ArchiveView";

export const metadata: Metadata = { title: "Archive" };

export default function Archive() {
  return <ArchiveView />;
}
