"use client";

import { ArrowUpRightIcon } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";

import type { Locale } from "../dictionaries";
import { type ApacheDomainKey, getApacheDomains } from "./apache-ecosystem";
import styles from "./page.module.css";

const copy = {
  en: {
    atlasTitle: "APACHE PROJECT ATLAS",
    atlasSubtitle: "Project domain × Agentic landscape inclusion",
    domainLabel: "Domain",
    domainValue: "7",
    categoryLabel: "Category",
    categoryValue: "DOAP multi-label",
    countLabel: "Count",
    countValue: "domains overlap",
    headProjectLabel: "Top projects",
    headProjectValue: "primary GitHub repo stars",
    domainTabsLabel: "Apache technology domains",
    projectRecords: "PROJECT RECORDS · MULTI-LABEL",
    headProjectsHeading: "HEAD PROJECTS · GITHUB STARS SNAPSHOT",
    selectedHeading: "SELECTED INTO AGENTIC LANDSCAPE",
    noneSelected:
      "No ASF project from this official category has been selected into the current landscape.",
    gapCount: "46",
    gapLabel: "virtual project records without TLP DOAP categories",
    gapBody:
      "Paimon, Gravitino, Fory, Celeborn, and others exist in the directory but have no project DOAP labels usable for this classification. These 46 records are excluded from the domain counts; related projects are grouped below by technical role instead.",
    projectsDirectory: "Projects Directory",
    githubOrg: "GitHub apache org",
  },
  zh: {
    atlasTitle: "APACHE PROJECT ATLAS",
    atlasSubtitle: "项目领域 × Agentic landscape 入选",
    domainLabel: "领域",
    domainValue: "7 个",
    categoryLabel: "分类",
    categoryValue: "DOAP 多标签",
    countLabel: "数量",
    countValue: "领域间有重叠",
    headProjectLabel: "头部项目",
    headProjectValue: "主要 GitHub repo stars",
    domainTabsLabel: "Apache 技术领域",
    projectRecords: "PROJECT RECORDS · MULTI-LABEL",
    headProjectsHeading: "HEAD PROJECTS · GITHUB STARS SNAPSHOT",
    selectedHeading: "SELECTED INTO AGENTIC LANDSCAPE",
    noneSelected: "当前主图没有从这一官方分类直接入选的 ASF 项目。",
    gapCount: "46",
    gapLabel: "virtual project records without TLP DOAP categories",
    gapBody:
      "Paimon、Gravitino、Fory、Celeborn 等项目存在于目录，但没有可用于这次分类的项目 DOAP 标签。这 46 条记录不计入领域统计，下方按照技术角色呈现相关项目。",
    projectsDirectory: "Projects Directory",
    githubOrg: "GitHub apache org",
  },
} as const;

export default function ApacheProjectAtlas({
  activeDomain,
  onDomainChange,
  stage = false,
  lang = "zh",
}: {
  activeDomain: ApacheDomainKey;
  onDomainChange?: (domain: ApacheDomainKey) => void;
  stage?: boolean;
  lang?: Locale;
}) {
  const t = copy[lang];
  const apacheDomains = useMemo(() => getApacheDomains(lang), [lang]);

  return (
    <div
      className={`${styles.apacheAtlas} ${styles.deepDive}`}
      data-stage={stage ? "true" : undefined}
    >
      <div className={styles.apacheAtlasHeading}>
        <div>
          <strong>{t.atlasTitle}</strong>
          <span>{t.atlasSubtitle}</span>
        </div>
        <dl>
          <div><dt>{t.domainLabel}</dt><dd>{t.domainValue}</dd></div>
          <div><dt>{t.categoryLabel}</dt><dd>{t.categoryValue}</dd></div>
          <div><dt>{t.countLabel}</dt><dd>{t.countValue}</dd></div>
          <div><dt>{t.headProjectLabel}</dt><dd>{t.headProjectValue}</dd></div>
        </dl>
      </div>

      <div className={styles.apacheAtlasBody}>
        <div
          className={styles.apacheDomainTabs}
          role="tablist"
          aria-label={t.domainTabsLabel}
        >
          {(Object.keys(apacheDomains) as ApacheDomainKey[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              tabIndex={stage ? -1 : undefined}
              aria-selected={activeDomain === key}
              className={activeDomain === key ? styles.activeDomain : ""}
              onClick={() => onDomainChange?.(key)}
            >
              <strong>{apacheDomains[key].count}</strong>
              <span>{apacheDomains[key].label}</span>
            </button>
          ))}
        </div>

        <article className={styles.apacheDomainDetail} key={activeDomain}>
          <div className={styles.apacheDomainLead}>
            <div>
              <span>{t.projectRecords}</span>
              <strong>{apacheDomains[activeDomain].count}</strong>
            </div>
            <div className={styles.apacheDomainName}>
              <h3>{apacheDomains[activeDomain].label}</h3>
              <div className={styles.apacheLabelCloud}>
                {apacheDomains[activeDomain].officialLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
            <p className={styles.apacheDomainDefinition}>
              {apacheDomains[activeDomain].definition}
            </p>
          </div>

          <div className={styles.apacheHeadProjects}>
            <p>{t.headProjectsHeading}</p>
            <div>
              {apacheDomains[activeDomain].heads.map(([name, stars]) => (
                <span key={name}>
                  <strong>{name}</strong>
                  <small>★ {stars}</small>
                </span>
              ))}
            </div>
          </div>

          <div className={styles.apacheLandscapeMatch}>
            <p>{t.selectedHeading}</p>
            {apacheDomains[activeDomain].landscape.length ? (
              <div>
                {apacheDomains[activeDomain].landscape.map((project) => (
                  <span key={project}>
                    <Image
                      src="/project-logos/apache.png"
                      alt=""
                      width={18}
                      height={18}
                    />
                    Apache {project}
                  </span>
                ))}
              </div>
            ) : (
              <small>{t.noneSelected}</small>
            )}
          </div>
        </article>
      </div>

      <div className={styles.apacheMetadataGap}>
        <strong>{t.gapCount}</strong>
        <div>
          <span>{t.gapLabel}</span>
          <p>{t.gapBody}</p>
        </div>
        <div className={styles.apacheSourceLinks}>
          <a
            href="https://projects.apache.org/"
            target="_blank"
            rel="noreferrer"
            tabIndex={stage ? -1 : undefined}
          >
            {t.projectsDirectory} <ArrowUpRightIcon aria-hidden="true" />
          </a>
          <a
            href="https://github.com/apache"
            target="_blank"
            rel="noreferrer"
            tabIndex={stage ? -1 : undefined}
          >
            {t.githubOrg} <ArrowUpRightIcon aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
