import Shell from "@/portal/ui/Shell";

export default function PortalLayout({ children }: LayoutProps<"/">) {
  return <Shell>{children}</Shell>;
}
