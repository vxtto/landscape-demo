"use client";

import { ArrowUpRightIcon } from "lucide-react";
import Image from "next/image";

import {
  type ApacheDomainKey,
  apacheDomains,
} from "./apache-ecosystem";
import styles from "./page.module.css";

export default function ApacheProjectAtlas({
  activeDomain,
  onDomainChange,
  stage = false,
}: {
  activeDomain: ApacheDomainKey;
  onDomainChange?: (domain: ApacheDomainKey) => void;
  stage?: boolean;
}) {
  return (
    <div
      className={`${styles.apacheAtlas} ${styles.deepDive}`}
      data-stage={stage ? "true" : undefined}
    >
      <div className={styles.apacheAtlasHeading}>
        <div>
          <strong>APACHE PROJECT ATLAS</strong>
          <span>项目领域 × Agentic landscape 入选</span>
        </div>
        <dl>
          <div><dt>领域</dt><dd>7 个</dd></div>
          <div><dt>分类</dt><dd>DOAP 多标签</dd></div>
          <div><dt>数量</dt><dd>领域间有重叠</dd></div>
          <div><dt>头部项目</dt><dd>主要 GitHub repo stars</dd></div>
        </dl>
      </div>

      <div className={styles.apacheAtlasBody}>
        <div
          className={styles.apacheDomainTabs}
          role="tablist"
          aria-label="Apache 技术领域"
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
              <span>PROJECT RECORDS · MULTI-LABEL</span>
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
            <p>HEAD PROJECTS · GITHUB STARS SNAPSHOT</p>
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
            <p>SELECTED INTO AGENTIC LANDSCAPE</p>
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
              <small>当前主图没有从这一官方分类直接入选的 ASF 项目。</small>
            )}
          </div>
        </article>
      </div>

      <div className={styles.apacheMetadataGap}>
        <strong>46</strong>
        <div>
          <span>virtual project records without TLP DOAP categories</span>
          <p>
            Paimon、Gravitino、Fory、Celeborn 等项目存在于目录，但没有可用于这次分类的项目 DOAP
            标签。这 46 条记录不计入领域统计，下方按照技术角色呈现相关项目。
          </p>
        </div>
        <div className={styles.apacheSourceLinks}>
          <a
            href="https://projects.apache.org/"
            target="_blank"
            rel="noreferrer"
            tabIndex={stage ? -1 : undefined}
          >
            Projects Directory <ArrowUpRightIcon aria-hidden="true" />
          </a>
          <a
            href="https://github.com/apache"
            target="_blank"
            rel="noreferrer"
            tabIndex={stage ? -1 : undefined}
          >
            GitHub apache org <ArrowUpRightIcon aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
