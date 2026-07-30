import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getLandscapeProjects } from "@/lib/landscape-data";

import { getDictionary, hasLocale } from "../dictionaries";
import KeynoteExperience from "./keynote-experience";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/keynote">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};

  const dict = await getDictionary(lang);
  return {
    title: dict.keynote.title,
    description: dict.keynote.description,
  };
}

export default async function KeynotePage({
  params,
}: PageProps<"/[lang]/keynote">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const projects = getLandscapeProjects();

  return <KeynoteExperience projects={projects} />;
}
