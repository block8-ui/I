import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ALL_LESSONS, getLesson } from "@/portal/lib/content";
import LessonView from "@/portal/ui/views/LessonView";

export function generateStaticParams() {
  return ALL_LESSONS.map(({ module, lesson }) => ({ module: module.id, lesson: lesson.id }));
}

export const dynamicParams = false;

export async function generateMetadata(props: PageProps<"/modules/[module]/[lesson]">): Promise<Metadata> {
  const { module, lesson } = await props.params;
  const found = getLesson(module, lesson);
  return found ? { title: found.lesson.title, description: found.lesson.summary } : {};
}

export default async function LessonPage(props: PageProps<"/modules/[module]/[lesson]">) {
  const { module, lesson } = await props.params;
  if (!getLesson(module, lesson)) notFound();
  return <LessonView moduleId={module} lessonId={lesson} />;
}
