"""Landshop NEXUS: fail-closed worker for durable, no-side-effect preview execution.

Deploy ONLY on an isolated, approved worker host. This process never imports a
social connector, never sends emails, and never commands an industrial device.
Postgres RPCs own every lease and state transition atomically.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import socket
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen


def enabled(environment: dict[str, str] | None = None) -> bool:
    env = os.environ if environment is None else environment
    return env.get("LANDSHOP_NEXUS_RUNTIME_ENABLED") == "1"


@dataclass(frozen=True)
class Settings:
    api_url: str
    service_key: str
    worker_id: str
    interval_seconds: float = 2.0
    timeout_seconds: float = 12.0

    @classmethod
    def from_env(cls, env: dict[str, str] | None = None) -> "Settings":
        environment = os.environ if env is None else env
        api_url = environment.get("LANDSHOP_SUPABASE_URL", "").rstrip("/")
        parts = urlsplit(api_url)
        if parts.scheme != "https" or not parts.hostname or parts.username or parts.password:
            raise ValueError("A trusted HTTPS Supabase API URL is required")
        if not (parts.hostname.endswith(".supabase.co") or
                parts.hostname in set(environment.get("LANDSHOP_NEXUS_APPROVED_HOSTS", "").split(","))):
            raise ValueError("Supabase host must be explicitly approved")
        key = environment.get("LANDSHOP_SUPABASE_SERVICE_ROLE_KEY", "")
        if len(key) < 30 or any(char.isspace() for char in key):
            raise ValueError("Missing dedicated service-role credential")
        worker_id = environment.get("LANDSHOP_NEXUS_WORKER_ID") or (
            "nexus-" + re.sub(r"[^a-zA-Z0-9-]", "-", socket.gethostname())[:42])
        if not re.fullmatch(r"[a-zA-Z0-9_.-]{6,80}", worker_id):
            raise ValueError("Worker ID has an invalid format")
        interval = float(environment.get("LANDSHOP_NEXUS_POLL_SECONDS", "2"))
        if not 0.25 <= interval <= 30:
            raise ValueError("Polling interval must remain between 0.25 and 30 seconds")
        return cls(api_url=api_url, service_key=key, worker_id=worker_id,
                   interval_seconds=interval)


class RpcClient:
    def __init__(self, settings: Settings):
        self.settings = settings

    def call(self, name: str, payload: dict[str, Any]) -> Any:
        if name not in {"landshop_nexus_worker_claim", "landshop_nexus_worker_advance"}:
            raise ValueError("RPC is not on the fail-closed allowlist")
        data = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        request = Request(
            self.settings.api_url + "/rest/v1/rpc/" + name,
            data=data,
            headers={
                "apikey": self.settings.service_key,
                "Authorization": "Bearer " + self.settings.service_key,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            method="POST",
        )
        try:
            with urlopen(request, timeout=self.settings.timeout_seconds) as reply:
                return json.loads(reply.read(65536).decode("utf-8"))
        except (HTTPError, URLError, TimeoutError, ValueError) as exc:
            # Never expose response bodies, credentials, payload, or HTTP headers.
            status = getattr(exc, "code", "connection_error")
            raise RuntimeError("NEXUS RPC " + name + " failed (status " + str(status) + ")") from None


class NexusWorker:
    def __init__(self, settings: Settings, client: RpcClient | None = None):
        self.settings = settings
        self.client = client or RpcClient(settings)

    @staticmethod
    def report(event: str, **fields: str | int) -> None:
        safe = {"time": datetime.now(timezone.utc).isoformat(), "event": event}
        safe.update(fields)
        print(json.dumps(safe, separators=(",", ":")), flush=True)

    def run_batch(self) -> int:
        rows = self.client.call("landshop_nexus_worker_claim", {
            "p_worker": self.settings.worker_id,
            "p_limit": 4,
        })
        if not isinstance(rows, list):
            raise RuntimeError("Unexpected NEXUS queue response")
        count = 0
        for row in rows:
            if not isinstance(row, dict) or not re.fullmatch(
                r"[a-fA-F0-9-]{36}", str(row.get("run_id", ""))):
                raise RuntimeError("Invalid leased-run identifier")
            run_id = str(row["run_id"])
            try:
                # This ACK never calls a third party; Postgres only plans safe
                # deterministic transitions and blocks every external node.
                result = self.client.call("landshop_nexus_worker_advance", {
                    "p_run": run_id, "p_worker": self.settings.worker_id,
                    "p_result": "success", "p_error_code": None,
                })
                if not isinstance(result, dict):
                    raise RuntimeError("Unexpected step response")
                self.report("nexus_step_recorded", state=str(result.get("status", "unknown")))
            except Exception:
                # Even worker errors are only recorded as bounded, auditable
                # retries. If this RPC fails the 60s lease expires and recovers.
                try:
                    self.client.call("landshop_nexus_worker_advance", {
                        "p_run": run_id, "p_worker": self.settings.worker_id,
                        "p_result": "retry", "p_error_code": "worker_step_error",
                    })
                except Exception:
                    self.report("nexus_lease_expiry_recovery")
                else:
                    self.report("nexus_retry_scheduled")
            count += 1
        return count

    def run_forever(self) -> None:
        self.report("nexus_worker_started")
        while True:
            try:
                processed = self.run_batch()
                if not processed:
                    time.sleep(self.settings.interval_seconds)
            except Exception:
                self.report("nexus_batch_error")
                time.sleep(min(15.0, self.settings.interval_seconds * 2))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Landshop NEXUS internal preview worker")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--once", action="store_true")
    mode.add_argument("--loop", action="store_true")
    args = parser.parse_args(argv)
    if not enabled():
        print("NEXUS worker disabled. Set LANDSHOP_NEXUS_RUNTIME_ENABLED=1 on a trusted host.", file=sys.stderr)
        return 2
    try:
        worker = NexusWorker(Settings.from_env())
    except ValueError:
        print("NEXUS worker configuration is invalid. No requests were made.", file=sys.stderr)
        return 2
    if args.once:
        worker.run_batch()
        return 0
    worker.run_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
