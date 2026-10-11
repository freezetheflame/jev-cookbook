"""Print a request offline, or explicitly send it to the TypeSafe API."""

import argparse
from datetime import datetime, timezone
import json
import math
import os
from pathlib import Path
import sys
import time
import urllib.error
import urllib.request

from request_schema import validate_request, validate_response

ENDPOINT = "https://api.typesafe.ai/v1/systemone"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("request", type=Path, help="a complete JSON request")
    parser.add_argument("--send", action="store_true", help="call the paid API using TYPESAFE_API_KEY")
    parser.add_argument("--timeout", type=float, default=30, help="seconds, default 30")
    parser.add_argument("--output", type=Path, help="save a successful response record")
    parser.add_argument("--overwrite", action="store_true", help="replace an existing output file")
    args = parser.parse_args()
    if args.timeout <= 0 or not math.isfinite(args.timeout):
        parser.error("--timeout must be positive and finite")
    if args.output and not args.send:
        parser.error("--output requires --send")
    if args.output and args.output.exists() and not args.overwrite:
        parser.error("output already exists; choose a new path or pass --overwrite")
    try:
        payload = json.loads(args.request.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        print(f"Cannot read request: {exc}", file=sys.stderr)
        return 1
    errors = validate_request(payload)
    if errors:
        print("Invalid request:\n" + "\n".join(errors), file=sys.stderr)
        return 1
    if not args.send:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        print("Offline preview only; no API request sent.", file=sys.stderr)
        return 0
    key = os.environ.get("TYPESAFE_API_KEY", "").strip()
    if not key:
        print("Set TYPESAFE_API_KEY before using --send.", file=sys.stderr)
        return 1
    req = urllib.request.Request(ENDPOINT, data=json.dumps(payload).encode("utf-8"),
                                 headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"})
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=args.timeout) as result:
            response = json.load(result)
    except urllib.error.HTTPError as exc:
        print(f"TypeSafe returned HTTP {exc.code}; no successful result recorded.", file=sys.stderr)
        return 1
    except (urllib.error.URLError, TimeoutError, OSError, ValueError):
        print("TypeSafe request failed or returned invalid JSON; no successful result recorded.", file=sys.stderr)
        return 1
    errors = validate_response(response, payload)
    if errors:
        print("Invalid response:\n" + "\n".join(errors), file=sys.stderr)
        return 1
    record = {"measured_at": datetime.now(timezone.utc).isoformat(), "endpoint": ENDPOINT,
              "elapsed_ms": round((time.perf_counter() - started) * 1000, 2),
              "request": payload, "response": response,
              "scope": "Single API call; not an accuracy benchmark."}
    serialized = json.dumps(record, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        try:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            with args.output.open("w" if args.overwrite else "x", encoding="utf-8") as stream:
                stream.write(serialized)
        except OSError as exc:
            print(f"API succeeded but output could not be saved: {exc}", file=sys.stderr)
            return 1
        print(f"Saved {args.output}")
    else:
        print(serialized, end="")
    return 0


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    raise SystemExit(main())
