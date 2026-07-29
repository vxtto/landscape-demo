# Landscape refresh

This folder contains the July 2026 editorial refresh for the Agent Infra and
Model Infra landscapes.

## Render the refreshed landscapes

From the repository root:

```bash
.venv/bin/python presentations/260807-CoC-KN/landscape-refresh/analysis/render_infra_landscapes.py
```

The renderer selects rows where `landscape_action` is `keep` or `add`, uses the
current `landscape_layer` and `landscape_section`, caches GitHub owner avatars
locally, and displays the June 2026 OpenRank value. The generated HTML files are
offline-capable after the avatar cache has been created.

Render 4K PNG files with:

```bash
playwright screenshot --channel chrome --viewport-size=3840,2160 \
  --wait-for-timeout=1000 \
  "file://$PWD/presentations/260807-CoC-KN/landscape-refresh/agent_infra_landscape_2026.html" \
  presentations/260807-CoC-KN/landscape-refresh/agent_infra_landscape_2026.png

playwright screenshot --channel chrome --viewport-size=3840,2160 \
  --wait-for-timeout=1000 \
  "file://$PWD/presentations/260807-CoC-KN/landscape-refresh/model_infra_landscape_2026.html" \
  presentations/260807-CoC-KN/landscape-refresh/model_infra_landscape_2026.png
```
