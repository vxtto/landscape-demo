(() => {
  const cards = [...document.querySelectorAll(".project-card")];
  const stageSections = [...document.querySelectorAll(".stage")];
  const stages = document.querySelector(".stages");
  const resetView = document.querySelector(".reset-view");
  const searchInput = document.querySelector("#project-search");
  const ownerSelect = document.querySelector("#owner-filter");
  const tierButtons = [...document.querySelectorAll("[data-tier-filter]")];
  const directButton = document.querySelector("#direct-filter");
  const resetFiltersButton = document.querySelector("#reset-filters");
  const resultCount = document.querySelector("#result-count");
  const drawer = document.querySelector("#project-passport");
  const backdrop = document.querySelector("#passport-backdrop");
  const closeButton = document.querySelector("#passport-close");
  const projectData = window.AWESOME_PROJECTS || {};
  let activeTier = "all";
  let directOnly = false;
  let lastFocus = null;

  const keyFor = (card) => `${card.dataset.owner}/${card.dataset.repo}`;

  const dataFor = (card) => {
    if (!card.__projectData) {
      card.__projectData = projectData[keyFor(card)] || {};
    }
    return card.__projectData;
  };

  const fitCanvas = () => {
    const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    document.documentElement.style.setProperty("--canvas-scale", String(scale));
  };

  const setText = (id, value) => {
    document.querySelector(`#${id}`).textContent =
      value === null || value === undefined || value === "" ? "Not available" : value;
  };

  const compact = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return "Not available";
    return new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(number);
  };

  const owners = [...new Set(cards.map((card) => card.dataset.owner))].sort(
    (left, right) => left.localeCompare(right),
  );

  owners.forEach((owner) => {
    const option = document.createElement("option");
    const count = cards.filter((card) => card.dataset.owner === owner).length;
    option.value = owner;
    option.textContent = `${owner} · ${count}`;
    ownerSelect.append(option);
  });

  const applyFilters = () => {
    const query = searchInput.value.trim().toLocaleLowerCase();
    const owner = ownerSelect.value;
    let visibleCount = 0;

    cards.forEach((card) => {
      const data = dataFor(card);
      const haystack = [
        card.dataset.owner,
        card.dataset.repo,
        card.dataset.what,
        card.dataset.use,
        data.landscape_section,
        data.editorial_reason,
        data.language,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();
      const visible =
        (activeTier === "all" || card.dataset.tier === activeTier) &&
        (!directOnly || data.agent_consumability === "direct") &&
        (owner === "all" || card.dataset.owner === owner) &&
        (!query || haystack.includes(query));

      card.classList.toggle("is-filtered", !visible);
      if (visible) visibleCount += 1;
    });

    stageSections.forEach((stage) => {
      const visibleCards = [
        ...stage.querySelectorAll(".project-card:not(.is-filtered)"),
      ];
      const count = visibleCards.length;
      stage.classList.toggle("is-empty", count === 0);
      stage.style.setProperty("--count", String(Math.max(count, 1)));
      stage.style.setProperty("--focus-rows", String(Math.max(Math.ceil(count / 2), 1)));
      const countLabel = stage.querySelector(".stage-count");
      if (countLabel.firstChild) countLabel.firstChild.nodeValue = String(count);
    });

    resultCount.textContent = `${visibleCount} project${visibleCount === 1 ? "" : "s"} shown`;
  };

  const resetStageFocus = () => {
    stages.classList.remove("is-focused");
    stageSections.forEach((stage) => {
      stage.classList.remove("is-focused");
      stage.querySelector(".stage-heading").setAttribute("aria-pressed", "false");
    });
    resetView.classList.remove("is-visible");
  };

  stageSections.forEach((stage) => {
    stage.querySelector(".stage-heading").addEventListener("click", () => {
      const wasFocused = stage.classList.contains("is-focused");
      resetStageFocus();
      if (wasFocused) return;
      stages.classList.add("is-focused");
      stage.classList.add("is-focused");
      stage.querySelector(".stage-heading").setAttribute("aria-pressed", "true");
      resetView.classList.add("is-visible");
    });
  });

  resetView.addEventListener("click", resetStageFocus);

  tierButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeTier = button.dataset.tierFilter;
      tierButtons.forEach((candidate) => {
        const active = candidate === button;
        candidate.classList.toggle("is-active", active);
        candidate.setAttribute("aria-pressed", String(active));
      });
      applyFilters();
    });
  });

  searchInput.addEventListener("input", applyFilters);
  ownerSelect.addEventListener("change", applyFilters);
  directButton.addEventListener("click", () => {
    directOnly = !directOnly;
    directButton.setAttribute("aria-pressed", String(directOnly));
    applyFilters();
  });

  resetFiltersButton.addEventListener("click", () => {
    activeTier = "all";
    directOnly = false;
    searchInput.value = "";
    ownerSelect.value = "all";
    directButton.setAttribute("aria-pressed", "false");
    tierButtons.forEach((button) => {
      const active = button.dataset.tierFilter === "all";
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    applyFilters();
  });

  const formCopy = {
    direct: {
      label: "Agent-consumable now",
      note: "The repository already packages instructions, skills, templates, tools, or workflows in a form an agent can load or execute.",
    },
    hybrid: {
      label: "Human + agent bridge",
      note: "The repository mixes reusable assets with human-oriented curation; some parts are directly consumable and others still require selection.",
    },
    indirect: {
      label: "Human-browsed reference",
      note: "The repository mainly helps people discover and evaluate resources before anything is translated into an agent-ready form.",
    },
  };

  const openDrawer = (card) => {
    const data = dataFor(card);
    const form = data.agent_consumability || "indirect";
    const formDetails = formCopy[form] || formCopy.indirect;
    lastFocus = document.activeElement;

    const avatar = card.querySelector(".avatar");
    document.querySelector("#passport-avatar").replaceChildren(avatar.cloneNode(true));
    setText("passport-owner", card.dataset.owner);
    setText("passport-title", card.dataset.repo);
    setText("passport-tier", card.dataset.tier);
    setText("passport-stage", (data.stage || card.closest(".stage")?.dataset.stage || "").toUpperCase());
    setText("passport-consumability", `${form.toUpperCase()} CONSUMABILITY`);
    setText("passport-thesis", data.editorial_reason || card.dataset.use);
    setText("passport-what", card.dataset.what);
    setText("passport-use", card.dataset.use);
    setText("passport-form", form.toUpperCase());
    setText("passport-form-label", formDetails.label);
    setText("passport-form-note", formDetails.note);
    setText("passport-watch", compact(data.watch_events_visible_3m));
    setText("passport-participants", compact(data.participants_3m));
    setText(
      "passport-collaboration-note",
      `${data.openrank_3m ?? card.dataset.openrank} OpenRank across Apr–Jun 2026. Read it together with participant breadth, not as a standalone quality score.`,
    );
    setText("passport-stars", compact(data.stars_current));
    setText("passport-openrank", Number(data.openrank_3m).toFixed(1));
    setText("passport-value-score", Number(data.awesome_value_score).toFixed(1));
    setText("passport-category", data.landscape_section);
    setText("passport-language", data.language || "Not specified");
    setText("passport-license", data.license || "Not asserted");
    setText("passport-evidence-grade", `Grade ${data.evidence_grade || "—"}`);
    setText(
      "passport-activity",
      `${data.activity_months ?? "—"} of 3 observed months`,
    );
    setText("passport-snapshot", data.github_snapshot_date);
    document.querySelector("#passport-github-link").href = card.dataset.url;

    backdrop.hidden = false;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    closeButton.focus();
  };

  const closeDrawer = () => {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    backdrop.hidden = true;
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  };

  cards.forEach((card) => {
    card.addEventListener("click", () => openDrawer(card));
    card.addEventListener("mouseenter", () => {
      const owner = card.dataset.owner.toLocaleLowerCase();
      cards.forEach((candidate) => {
        if (
          !candidate.classList.contains("is-filtered") &&
          candidate.dataset.owner.toLocaleLowerCase() !== owner
        ) {
          candidate.classList.add("owner-muted");
        }
      });
    });
    card.addEventListener("mouseleave", () => {
      cards.forEach((candidate) => candidate.classList.remove("owner-muted"));
    });
  });

  closeButton.addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drawer.classList.contains("is-open")) closeDrawer();
  });
  window.addEventListener("resize", fitCanvas);

  fitCanvas();
  applyFilters();
})();
