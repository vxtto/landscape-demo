# Dictionaries

`en.json` is the base. `zh.json` is merged over it per request, so any key
absent from `zh.json` falls back to its English value rather than rendering
empty. Adding a locale is one entry in `../dictionaries.ts` plus a JSON file;
it may start almost empty and fill in over time.

## Site chrome vs. the keynote body

The landscape UI (`en.json`/`zh.json` — `header`, `footer`, `metadata`,
`embed`, `localeSwitch`) is translated through this dictionary system, via
`getDictionary()`.

The CommunityOverCode keynote (`../keynote/*`) is a different shape: a large
amount of authored copy — chapter prose, chart labels, speaker notes, and the
slide-by-slide deck script — lives in plain data modules rather than JSON.
Routing that much text through the dictionary would mean threading a `dict`
prop with hundreds of leaf keys through deeply nested components for little
benefit, so it uses a narrower, file-local convention instead: each
translatable field is written as `{ en: string; zh: string }` and resolved
with the `pick(lang, value)` / `resolveDeep(lang, value)` helpers in
`../keynote/i18n.ts`. `keynote.title` and `keynote.description` (the page
`<title>`/meta description) and `keynote.present.*` still live in this
dictionary, since those are ordinary single-string metadata fields — only the
page body uses the `{ en, zh }` convention.

Where to find each piece:

| File | What it holds |
| --- | --- |
| `../keynote/keynote-experience.tsx` | Section copy, speaker notes, and the `uiText` table for the research page |
| `../keynote/landscape-story.ts` | Per-landscape narrative: metrics, insights, method steps, speaker scripts |
| `../keynote/license-research.ts` | License/openness comparison tables and checklist copy |
| `../keynote/apache-ecosystem.ts` | Apache domain descriptions and the Apache↔Ant backbone |
| `../keynote/apache-project-atlas.tsx` | The Apache project atlas widget's own UI strings |
| `../keynote/present/presentation.tsx` | The full slide deck: every scene's copy, speaker cues, and chart labels |

Both `/keynote` and `/keynote/present` render a `LocaleSwitch` so a reader (or
a presenter mid-talk) can toggle EN/ZH without leaving the page. The Chinese
text is the original, authored version of the talk; the English text is a
translation of it and should stay in sync when the Chinese copy changes.

## Reviewing the site chrome

The `header`, `footer`, `metadata`, `embed`, and `localeSwitch` values in
`zh.json` were drafted by a model, not a native speaker, and have not been
through the `de-ai-writing` skill that `AGENTS.md` requires for copy written
on the author's behalf. Treat them as a starting point. Decisions worth a
second look:

- `Agent Infra` / `Model Infra` / `Agentic AI` were left in English, on the
  grounds that Chinese writing in this community uses them untranslated. If
  that is wrong, they change in one place each.
- `footer.dataFrom` and `footer.dataNote` are fragments concatenated around a
  link. `dataNote` opens with a full-width comma so the joined sentence reads
  `数据来自 <link>，分类标签支持多选，项目重叠属有意为之。` Keep that shape if
  you reword either half.
- Nav labels are width-constrained; `生态信号` and `主题演讲` are four
  characters each to match the English labels' footprint.

The keynote body's English translation is similarly a first pass — read it
against the Chinese before a live presentation and route any rewrite through
`de-ai-writing` per `AGENTS.md`.
