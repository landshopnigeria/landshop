"""No network or database is required for the NEXUS safe worker unit tests."""
import unittest
from unittest.mock import patch
from nexus_runtime_worker import Settings, NexusWorker, RpcClient, enabled, main


class FakeClient:
    def __init__(self, *, fail_first=False):
        self.calls = []
        self.fail_first = fail_first

    def call(self, name, data):
        self.calls.append((name, data))
        if name == "landshop_nexus_worker_claim":
            return [{"run_id": "c6fd3a80-9104-4d24-87b5-30f33824b1c2", "attempt": 1}]
        if self.fail_first and data.get("p_result") == "success":
            raise RuntimeError("server fault")
        return {"status": "queued", "external_actions_executed": 0}


class NexusRuntimeTests(unittest.TestCase):
    def setUp(self):
        self.settings = Settings(
            api_url="https://fake.supabase.co",
            service_key="test_key_only_never_use_in_prod_abcdefghijklmnopqrstuvwxyz",
            worker_id="nexus-test-01",
        )

    def test_disabled_by_default(self):
        self.assertFalse(enabled({}))
        self.assertEqual(2, main(["--once"]))

    def test_insecure_or_unknown_host_rejected(self):
        env = {"LANDSHOP_SUPABASE_URL": "http://example.com",
               "LANDSHOP_SUPABASE_SERVICE_ROLE_KEY": "x" * 40}
        with self.assertRaises(ValueError):
            Settings.from_env(env)
        env["LANDSHOP_SUPABASE_URL"] = "https://attacker.invalid"
        with self.assertRaises(ValueError):
            Settings.from_env(env)

    def test_client_rejects_arbitrary_rpc(self):
        with self.assertRaises(ValueError):
            RpcClient(self.settings).call("delete_all_data", {})

    def test_safe_step_path_only_uses_claim_and_advance(self):
        fake = FakeClient()
        worker = NexusWorker(self.settings, fake)
        with patch.object(NexusWorker, "report"):
            self.assertEqual(worker.run_batch(), 1)
        self.assertEqual([x[0] for x in fake.calls],
                         ["landshop_nexus_worker_claim", "landshop_nexus_worker_advance"])
        self.assertEqual("success", fake.calls[1][1]["p_result"])
        self.assertEqual("nexus-test-01", fake.calls[1][1]["p_worker"])

    def test_step_failure_schedules_bounded_retry(self):
        fake = FakeClient(fail_first=True)
        with patch.object(NexusWorker, "report"):
            NexusWorker(self.settings, fake).run_batch()
        self.assertEqual(fake.calls[2][1]["p_result"], "retry")
        self.assertEqual(fake.calls[2][1]["p_error_code"], "worker_step_error")

    def test_import_has_no_background_execution(self):
        with patch("nexus_runtime_worker.urlopen", side_effect=AssertionError("network was called")):
            self.assertFalse(enabled({"SOME_OTHER_FLAG": "1"}))


if __name__ == "__main__":
    unittest.main()
