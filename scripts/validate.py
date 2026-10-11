"""Validate example requests, data records, source snapshots, and local doc links."""

import json
from pathlib import Path
import re
import sys
from urllib.parse import unquote

from request_schema import validate_request

ROOT = Path(__file__).resolve().parents[1]


def main():
    errors = []
    examples = sorted((ROOT / "examples").glob("*.json"))
    if not examples:
        errors.append("no example requests found")
    for path in examples:
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            errors.extend(f"{path.relative_to(ROOT)}: {err}" for err in validate_request(payload))
        except (OSError, ValueError) as exc:
            errors.append(f"{path.relative_to(ROOT)}: {exc}")
    for path in (ROOT / "evaluation").glob("*.jsonl"):
        seen = set()
        for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if not line.strip():
                continue
            try:
                row = json.loads(line)
                if not isinstance(row, dict) or not {"uid", "split", "state", "gold"} <= set(row):
                    raise ValueError("expected uid, split, state, gold")
                if row["uid"] in seen:
                    raise ValueError("duplicate uid")
                seen.add(row["uid"])
                if row["split"] not in {"dev", "validation", "held_out"}:
                    raise ValueError("invalid split")
            except (ValueError, TypeError) as exc:
                errors.append(f"{path.relative_to(ROOT)}:{number}: {exc}")
    snapshot = json.loads((ROOT / "sources/snapshots.json").read_text(encoding="utf-8"))
    repositories = {r["repo"]: r for r in snapshot["repositories"]}
    for row in repositories.values():
        if not re.fullmatch(r"[0-9a-f]{40}", row["sha"]):
            errors.append(f"invalid commit SHA for {row['repo']}")
    docs = list(ROOT.rglob("*.md"))
    for path in docs:
        text = path.read_text(encoding="utf-8")
        for target in re.findall(r"\[[^\]]*\]\(([^)]+)\)", text):
            target = target.strip().split(' "', 1)[0].strip("<>")
            if re.match(r"[a-z]+:", target) or target.startswith("#"):
                continue
            target = unquote(target.split("#", 1)[0])
            if target and not (path.parent / target).exists():
                errors.append(f"{path.relative_to(ROOT)}: broken local link {target}")
        for repo, sha in re.findall(r"https://github.com/([^/]+/[^/]+)/blob/([0-9a-f]{40})/", text):
            if repo not in repositories or repositories[repo]["sha"] != sha:
                errors.append(f"{path.relative_to(ROOT)}: unregistered snapshot {repo}@{sha}")
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    print(f"OK: {len(examples)} requests, {len(docs)} Markdown files, {len(repositories)} source snapshots.")
    print("Offline structure checks only; no API calls or accuracy measurements.")
    return 0


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    raise SystemExit(main())
