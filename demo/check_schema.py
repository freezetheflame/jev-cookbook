"""Cross-check generated requests with the cookbook's offline wire validator."""
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from request_schema import validate_request


def main():
    sample = json.loads((ROOT / "demo/sample-input.json").read_text(encoding="utf-8"))
    specs = [sample]
    for kind in ("noul", "choice", "score", "auto"):
        specs.append({**sample, "mode": kind, "decision": "判断客户是否提出退款申请。"})
    for spec in specs:
        process = subprocess.run(
            ["node", "demo/convert.cjs"], cwd=ROOT,
            input=json.dumps(spec, ensure_ascii=False).encode("utf-8"),
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True,
        )
        errors = validate_request(json.loads(process.stdout))
        if errors:
            raise ValueError(f"{spec['mode']}: {errors}")
    print(f"PASS: {len(specs)} generated requests match the offline wire checks.")


if __name__ == "__main__":
    main()
