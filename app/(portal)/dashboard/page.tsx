import type { Metadata } from "next";
import DashboardView from "@/portal/ui/views/DashboardView";

export const metadata: Metadata = { title: "Dashboard" };

export default function Dashboard() {
  return <DashboardView />;
}
