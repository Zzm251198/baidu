"""Excel 导出测试。

【为什么值得测】
导出是"交给别人的东西"：领导/评委不会去看网页，会打开你导出的表格。
如果表里利润是 477.90 而网页写 477.90，但导出的却是别的数，信任就崩了。
所以这里断言三件事：
1. 导出的文件是合法的 xlsx（能被 openpyxl 读回来，说明不是坏包）
2. 数字与仿真结果逐位一致（477.90 不会变成 477.9 或 478）
3. 五个 sheet 都在，且行数与编排结果对得上（3 个 AGV 节点就是 3 行）
"""

from __future__ import annotations

import io

from openpyxl import load_workbook


def _export_run(client, sample_order, sample_route) -> tuple[int, bytes]:
    """先跑一次仿真拿到 runId，再导出它的 xlsx 内容。"""
    result = client.post("/api/simulate", json={"order": sample_order, "route": sample_route}).json()
    assert result["success"] is True
    run_id = result["runId"]

    response = client.get(f"/api/simulations/{run_id}/export.xlsx")
    assert response.status_code == 200
    return run_id, response.content


def test_export_returns_valid_xlsx(client, sample_order, sample_route):
    """返回的必须是能打开的 xlsx，而不是一段 HTML 或报错页。"""
    run_id, content = _export_run(client, sample_order, sample_route)

    # xlsx 本质是 zip，头两个字节固定是 "PK"
    assert content[:2] == b"PK", "导出的不是 zip/xlsx 格式"
    assert len(content) > 4000, "文件太小，可能是空表"

    workbook = load_workbook(io.BytesIO(content))
    assert workbook.sheetnames == ["运行摘要", "列车编排", "AGV 编排", "作业明细", "风险评估"]

    # 文件名与路径一致，避免下载到名叫 download 的无名文件
    response = client.get(f"/api/simulations/{run_id}/export.xlsx")
    assert "attachment" in response.headers["content-disposition"]
    assert f"simulation-{run_id}.xlsx" in response.headers["content-disposition"]
    assert response.headers["content-type"].startswith(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


def test_export_numbers_match_simulation(client, sample_order, sample_route):
    """表格里的钱数必须与前端/后端算出的 603.00 / 125.10 / 477.90 完全一致。"""
    result = client.post("/api/simulate", json={"order": sample_order, "route": sample_route}).json()
    run_id = result["runId"]

    workbook = load_workbook(io.BytesIO(client.get(f"/api/simulations/{run_id}/export.xlsx").content))
    sheet = workbook["运行摘要"]

    values = {row[0]: row[1] for row in sheet.iter_rows(min_row=2, values_only=True)}

    assert values["运行编号"] == run_id
    assert values["起点 → 终点"] == "牛湖 → 罗湖"
    assert values["列车段数"] == 2
    assert values["总站数"] == 27
    assert values["总时长 (分钟)"] == 72
    assert values["换乘次数"] == 1
    assert values["AGV 作业节点"] == 3
    assert values["收入 (元)"] == 603.0
    assert values["成本 (元)"] == 125.1
    assert values["利润 (元)"] == 477.9


def test_export_sheet_rows_match_plans(client, sample_order, sample_route):
    """每张明细表的行数必须与编排结果一致（3 个 AGV 节点 = 3 行）。"""
    result = client.post("/api/simulate", json={"order": sample_order, "route": sample_route}).json()
    run_id = result["runId"]
    workbook = load_workbook(io.BytesIO(client.get(f"/api/simulations/{run_id}/export.xlsx").content))

    # 列车 2 段、AGV 3 节点、作业 3 行（与 trainPlan / agvPlan / operationRows 一一对应）
    assert workbook["列车编排"].max_row == 1 + 2
    assert workbook["AGV 编排"].max_row == 1 + 3
    assert workbook["作业明细"].max_row == 1 + 3

    # 风险评估 4 项（容量/电量/时效/换乘）
    assert workbook["风险评估"].max_row == 1 + 4

    agv_rows = list(workbook["AGV 编排"].iter_rows(min_row=2, values_only=True))
    assert [row[1] for row in agv_rows] == [agv["agvId"] for agv in result["agvPlan"]]


def test_export_missing_run_returns_404(client):
    """不存在的运行编号必须 404，不能返回一个空表格。"""
    assert client.get("/api/simulations/999999/export.xlsx").status_code == 404
