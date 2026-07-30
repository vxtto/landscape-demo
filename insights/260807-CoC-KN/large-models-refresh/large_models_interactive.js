(() => {
  const cards = [...document.querySelectorAll(".model-card")];
  const panels = [...document.querySelectorAll(".domain-panel[data-domain]")];
  const primaryButtons = [
    ...document.querySelectorAll("[data-primary-filter]"),
  ];
  const searchInput = document.querySelector("#model-search");
  const vendorSelect = document.querySelector("#vendor-filter");
  const aaiButton = document.querySelector("#aai-filter");
  const resetButton = document.querySelector("#reset-filter");
  const resultCount = document.querySelector("#result-count");
  const drawer = document.querySelector("#model-passport");
  const backdrop = document.querySelector("#passport-backdrop");
  const closeButton = document.querySelector("#passport-close");
  let primaryFilter = "all";
  let aaiOnly = false;
  let lastFocus = null;

  const dataFor = (card) => {
    if (!card.__modelData) {
      card.__modelData = JSON.parse(card.dataset.modelJson);
    }
    return card.__modelData;
  };

  const vendors = [...new Set(cards.map((card) => dataFor(card).vendor))].sort(
    (left, right) => left.localeCompare(right),
  );
  vendors.forEach((vendor) => {
    const option = document.createElement("option");
    const count = cards.filter((card) => dataFor(card).vendor === vendor).length;
    option.value = vendor;
    option.textContent = `${vendor} · ${count}`;
    vendorSelect.append(option);
  });

  const matchesPrimary = (data) => {
    if (primaryFilter === "open") return data.isOpen;
    if (primaryFilter === "api") return !data.isOpen;
    if (primaryFilter === "top10") return data.rank <= 10;
    return true;
  };

  const applyFilters = () => {
    const query = searchInput.value.trim().toLocaleLowerCase();
    const vendor = vendorSelect.value;
    let visibleCount = 0;

    cards.forEach((card) => {
      const data = dataFor(card);
      const haystack = `${data.displayName} ${data.vendor} ${data.domain}`.toLocaleLowerCase();
      const visible =
        matchesPrimary(data) &&
        (!aaiOnly || data.aai !== null) &&
        (vendor === "all" || data.vendor === vendor) &&
        (!query || haystack.includes(query));
      card.classList.toggle("is-filtered", !visible);
      if (visible) visibleCount += 1;
    });

    panels.forEach((panel) => {
      const visibleCards = [
        ...panel.querySelectorAll(".model-card:not(.is-filtered)"),
      ];
      const openCount = visibleCards.filter(
        (card) => dataFor(card).isOpen,
      ).length;
      const apiCount = visibleCards.length - openCount;
      panel.classList.toggle("is-empty", visibleCards.length === 0);
      panel.querySelector(".domain-count").textContent =
        `${visibleCards.length} shown`;
      panel.querySelector(".mix").textContent =
        `${openCount} open / ${apiCount} API`;
    });

    resultCount.textContent = `${visibleCount} model${visibleCount === 1 ? "" : "s"} shown`;
  };

  primaryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      primaryFilter = button.dataset.primaryFilter;
      primaryButtons.forEach((candidate) => {
        const active = candidate === button;
        candidate.classList.toggle("is-active", active);
        candidate.setAttribute("aria-pressed", String(active));
      });
      applyFilters();
    });
  });

  searchInput.addEventListener("input", applyFilters);
  vendorSelect.addEventListener("change", applyFilters);
  aaiButton.addEventListener("click", () => {
    aaiOnly = !aaiOnly;
    aaiButton.setAttribute("aria-pressed", String(aaiOnly));
    applyFilters();
  });
  resetButton.addEventListener("click", () => {
    primaryFilter = "all";
    aaiOnly = false;
    searchInput.value = "";
    vendorSelect.value = "all";
    aaiButton.setAttribute("aria-pressed", "false");
    primaryButtons.forEach((button) => {
      const active = button.dataset.primaryFilter === "all";
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    applyFilters();
  });

  const compact = (value) =>
    value === null || value === undefined
      ? "Not visible"
      : new Intl.NumberFormat("en", {
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(value);

  const score = (value) =>
    value === null || value === undefined ? "Not matched" : value.toFixed(1);

  const rank = (value) =>
    value === null || value === undefined ? "Outside visible Top 50" : `#${value}`;

  const setText = (id, value) => {
    document.querySelector(`#${id}`).textContent = value;
  };

  const setLink = (id, url) => {
    const link = document.querySelector(`#${id}`);
    link.hidden = !url;
    if (url) link.href = url;
    else link.removeAttribute("href");
  };

  const openDrawer = (card) => {
    const data = dataFor(card);
    lastFocus = document.activeElement;
    const logoSlot = document.querySelector("#passport-logo");
    const logo = card.querySelector(".vendor-logo, .vendor-fallback");
    logoSlot.replaceChildren(logo.cloneNode(true));

    setText("passport-vendor", data.vendor);
    setText("passport-model-name", data.displayName);
    setText("passport-rank", `Usage rank #${data.rank}`);
    setText("passport-domain", data.domain);
    setText("passport-usage", data.usage.toFixed(1));
    document.querySelector("#passport-usage-bar").style.width =
      `${Math.max(0, Math.min(100, data.usage))}%`;

    const accessLabel = data.isOpen ? "Open weights" : "API-only";
    setText("passport-access", accessLabel);
    setText("passport-license", data.license);
    setText(
      "passport-access-note",
      data.isOpen
        ? data.licenseClass === "open_source_license"
          ? "Public weights with an OSI-approved software license. Training data and code still need separate verification."
          : "Public weights under a custom or restricted license. Weight access is not the same as unrestricted open source."
        : "No official public weight repository was resolved for this endpoint in the snapshot.",
    );

    setText("passport-aai", score(data.aai));
    setText(
      "passport-aai-note",
      data.aai === null
        ? "This model was not matched to the public Artificial Analysis snapshot; absence is not a zero."
        : "Artificial Analysis Intelligence Index from the public leaderboard snapshot.",
    );

    setText("passport-openrouter-rank", rank(data.openrouter.rank));
    setText(
      "passport-openrouter-note",
      data.openrouter.rank === null
        ? "Outside the platform’s visible monthly Top 50."
        : `${compact(data.openrouter.tokens)} tokens · ${data.openrouter.days ?? "—"}/30 daily Top 50 appearances · percentile ${score(data.openrouter.score)}.`,
    );
    setText("passport-zenmux-rank", rank(data.zenmux.rank));
    setText(
      "passport-zenmux-note",
      data.zenmux.rank === null
        ? "Outside the platform’s visible monthly Top 50."
        : `${compact(data.zenmux.tokens)} tokens · platform percentile ${score(data.zenmux.score)}.`,
    );
    setText(
      "passport-hf-score",
      data.huggingface.score === null
        ? data.isOpen
          ? "Metadata incomplete"
          : "Not applicable"
        : score(data.huggingface.score),
    );
    setText(
      "passport-hf-note",
      data.huggingface.score === null
        ? data.isOpen
          ? "No complete open-ecosystem score was available."
          : "HF ecosystem score is only computed for open-weight models."
        : `${compact(data.huggingface.downloads30d)} downloads in 30 days · ${compact(data.huggingface.likes)} likes${data.huggingface.gated ? " · gated access" : ""}.`,
    );

    setText("passport-parameters", data.parameters);
    setText(
      "passport-context",
      data.contextLength === null ? "Not disclosed" : compact(data.contextLength),
    );
    setText(
      "passport-price",
      data.promptPrice === null && data.completionPrice === null
        ? "Not available"
        : `$${data.promptPrice ?? "—"} in · $${data.completionPrice ?? "—"} out`,
    );
    setText(
      "passport-sources",
      data.sourcePresence.length
        ? data.sourcePresence.join(" + ")
        : "No named source",
    );

    const capabilities = document.querySelector("#passport-capabilities");
    capabilities.replaceChildren(
      ...(data.capabilities.length ? data.capabilities : ["No tagged capability"]).map(
        (label) => {
          const item = document.createElement("i");
          item.textContent = label;
          return item;
        },
      ),
    );

    setLink("passport-openrouter-link", data.openrouter.url);
    setLink("passport-zenmux-link", data.zenmux.url);
    setLink("passport-hf-link", data.huggingface.url);

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
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openDrawer(card);
      }
    });
    card.addEventListener("mouseenter", () => {
      const vendor = dataFor(card).vendor;
      cards.forEach((candidate) => {
        if (
          !candidate.classList.contains("is-filtered") &&
          dataFor(candidate).vendor !== vendor
        ) {
          candidate.classList.add("vendor-muted");
        }
      });
    });
    card.addEventListener("mouseleave", () => {
      cards.forEach((candidate) => candidate.classList.remove("vendor-muted"));
    });
  });

  document.querySelectorAll(".benchmark-row").forEach((row) => {
    const openMatchingCard = () => {
      const card = cards.find(
        (candidate) =>
          candidate.dataset.modelName === row.dataset.modelName,
      );
      if (card) openDrawer(card);
    };
    row.addEventListener("click", openMatchingCard);
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openMatchingCard();
      }
    });
  });

  closeButton.addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drawer.classList.contains("is-open")) {
      closeDrawer();
    }
  });

  applyFilters();
})();
