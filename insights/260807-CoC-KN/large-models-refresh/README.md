# Large Models refresh

This folder builds the data tables for a new Large Models landscape. The visual
form is intentionally undecided until the candidate tables have been reviewed.

The primary table is now a monthly open-weight versus closed-weight comparison.
The earlier weekly open-weight-only table remains available as a supporting
snapshot.

## Scope

- Compare open-weight and closed/no-public-weight models in the same month.
- Treat one hosted model endpoint/release as one row.
- Merge free and paid variants of the same endpoint.
- Keep custom and restricted weight licenses visible. Open-weight is not treated
  as a synonym for OSI-approved open source.

## Sources

- OpenRouter: daily Top 50 token data aggregated across the previous complete
  calendar month.
- ZenMux: platform Top 50 token leaderboard for the same calendar month.
- Hugging Face Hub: weight repository, license, gating, 30-day and all-time
  downloads, likes, pipeline tag, architecture, parameter metadata, and model
  card fields.

## Composite ranking

The primary open-versus-closed score uses only signals observable for both:

```text
50% OpenRouter monthly token percentile
50% ZenMux monthly token percentile
```

Raw token counts are not added across platforms. Each source is converted to a
within-source percentile first because platform scale and tokenizer accounting
differ.

Hugging Face downloads measure repository artifact downloads, not API calls or
unique users. A separate `hf_open_ecosystem_score` describes adoption among
open-weight models, but it is excluded from the main open-versus-closed score.

Both platform sources expose only their Top 50 models individually. A zero score
means the model was outside that platform's visible cutoff, not necessarily zero
usage.

## Run

From the repository root:

```bash
.venv/bin/python presentations/260807-CoC-KN/large-models-refresh/analysis/build_monthly_open_closed_model_table.py
.venv/bin/python presentations/260807-CoC-KN/large-models-refresh/analysis/build_open_weight_model_table.py
```

Required for the monthly comparison:

```text
OPENROUTER_API_KEY
ZENMUX_MANAGEMENT_API_KEY
```

Optional:

```text
HF_TOKEN
```

The current local `.env` aliases `OpenRouter_MANAGEMENT_KEY` and
`ZenMux_MANAGEMENT_KEY` are also supported.

## Outputs

- `data/monthly_models_top50_open_closed.csv`: primary monthly comparison.
- `data/monthly_models_all_candidates.csv`: all monthly named candidates.
- `data/monthly_data_quality_checks.csv`: monthly comparison QA.
- `data/monthly_source_summary.json`: month, coverage, scoring, and headline mix.
- `data/open_weight_models_top50.csv`: review table for the next landscape.
- `data/open_weight_models_all_candidates.csv`: all eligible candidates.
- `data/data_quality_checks.csv`: completeness and matching checks.
- `data/source_summary.json`: source windows, status, weighting, and caveats.
- `data/raw/`: compact source snapshots used for the generated table.

The Top 50 should be reviewed before visual design, especially fuzzy ZenMux
matches, custom licenses, missing parameter counts, and models whose category is
inferred from API metadata.

## Landscape prototype

Generate the capability-first Large Models landscape:

```bash
.venv/bin/python presentations/260807-CoC-KN/large-models-refresh/analysis/render_large_models_landscape.py
playwright screenshot --viewport-size=3840,2160 --wait-for-timeout=1000 \
  "file://$PWD/presentations/260807-CoC-KN/large-models-refresh/large_models_landscape_prototype.html" \
  presentations/260807-CoC-KN/large-models-refresh/large_models_landscape_prototype.png
```

The prototype uses six editorial domains, monthly usage rank, weight access,
license, parameter count, capability tags, and public Artificial Analysis
Intelligence Index matches. Vendor marks come from LobeHub Icons under its MIT
license and are stored locally for offline presentation.
