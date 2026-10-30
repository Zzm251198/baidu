"""管理接口与健康检查的边界行为。

对应本轮收尾的两项：
1. /api/health 默认不暴露进程身份，需 ?verbose=1；
2. DELETE /api/simulations 在配置了 DEMO_ADMIN_TOKEN 时必须带令牌。

第 2 条的意义：demo 阶段它就是个"清空审计库"的开关。一旦有人把 uvicorn
起在 0.0.0.0 上，没有令牌就等于把数据库交给整个局域网。
"""

from __future__ import annotations

import pytest


def test_health_default_hides_process_identity(client):
    body = client.get("/api/health").json()
    assert set(body) == {"status", "lines", "waybills"}


def test_health_verbose_exposes_process_identity(client):
    body = client.get("/api/health", params={"verbose": "true"}).json()
    assert set(body) == {"status", "lines", "waybills", "commit", "startedAt", "pid"}


def test_cleanup_without_token_config_allows_local_demo(client, monkeypatch, sample_order, sample_route):
    """未配置令牌（本地 demo）：保持可用，不打断演示流程。"""
    monkeypatch.delenv("DEMO_ADMIN_TOKEN", raising=False)
    assert client.delete("/api/simulations", params={"keep": 20}).status_code == 200


def test_cleanup_requires_token_when_configured(client, monkeypatch):
    """配置了令牌：没带 / 带错 → 403；带对 → 放行。"""
    monkeypatch.setenv("DEMO_ADMIN_TOKEN", "s3cret-token")

    assert client.delete("/api/simulations", params={"keep": 20}).status_code == 403
    assert (
        client.delete("/api/simulations", params={"keep": 20}, headers={"X-Demo-Token": "wrong"}).status_code
        == 403
    )
    assert (
        client.delete("/api/simulations", params={"keep": 20}, headers={"X-Demo-Token": "s3cret-token"}).status_code
        == 200
    )


def test_cleanup_token_is_case_sensitive(client, monkeypatch):
    """令牌比较不能大小写不敏感（否则会放宽攻击面）。"""
    monkeypatch.setenv("DEMO_ADMIN_TOKEN", "S3CRET")
    assert (
        client.delete("/api/simulations", params={"keep": 20}, headers={"X-Demo-Token": "s3cret"}).status_code == 403
    )


def test_cleanup_keeps_newest_rows(client, monkeypatch, sample_order, sample_route):
    """清理后留下的一定是最新（id 最大）的那条。"""
    monkeypatch.delenv("DEMO_ADMIN_TOKEN", raising=False)

    ids = []
    for _ in range(3):
        result = client.post("/api/simulate", json={"order": sample_order, "route": sample_route}).json()
        ids.append(result["runId"])

    client.delete("/api/simulations", params={"keep": 1})
    remaining = [row["id"] for row in client.get("/api/simulations", params={"limit": 50}).json()]

    assert remaining == [ids[-1]]


@pytest.mark.parametrize("keep", [-1, 1001])
def test_cleanup_keep_bounds(client, keep):
    """keep 越界被参数校验拦住。"""
    assert client.delete("/api/simulations", params={"keep": keep}).status_code == 422
