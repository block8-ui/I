import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MODULES, getModule } from "@/portal/lib/content";
import ModuleView from "@/portal/ui/views/ModuleView";

export function generateStaticParams() {
  return MODULES.map((m) => ({ module: m.id }));
}

export const dynamicParams = false;

export async function generateMetadata(props: PageProps<"/modules/[module]">): Promise<Metadata> {
  const { module } = await props.params;
  const m = getModule(module);
  return m ? { title: `${m.place}: ${m.title}`, description: m.tagline } : {};
}

export default async function ModulePage(props: PageProps<"/modules/[module]">) {
  const { module } = await props.params;
  if (!getModule(module)) notFound();
  return <ModuleView moduleId={module} />;
}
