from pathlib import Path

import pytest

import run_all


def test_pipeline_runs_steps_in_order(monkeypatch):
    calls = []
    monkeypatch.setenv("SEC_USER_AGENT", "FinPulse Test tester@example.com")
    monkeypatch.setattr(run_all.subprocess, "run", lambda command, **kwargs: calls.append((command, kwargs)))

    run_all.run_pipeline()

    assert [Path(command[0][1]).relative_to(run_all.ROOT).as_posix() for command in calls] == list(run_all.PIPELINE_STEPS)
    assert all(command[1]["cwd"] == run_all.ROOT for command in calls)


def test_pipeline_requires_sec_user_agent(monkeypatch):
    monkeypatch.delenv("SEC_USER_AGENT", raising=False)

    with pytest.raises(SystemExit, match="SEC_USER_AGENT"):
        run_all.run_pipeline()
