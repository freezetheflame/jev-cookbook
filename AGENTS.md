# Working on Jev Cookbook

- Preserve the Chinese-first recipes and short English project summary.
- Every recipe needs a complete request example, result handling, exact sources, and evidence status.
- Keep synthetic examples and measured results distinct. Never invent Jev answers or label an offline check as API or accuracy validation.
- Cite upstream implementations with immutable commit URLs when available.
- Reuse the standard-library scripts; avoid adding dependencies for documentation or JSON examples.
- Run `python scripts/validate.py` after edits. Do not call paid APIs unless explicitly requested.
- Do not commit API keys, personal filesystem paths, real session logs, or generated responses. `runs/` is ignored.
