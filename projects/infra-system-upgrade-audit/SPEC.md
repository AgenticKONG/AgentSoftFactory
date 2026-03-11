# 📋 P5 引擎重构详细设计说明书 (Engine Solidification)

> **版本:** 1.1
> **目标:** 修复 P5 生产流水线中的核心逻辑缺陷，确保其具备工业级的鲁棒性和可观察性。

---

## 1. 核心修复要求 (P0)

- **去 PM 化**: P5 流程严禁 LLM 生成 SPEC，必须强制读取物理 `SPEC.md` 文件。
- **动态路径解析**: 严禁硬编码绝对路径。必须基于 `__file__` 动态向上追溯 4 层以定位 `PROJECT_ROOT`。
- **空指针防护**: 在 `os.path.join` 之前，必须对 `agent_id` 和 `root_dir` 进行非空校验（Handled: `agent_id = cfg.get("id") or role.upper()`）。
- **导入完整性**: 确保 `datetime` 等核心模块在所有引用处正确导入。

## 2. 审计与观察性要求 (P1)

- **增量报告保存**: JQA 和 SQA 的审计报告必须在各自完成后立即物理持久化到 `history/` 目录，文件名为 `P5_REPORT_T{iteration}_STEP{1|2}_{ROLE}.json`。
- **结构化决策**: 强制要求 QA 模型以 JSON 格式输出决策结论：`{"decision": "PASS"/"FAIL", "reason": "..."}`。
- **鲁棒解析**: 使用正则提取 JSON，对语气词和中文结论具备基本的容错性。

## 3. 验收标准

- **JQA 验收**: 扫描 `asf_production_line.py` 源码，确认无语法错误、无路径泄露、无空指针风险。
- **SQA 验收**: 验证逻辑流是否符合 `DEV -> JQA -> SQA -> PASS` 的状态机流转。
