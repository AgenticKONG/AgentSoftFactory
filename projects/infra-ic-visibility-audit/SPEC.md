# 📄 SPEC: Infra Center Data Visibility & Component Integrity

## 🎯 审计目标
**对象：** `console/src/pages/InfraCenter/index.tsx`
**背景：** 后端 API `/api/asf/infra/info` 已验证返回有效 JSON，但前端曾出现白屏或数据不显示的情况。

## 🛠️ 审计需求 (QA Requirements)

### 1. 外部依赖对齐 (Dependency Alignment)
- 检查 JSX 代码中引用的所有组件（如 `Cpu`, `Zap`, `Shield` 等）是否已在文件顶部的 `import` 语句中定义。
- **历史痛点：** 曾因漏掉 `Shield` 图标导致 React 运行时崩溃。

### 2. 数据结构韧性 (Data Resilience)
- 验证 `fetchInfraData` 是否对 API 返回的 `data` 进行了深层合并（Deep Merge）。
- 确保即使 API 返回残缺对象（例如缺失 `state` 字段），渲染逻辑也不会触发 `TypeError: Cannot read property of undefined`。

### 3. 状态生命周期 (State Lifecycle)
- 检查 `isDirty` 标记的重置时机。
- 确认 `useEffect` 的依赖项（Dependencies）是否完整，防止死循环请求 API。

## 🏁 验收标准 (Acceptance Criteria)
- **Junior QA (Llama):** 必须通过静态扫描，确认无未定义引用和基本语法错误。
- **Senior QA (Bob):** 必须通过逻辑推演，确认在 API 异常或数据为空时，UI 仍能显示“N/A”或“Empty”状态而不崩溃。
