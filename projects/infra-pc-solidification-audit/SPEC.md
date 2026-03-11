# 📋 Project Center 全量测试脚本 (QA 自动化版 V1.7)

> **目标:** 严格执行全量矩阵测试，验证 UI 联动与后端拦截对 `pc_rules.json` 的 100% 履约。

---

## 1. 审计地图 (Targets)
- **UI**: `http://localhost:5174/project-setup`

- **Frontend Code**: `console/src/pages/ProjectSetup/index.tsx`
- **Backend Code**: `src/copaw/agents/infra/project_manager.py`
- **Constitution**: `src/copaw/config/pc_rules.json`

---

## 2. 全量维度校验矩阵 (Universal Verification Matrix)

QA 必须验证以下 **每一个组合** 的推导结果。如果实际结果与期望不符，立即判定为 FAIL。

### 2.1 默认值推导测试 (Category x Level)

| 组合编号 | 输入: Category | 输入: Level | 期望结果: Team | 期望结果: Process | 规则依据 |
|:---|:---|:---|:---|:---|:---|
| **TC-01** | FRONT | L1 | **T1** | **P1** | Default |
| **TC-02** | FRONT | L5 | **T4** | **P4** | Auto-Upgrade (L5) |
| **TC-03** | VIZ | L2 | **T1** | **P1** | Base Level (L2) |
| **TC-04** | VIZ | L3 | **T3** | **P3** | Auto-Upgrade (VIZ L3) |
| **TC-05** | INFRA | L1 | **T5** | **P5** | Hard Rule (Force L3+) |
| **TC-06** | INFRA | L3 | **T5** | **P5** | Hard Rule (Sovereign) |
| **TC-07** | DATA | L1 | **T1** | **P1** | Default |
| **TC-08** | BACK | L2 | **T1** | **P1** | Min Level (L2) |

### 2.2 物理绑定同步测试 (Binding Law)

| 组合编号 | 操作行为 | 期望结果 |
|:---|:---|:---|
| **TC-09** | 手动更改 Team = T2 | Process 自动变为 **P2** |
| **TC-10** | 手动更改 Team = T3 | Process 自动变为 **P3** |
| **TC-11** | 手动更改 Team = T5 | Process 自动变为 **P5** |

---

## 3. 后端硬拦截脚本 (Backend Blocking)

QA 必须审计 `project_manager.py` 确保以下逻辑**物理存在**：

- [ ] **拦截 1**: 若 `Category=INFRA` 且 `Level < L3`，后端必须抛出 `Governance Error`。
- [ ] **拦截 2**: 若 `Level=L5` 且 `Team` 不含 `SQA/Human`，后端必须抛出 `Governance Error`。
- [ ] **拦截 3**: 若 `Category=INFRA` 且 `Team != T5`，后端必须抛出 `Governance Error`。

---

## 4. 工程韧性专项 (Resilience)

- [ ] **R-01**: 验证 `rules` 变量在 `ProjectSetup` 中是否使用了 `?.` (Optional Chaining)。
- [ ] **R-02**: 验证 `asf_production_line.py` 是否在 `INFRA` 任务下物理封锁了 LLM 生成逻辑。

---

## 5. 最终裁决 (Verdict)
- **DECISION: PASS**: 当且仅当上述 TC-01 至 TC-11 全部通过，且 3 项后端拦截逻辑物理生效。
- **DECISION: FAIL**: 发现任何一个组合推导错误或代码硬编码映射。
