# Dictionaries

`en.json` is the base. `zh.json` is merged over it per request, so any key
absent from `zh.json` falls back to its English value rather than rendering
empty. Adding a locale is one entry in `../dictionaries.ts` plus a JSON file;
it may start almost empty and fill in over time.

## Why the two languages are lopsided

The landscape UI was authored in English. The CommunityOverCode keynote was
authored in Chinese. Neither has been translated, so right now:

| Route | Renders |
| --- | --- |
| `/en` | English, complete |
| `/zh` | English, via fallback — no Chinese UI copy exists yet |
| `/en/keynote` | Chinese, via the `keynote._note` values in `en.json` |
| `/zh/keynote` | Chinese, complete |

`en.json` carrying Chinese under `keynote` is deliberate. It is the authored
source for a talk that has no English version, and serving the real thing
beats serving blanks. Replace those two values when an English keynote exists.

## What still needs a human

**Chinese UI copy.** Nothing in `zh.json` covers `header`, `footer`, `metadata`
or `embed`, so `/zh` is English. These are short strings and translating them
is the smallest useful next step.

**The keynote body.** Only the page metadata is wired up. Roughly 8,000 CJK
characters of talk content still live inline:

| File | CJK chars |
| --- | --- |
| `../keynote/keynote-experience.tsx` | ~3,900 |
| `../keynote/landscape-story.ts` | ~3,400 |
| `../keynote/license-research.ts` | ~390 |
| `../keynote/apache-ecosystem.ts` | ~370 |

The three `.ts` files are already plain data modules, so they extract
mechanically — keyed objects rather than prose surgery. `keynote-experience.tsx`
is the awkward one: some strings sit in `const` blocks, others inline in JSX.

Do not machine-translate the keynote. It is conference copy in the author's
voice, and this repo's `AGENTS.md` requires her `de-ai-writing` skill for any
copy written or revised on her behalf.
