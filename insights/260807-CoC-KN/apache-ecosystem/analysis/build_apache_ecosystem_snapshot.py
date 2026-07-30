#!/usr/bin/env python3
"""Profile Apache Projects Directory records and apache GitHub repositories.

The two inputs intentionally stay separate:

* Projects Directory records are the project-level grain used for categories.
* GitHub repositories are the repository-level grain used for stars and repo
  inventory. A project can own multiple repositories.
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from datetime import UTC, datetime
from pathlib import Path
from typing import Any


DOMAIN_LABELS: dict[str, set[str]] = {
    "data_analytics_ai": {
        "big-data",
        "database",
        "data-engineering",
        "hadoop",
        "search",
        "sql",
        "distributed-sql-database",
        "data-management-platform",
        "data-visualization",
    },
    "libraries_languages_formats": {
        "library",
        "xml",
        "java",
        "python",
        "c",
        "c++",
        "go",
        "sdk",
        "graphics",
        "regexp",
        "templating",
        "groovy",
        "php",
    },
    "network_messaging_integration": {
        "network-server",
        "network-client",
        "http",
        "integration",
        "ftp",
        "mail",
    },
    "web_application_platforms": {
        "web-framework",
        "content",
        "javaee",
        "mobile",
    },
    "cloud_build_operations": {
        "cloud",
        "build-management",
        "testing",
        "observability",
        "osgi",
        "ide",
    },
    "security_identity": {
        "security",
        "identity-management",
        "identity-provisioning",
    },
    "iot_geospatial": {"iot", "geospatial"},
}


def categories(project: dict[str, Any]) -> set[str]:
    raw = str(project.get("category") or "")
    return {part.strip().lower() for part in raw.split(",") if part.strip()}


def repository_slugs(project: dict[str, Any]) -> list[str]:
    raw = project.get("repository") or []
    values = raw if isinstance(raw, list) else [raw]
    slugs: list[str] = []
    for value in values:
        if isinstance(value, dict):
            value = value.get("location") or value.get("browse") or ""
        if not isinstance(value, str) or not value:
            continue
        slug = value.rstrip("/").split("/")[-1]
        slugs.append(re.sub(r"\.git$", "", slug))
    return slugs


def load_ndjson(path: Path) -> list[dict[str, Any]]:
    return [
        json.loads(line)
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--projects-json", type=Path, required=True)
    parser.add_argument("--repos-ndjson", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    projects: dict[str, dict[str, Any]] = json.loads(
        args.projects_json.read_text(encoding="utf-8")
    )
    repositories = load_ndjson(args.repos_ndjson)
    repositories_by_name = {repo["name"]: repo for repo in repositories}

    active_projects = {
        key: project
        for key, project in projects.items()
        if "retired" not in categories(project)
    }
    virtual_projects = {
        key: project
        for key, project in active_projects.items()
        if "no-tlp-doap" in categories(project)
    }
    classified_projects = {
        key: project
        for key, project in active_projects.items()
        if "no-tlp-doap" not in categories(project)
    }
    active_repositories = [
        repo
        for repo in repositories
        if not repo.get("fork") and not repo.get("archived")
    ]

    project_repository: dict[str, dict[str, Any]] = {}
    for key, project in active_projects.items():
        candidate_names = repository_slugs(project)
        candidate_names.extend(
            [key, key.replace("_", "-"), str(project.get("pmc") or "")]
        )
        candidates = [
            repositories_by_name[name]
            for name in candidate_names
            if name in repositories_by_name
            and not repositories_by_name[name].get("fork")
            and not repositories_by_name[name].get("archived")
        ]
        if candidates:
            project_repository[key] = max(
                candidates, key=lambda repo: repo.get("stargazers_count", 0)
            )

    raw_category_counts: Counter[str] = Counter()
    for project in classified_projects.values():
        raw_category_counts.update(categories(project))

    grouped_projects: dict[str, list[str]] = defaultdict(list)
    for key, project in classified_projects.items():
        project_categories = categories(project)
        for domain, labels in DOMAIN_LABELS.items():
            if project_categories & labels:
                grouped_projects[domain].append(key)

    grouped_domains: dict[str, Any] = {}
    for domain, keys in grouped_projects.items():
        head_candidates = [
            (key, project_repository[key])
            for key in keys
            if key in project_repository
        ]
        head_candidates.sort(
            key=lambda pair: pair[1].get("stargazers_count", 0),
            reverse=True,
        )
        seen_repositories: set[str] = set()
        heads: list[dict[str, Any]] = []
        for key, repo in head_candidates:
            if repo["name"] in seen_repositories:
                continue
            seen_repositories.add(repo["name"])
            heads.append(
                {
                    "project": projects[key].get("name"),
                    "repository": repo["full_name"],
                    "stars": repo["stargazers_count"],
                }
            )
            if len(heads) == 6:
                break
        grouped_domains[domain] = {
            "project_records": len(keys),
            "official_labels": sorted(DOMAIN_LABELS[domain]),
            "head_projects_by_github_stars": heads,
        }

    payload = {
        "generated_at": datetime.now(UTC).isoformat(),
        "grain": {
            "project_categories": "Apache Projects Directory project records",
            "github_metrics": "public repositories in the apache GitHub org",
        },
        "counts": {
            "projects_directory_records": len(projects),
            "non_retired_project_records": len(active_projects),
            "classifiable_doap_records": len(classified_projects),
            "virtual_no_tlp_doap_records": len(virtual_projects),
            "github_public_repositories": len(repositories_by_name),
            "github_nonfork_nonarchived_repositories": len(active_repositories),
            "project_records_with_resolved_github_repository": len(
                project_repository
            ),
        },
        "top_official_categories": [
            {"category": category, "project_records": count}
            for category, count in raw_category_counts.most_common(12)
        ],
        "grouped_domains": grouped_domains,
        "caveats": [
            "Grouped domains roll up official multi-label DOAP categories, so their counts overlap and must not be summed.",
            "Projects Directory data is maintained by individual PMCs and is explicitly a partial catalog.",
            "A project can own multiple GitHub repositories; repository count is not project count.",
            "Stars select recognizable head examples but do not measure community health.",
            "GitHub pushed_at can include automation, website, and dependency updates.",
        ],
        "sources": {
            "projects_directory": "https://projects.apache.org/json/foundation/projects.json",
            "projects_directory_about": "https://projects.apache.org/about.html",
            "github_org": "https://github.com/apache",
        },
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(payload["counts"], indent=2))


if __name__ == "__main__":
    main()
