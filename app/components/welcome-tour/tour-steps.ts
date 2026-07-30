/**
 * The walkthrough is configured entirely from this file.
 *
 * Adding, removing, reordering or rewording a step needs no other change:
 * the counter, the progress dots and the Back/Next wiring all derive from
 * the length of TOUR_STEPS.
 *
 * Reattaching a step to moved UI is a one-line edit too. `anchors` is an
 * ordered fallback chain — the first selector that matches a visible element
 * wins, so put the most specific selector first and leave a coarser one
 * behind it as a safety net. A step whose whole chain misses is skipped
 * rather than shown against the wrong element, and logs a warning in dev.
 *
 * Class selectors use [class*="..."] on purpose: CSS Modules compile
 * `.landscapeLead` to something like `page-module__E0kJGG__landscapeLead`,
 * so a substring match is what survives a recompile.
 */

export const TOUR_VERSION = 1;

export type TourStep = {
  /** Stable key. Only used internally, so renaming UI copy never resets it. */
  id: string;
  title: string;
  body: string;
  /**
   * Ordered selector fallbacks. Omit (or leave empty) for a step that is
   * centred on screen over a dimmed page instead of spotlighting an element.
   */
  anchors?: string[];
  /**
   * Which match to use when a selector hits several elements.
   * "first" (default) is deterministic; "random" picks one per tour run.
   */
  pick?: "first" | "random";
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: "hero",
    title: "A map for a world that won't hold still",
    body: "Projects rise and vanish in weeks, not years. This isn't a snapshot — it's a living map that updates as the ecosystem moves.",
    anchors: [
      '[data-tour="hero"]',
      '[class*="landscapeLead"]',
      "#landscape h1",
    ],
  },
  {
    id: "agent-module",
    title: "Start with Agent Infra",
    body: "Applications, frameworks, runtime — the layers people reach for when they build something that acts. Each zone is sized by the attention its projects are getting.",
    anchors: [
      '[data-tour="agent-module"]',
      '#agent-infra [class*="moduleHeading"]',
      "#agent-infra",
    ],
  },
  {
    id: "model-module",
    title: "Then what runs underneath",
    body: "Serving, training, data and compute. Split out as its own block so you can read either half on its own, or scroll straight through both.",
    anchors: [
      '[data-tour="model-module"]',
      '#model-infra [class*="moduleHeading"]',
      "#model-infra",
    ],
  },
  {
    id: "project",
    title: "Every logo opens a story",
    body: "Take this one — click any project to see who's building it, its OpenRank trend, and the contributors driving it forward right now.",
    anchors: ["[data-tour-candidate]", '[class*="projectMark"]'],
    pick: "random",
  },
  {
    id: "open-source",
    title: "Open source is the point",
    body: "Intelligence shouldn't be a privilege for the few. Everything here is open — the projects, the data, the map itself — so more people can see, use, and shape the agent ecosystem together.",
  },
];
