# 📋 Infra Center 模块详细设计说明书 (QA 标准版)

> **版本:** 1.0  
> **目标:** 为 QA 团队提供 Infra Center 各功能模块的验收标准

---

## 1. 模块概述

**Infra Center** 是 ASF 系统的"基础设施治理中心"，为 Infra Agent（IA）提供独立的工作入口和状态展示。

**访问路径:** `/infra-center`  
**数据源:** `/api/asf/infra/info`, `/api/asf/infra/chat/history`

---

## 2. 页面结构

```
┌─────────────────────────────────────────────────────────────┐
│  Infra Center (Title)              [副标题: Autonomous ...]  │
├─────────────────────────────────────────────────────────────┤
│  [Tab1] Operational Dashboard                               │
│  [Tab2] Soul Constitution                                   │
│  [Tab3] Daemon Agents                                      │
│  [Tab4] Neural Link                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 各 Tab 详细验收标准

### 3.1 Tab 1: Operational Dashboard (运行状态矩阵)

**渲染内容:**
- 3 个状态卡片 (Col span=8):
  - **Checkpoint** → 显示 `state.last_checkpoint`
  - **Current Focus** → 显示 `state.current_task`
  - **Brain Clock** → 显示 `state.timestamp`
- **Evolution Logs** 列表 → 显示 `evolution_logs[]`

**API 字段映射:**

| UI 显示 | API 字段 | 缺省值 |
|--------|---------|-------|
| Checkpoint | `infraData.state.last_checkpoint` | "N/A" |
| Current Focus | `infraData.state.current_task` | "Idle" |
| Brain Clock | `infraData.state.timestamp` | "N/A" |
| Evolution Logs | `infraData.evolution_logs` | `[]` |

**验收检查点:**
- [ ] 3 个状态卡片正确渲染，无白屏
- [ ] `last_checkpoint` 正确显示 checkpoint ID
- [ ] `current_task` 正确显示当前任务名称
- [ ] `timestamp` 正确显示时间戳
- [ ] Evolution Logs 列表正确渲染，每条显示 `{time}` 和 `{action}`

---

### 3.2 Tab 2: Soul Constitution (灵魂宪法)

**渲染内容:**
- `soul.principles` 列表
- 每条原则前显示 `⚡` 图标

**API 字段映射:**

| UI 显示 | API 字段 |
|--------|---------|
| 原则列表 | `infraData.soul.principles` |

**验收检查点:**
- [ ] 列表正确渲染，无白屏
- [ ] 每条原则前有 `⚡` 图标
- [ ] 原则内容完整显示（从 SOUL.md 解析）

---

### 3.3 Tab 3: Daemon Agents (守护进程)

**渲染内容:**
- **左侧 (Col span=16):** Evolution Backlog
  - 显示 `infraData.evolution_backlog`
  - 样式: 灰底 `#f1f5f9`，等宽字体 `monospace`
- **右侧 (Col span=8):** Housekeeping Jobs
  - 显示 `reflexJobs` 列表（过滤 `job.meta.category === 'infra'`）
  - 每项显示 Job Name + Play 按钮

**API 字段映射:**

| UI 显示 | API 字段 |
|--------|---------|
| Evolution Backlog | `infraData.evolution_backlog` |
| Housekeeping Jobs | `reflexJobs` (来自 `/api/asf/cron/list`) |

**交互行为:**
- 点击 Play 按钮 → 触发 `runReflexJob(jobId)` → 调用 `api.triggerCronJob(jobId)`
- 成功: `message.success("Reflex Triggered.")`
- 失败: `message.error("Reflex Failed.")`

**验收检查点:**
- [ ] Evolution Backlog 区域正确渲染，背景色和字体正确
- [ ] Housekeeping Jobs 列表正确渲染
- [ ] 点击 Play 按钮有交互反馈（成功/失败提示）
- [ ] `reflexJobs` 正确过滤（只显示 `category === 'infra'` 的任务）

---

### 3.4 Tab 4: Neural Link (神经链接终端)

**渲染内容:**
- 终端容器 (`terminal-container`)
  - 高度: `calc(100vh - 280px)`
  - 背景: `#fff`，边框圆角 12px
- 消息列表 (`terminal-body`)
  - 显示 `messages[]`
  - 用户消息: 前缀 `root@asf # `
  - Agent 消息: 前缀 `>> `
  - 消息样式: 左边框 `#f1f5f9`，左内边距 12px
- 输入区域 (`terminal-input-area`)
  - 输入框: `placeholder="Instruct the Brain..."`
  - 回车触发 `sendMessage()`

**API 字段映射:**

