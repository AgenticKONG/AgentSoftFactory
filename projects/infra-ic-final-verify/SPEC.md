# 📄 SPEC: Infra Center FULL Functional Integrity

## 🎯 审计目标
**对象：** `console/src/pages/InfraCenter/index.tsx`
**核心要求：** 必须包含完整的四大治理模块，严禁任何功能阉割。

## 🛠️ 审计需求 (QA Requirements)

### 1. 四大治理 Tab 完备性
- **Tab 1: Operational Dashboard** (状态矩阵、进化日志)
- **Tab 2: Soul Constitution** (灵魂宪法)
- **Tab 3: Daemon Agents** (自动化任务/Reflex Jobs、Backlog)
- **Tab 4: Neural Link** (Soul Bridge 终端)

### 2. 守护进程逻辑 (Daemon Logic)
- 必须包含 `fetchReflexJobs` 异步函数。
- 必须包含 `runReflexJob` 触发函数。
- **Daemon Agents** 标签页必须渲染 `reflexJobs` 列表。

### 3. 数据韧性
- 所有的 `data` 访问必须带 `?.` 保护。
- 必须包含所有必需的 Lucide 图标导入。

## 🏁 验收标准
Bob 必须确认 **Daemon Agents** 标签页物理存在且逻辑完整。如果发现任何功能缺失，给出 **DECISION: FAIL**。
