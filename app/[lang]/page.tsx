import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getLandscapeProjects } from "@/lib/landscape-data";

import LandscapeLogo from "../components/landscape-logo";
import LandscapeExplorer from "../components/landscape-explorer";
import styles from "../page.module.css";
import { LOCALES, getDictionary, hasLocale } from "./dictionaries";
import LocaleSwitch from "./locale-switch";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const projects = getLandscapeProjects();

  return (
    <main className={styles.page}>
      <div className={styles.appShell}>
        <header className={styles.siteHeader}>
          <a
            className={styles.brand}
            href="#landscape"
            aria-label={dict.header.homeLabel}
          >
            <LandscapeLogo className={styles.brandMark} />
            <strong>{dict.header.brand}</strong>
          </a>
          <nav className={styles.headerNav} aria-label={dict.header.navLabel}>
            <a href="#agent-infra">{dict.header.agentInfra}</a>
            <a href="#model-infra">{dict.header.modelInfra}</a>
            <a href="#signals">{dict.header.signals}</a>
            <Link className={styles.keynoteLink} href={`/${lang}/keynote`}>
              <span>{dict.header.keynoteDate}</span>
              <strong>{dict.header.keynote}</strong>
            </Link>
            <a
              href="https://github.com/antgroup/agentic-ai-landscape"
              target="_blank"
              rel="noreferrer"
            >
              {dict.header.github}
              <ArrowUpRightIcon aria-hidden="true" />
            </a>
            <LocaleSwitch
              locales={LOCALES}
              current={lang}
              label={dict.localeSwitch.label}
              names={dict.localeSwitch}
            />
          </nav>
        </header>

        <LandscapeExplorer projects={projects} />

        <footer className={styles.footer}>
          <div>
            <LandscapeLogo className={styles.footerMark} />
            <p>{dict.footer.tagline}</p>
          </div>
          <p>
            {dict.footer.dataFrom}{" "}
            <a
              href="https://github.com/antgroup/agentic-ai-landscape"
              target="_blank"
              rel="noreferrer"
            >
              {dict.footer.dataSource}
            </a>
            {dict.footer.dataNote}
          </p>
        </footer>
      </div>
    </main>
  );
}