| UI 显示 | API 字段 |
|--------|---------|
| 消息历史 | `messages` (来自 `/api/asf/infra/chat/history`) |

**交互行为:**
- 输入框回车 → 调用 `/api/agent/process`
  - `session_id: "infra-governance"`
  - `user_id: "architect"`
  - `channel: "console"`
- 发送后刷新历史: `fetchChatHistory()`
- 自动滚动到底部

**验收检查点:**
- [ ] 终端容器高度正确（可视区域 - 280px）
- [ ] 消息列表正确渲染历史消息
- [ ] 消息样式区分用户/Agent（不同前缀）
- [ ] 输入框可输入文字
- [ ] 回车发送消息
- [ ] 发送后消息列表自动更新
- [ ] 发送后自动滚动到底部

---

## 4. 全局行为

### 4.1 初始化

```typescript
useEffect(() => {
  await Promise.all([
    fetchInfraData(),    // GET /api/asf/infra/info
    fetchReflexJobs(),   // GET /api/asf/cron/list
    fetchChatHistory()   // GET /api/asf/infra/chat/history
  ]);
}, []);
```

**验收检查点:**
- [ ] 页面加载时显示 `Spin` 提示 "Establishing Soul Bridge..."
- [ ] 初始化完成后 Spin 消失，显示完整内容
- [ ] 初始化失败时无白屏（错误被 try-catch 捕获）

### 4.2 定时刷新

```typescript
// 每 5 秒刷新一次 chat history
setInterval(() => { fetchChatHistory(); }, 5000);
```

**验收检查点:**
- [ ] Neural Link 页面每 5 秒自动刷新消息

---

## 5. 数据韧性要求

**所有 data 访问必须使用 `?.` 运算符:**

```typescript
// ✅ 正确
{infraData?.state?.last_checkpoint || "N/A"}
{infraData?.soul?.principles || []}

// ❌ 错误
{infraData.state.last_checkpoint}
```

**验收检查点:**
- [ ] 所有 `infraData` 访问使用可选链 `?.`
- [ ] 所有嵌套属性访问使用可选链 `?.`
- [ ] 缺省值正确提供（见上方各表）

---

## 6. 图标依赖

**必须导入的 Lucide 图标:**

| 图标名 | 用途 |
|-------|------|
| `Cpu` | 页面标题 Icon |
| `Zap` | Current Focus / Tab3 |
| `LayoutDashboard` | Tab1 |
| `BookOpen` | Tab2 |
| `Activity` | Checkpoint |
| `Shield` | Checkpoint |
| `Clock` | Brain Clock |
| `Terminal` | Tab4 |
| `ChevronRight` | 输入框前缀 |
| `Play` | Job 触发按钮 |

**验收检查点:**
- [ ] 所有图标正确导入
- [ ] 无因图标未定义导致的 React 运行时错误

---

## 7. API 依赖

| API 端点 | 方法 | 用途 |
|---------|------|------|
| `/api/asf/infra/info` | GET | 获取 soul, state, evolution_backlog |
| `/api/asf/infra/chat/history` | GET | 获取 Neural Link 消息历史 |
| `/api/asf/cron/list` | GET | 获取 reflexJobs |
| `/api/cron/{jobId}/trigger` | POST | 触发 reflex job |
| `/api/agent/process` | POST | 发送消息到 IA |

**验收检查点:**
- [ ] 所有 API 端点正确配置
- [ ] API 错误被 try-catch 捕获，不导致白屏

---

## 8. 样式规范

| 元素 | 样式值 |
|------|-------|
| 页面背景 | `#f8fafc` |
| 页面内边距 | `32px` |
| 卡片圆角 | `16px` |
| Backlog 背景 | `#f1f5f9` |
| 终端背景 | `#fff` |
| 终端边框 | `#e2e8f0` |
| 输入区背景 | `#f8fafc` |

---

## 9. QA 测试矩阵

| 测试项 | 检查点 | 优先级 |
|--------|-------|--------|
| Tab1 数据渲染 | 3 个状态卡片 + Evolution Logs | P0 |
| Tab2 数据渲染 | Principles 列表 | P0 |
| Tab3 Backlog 渲染 | 灰底等宽字体 | P0 |
| Tab3 Jobs 列表 | 过滤 + 触发按钮 | P0 |
| Tab4 消息渲染 | 历史消息 + 样式 | P0 |
| Tab4 消息发送 | 输入 + 发送 + 刷新 | P0 |
| 数据韧性 | `?.` 运算符使用 | P1 |
| 图标依赖 | 所有图标已导入 | P1 |
| 定时刷新 | 5 秒自动刷新 | P2 |
