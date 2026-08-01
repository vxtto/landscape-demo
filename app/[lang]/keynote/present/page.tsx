import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getLandscapeProjects } from "@/lib/landscape-data";

import { getDictionary, hasLocale } from "../../dictionaries";
import KeynotePresentation from "./presentation";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/keynote/present">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};

  const dict = await getDictionary(lang);
  return {
    title: dict.keynote.present.title,
    description: dict.keynote.present.description,
  };
}

export default async function KeynotePresentationPage({
  params,
}: PageProps<"/[lang]/keynote/present">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const projects = getLandscapeProjects();

  return <KeynotePresentation projects={projects} lang={lang} />;
}
