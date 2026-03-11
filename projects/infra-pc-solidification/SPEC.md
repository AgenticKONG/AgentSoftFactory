# Project Center (PC) QA Test Specification

> **Project ID**: infra-pc-solidification
> **Type**: Functional P5 Audit
> **Target**: PC Module (Registry, Setup, Dashboard, Workstation)

---

## 重要提示: SPEC覆盖率自检

> **经验教训**: 详细设计不完整 → 测试用例不全 → P5虚假繁荣

每次P5测试前，请对照SPEC自检：
1. 是否覆盖所有UI页面？
2. 是否覆盖边界条件？(如INFRA+L1报错)
3. 是否覆盖异常流程？
4. 测试用例与SPEC描述是否一致？

---

## 1. Test Scope

### 1.1 Target Components
- **Frontend**: Console UI Pages
  - ProjectList (`/projects`)
  - ProjectSetup (`/project-setup`)
  - ProjectDashboard (`/projects/{id}`)
  - Workstation (`/workstation`)
- **Backend**: REST APIs & Business Logic
  - ASFProjectManager
  - ASFFactory (P5)
  - pc_rules.json validation

### 1.2 Test Environment
- Frontend: http://localhost:5174
- Backend: http://localhost:8088
- Test Project ID: `test-pc-qa-001`

---

## 2. Test Cases

### 2.1 TC-01: Registry - Project Listing

| Item | Detail |
|------|--------|
| **Objective** | Verify ProjectList displays all projects |
| **Steps** | 1. Navigate to `/projects` <br> 2. Verify project cards display |
| **Expected** | All projects from registry.json shown in grid |
| **Verify** | Card shows: ID, Name, Path |

### 2.2 TC-02: Setup - Category×Level Auto-Upgrade

| Item | Detail |
|------|--------|
| **Objective** | Verify Category+Level selection updates Team+Process |
| **Steps** | 1. Go to `/project-setup` <br> 2. Select Category=VIZ, Level=L3 <br> 3. Observe Team/Process |
| **Expected** | Team=T3, Process=P3 (Auto-upgrade) |
| **Verify** | Select VIZ L3 → T3/P3 |

### 2.3 TC-03: Setup - INFRA Hard Constraint

| Item | Detail |
|------|--------|
| **Objective** | Verify INFRA L1/L2 are blocked |
| **Steps** | 1. Go to `/project-setup` <br> 2. Select Category=INFRA, Level=L1 |
| **Expected** | Backend returns 400 error OR auto-upgrade to L3 |
| **Verify** | Error message or auto-L3 |

### 2.4 TC-04: Setup - Team↔Process Bidirectional

| Item | Detail |
|------|--------|
| **Objective** | Verify T↔P sync both directions |
| **Steps** | 1. Change Team to T2 <br> 2. Verify Process=P2 <br> 3. Change Process to P3 <br> 4. Verify Team=T3 |
| **Expected** | T2↔P2, T3↔P3, T5↔P5 sync |
| **Verify** | Both directions work |

### 2.5 TC-05: Setup - Create Project Success

| Item | Detail |
|------|--------|
| **Objective** | Verify project creation |
| **Steps** | 1. Fill: ID=test-pc-qa-001, Name="QA Test" <br> 2. Category=FRONT, Level=L1 <br> 3. Click Create |
| **Expected** | Project created, redirect to Dashboard |
| **Verify** | `/projects/test-pc-qa-001` accessible |

### 2.6 TC-06: Dashboard - Level Selector

| Item | Detail |
|------|--------|
| **Objective** | Verify Level selector exists and works |
| **Steps** | 1. Open project Dashboard <br> 2. Find Level selector |
| **Expected** | Level dropdown with L1-L5 options |
| **Verify** | Selector present in Infrastructure Matrix |

### 2.7 TC-07: Dashboard - Category Change Triggers Defaults

| Item | Detail |
|------|--------|
| **Objective** | Verify Category change calls defaults API |
| **Steps** | 1. Open Dashboard <br> 2. Change Category to VIZ <br> 3. Observe Team changes |
| **Expected** | Team auto-updates to T3 |
| **Verify** | Network call to `/api/asf/pc/defaults` |

### 2.8 TC-08: Dashboard - T↔P Bidirectional Sync

| Item | Detail |
|------|--------|
| **Objective** | Verify T↔P sync in Dashboard |
| **Steps** | 1. In Dashboard, change Team to T4 <br> 2. Verify Process=P4 <br> 3. Change Process to P2 <br> 4. Verify Team=T2 |
| **Expected** | Bidirectional sync works |
| **Verify** | Both directions update correctly |

### 2.9 TC-09: Workstation - Project List Load

| Item | Detail |
|------|--------|
| **Objective** | Verify Workstation loads projects |
| **Steps** | 1. Navigate to `/workstation` <br> 2. Check dropdown |
| **Expected** | Project list populated |
| **Verify** | Select shows all projects |

### 2.10 TC-10: Workstation - Event Polling

| Item | Detail |
|------|--------|
| **Objective** | Verify event polling works |
| **Steps** | 1. Launch a project with P5 <br> 2. Go to Workstation <br> 3. Select running project |
| **Expected** | Events appear in log stream |
| **Verify** | Logs update every 2 seconds |

### 2.11 TC-11: Backend - pc_rules.json Valid

| Item | Detail |
|------|--------|
| **Objective** | Verify rules file loads correctly |
| **Steps** | Call GET `/api/asf/pc/rules` |
| **Expected** | Returns full rules JSON with categories, levels, teams, processes |
| **Verify** | All sections present |

### 2.12 TC-12: Backend - Defaults API

| Item | Detail |
|------|--------|
| **Objective** | Verify defaults calculation |
| **Steps** | Call `/api/asf/pc/defaults?category=INFRA&level=L3` |
| **Expected** | Returns {team: T5, process: P5} |
| **Verify** | INFRA L3 maps to T5/P5 |

---

## 3. Verification Matrix

| TC | Category | Input | Expected Output | Status |
|----|----------|-------|-----------------|--------|
| TC-01 | Registry | GET /projects | All projects listed | |
| TC-02 | Setup | VIZ L3 | T3/P3 | |
| TC-03 | Setup | INFRA L1 | Error or L3 | |
| TC-04 | Setup | T2↔P2 | Bidirectional | |
| TC-05 | Setup | Create project | Success | |
| TC-06 | Dashboard | Level selector | L1-L5 options | |
| TC-07 | Dashboard | Change C=VIZ | Team→T3 | |
| TC-08 | Dashboard | T4↔P4 | Bidirectional | |
| TC-09 | Workstation | Load page | Projects loaded | |
| TC-10 | Workstation | Poll events | Logs appear | |
| TC-11 | Backend | GET /pc/rules | Full rules JSON | |
| TC-12 | Backend | INFRA L3 | T5/P5 | |

---

## 3B. Extended Test Cases (边界条件)

### TC-13: P5创建约束 - 非INFRA报错

| Item | Detail |
|------|--------|
| **Objective** | 验证P5必须配合INFRA |
| **Steps** | POST /api/asf/projects/create, body: {process: P5, category: FRONT} |
| **Expected** | 400 Error: "P5 process requires INFRA category" |
| **Verify** | 后端校验生效 |

### TC-14: P5创建约束 - L1/L2报错

| Item | Detail |
|------|--------|
| **Objective** | 验证P5必须L3+ |
| **Steps** | POST /api/asf/projects/create, body: {process: P5, category: INFRA, level: L1} |
| **Expected** | 400 Error: "P5 process requires Level L3 or higher" |
| **Verify** | 后端校验生效 |

### TC-15: P5创建约束 - 非T5报错

| Item | Detail |
|------|--------|
| **Objective** | 验证P5必须配合T5 |
| **Steps** | POST /api/asf/projects/create, body: {process: P5, category: INFRA, level: L3, team: T1} |
| **Expected** | 400 Error: "P5 process requires Team T5" |
| **Verify** | 后端校验生效 |

### TC-16: Workstation - T5项目显示正确Flow

| Item | Detail |
|------|--------|
| **Objective** | 验证T5项目显示IA→JQA→SQA流程 |
| **Steps** | 1. 在Workstation选择P5项目 (team=T5) <br> 2. 观察Flow图 |
| **Expected** | 显示5个节点: Mission Goal → IA → JQA → SQA → Complete |
| **Verify** | Flow与team.structure匹配 |

### TC-17: Workstation - T1项目显示T1 Flow

| Item | Detail |
|------|--------|
| **Objective** | 验证T1项目显示PM→DEV流程 |
| **Steps** | 1. 在Workstation选择T1项目 <br> 2. 观察Flow图 |
| **Expected** | 显示4个节点: Mission Goal → PM → DEV → Complete |
| **Verify** | Flow与team.structure匹配 |

### TC-18: Workstation - 事件流显示node_id

| Item | Detail |
|------|--------|
| **Objective** | 验证事件日志正确显示node_id |
| **Steps** | 1. 运行P5项目 <br> 2. 在Workstation观察日志 |
| **Expected** | 日志格式: "[IA] thinking: L1: Physical Consistency Check..." |
| **Verify** | 日志包含node_id |

---

## 4. Success Criteria

- **PASS**: All 12 + 6 extended test cases pass (18/18)
- **FAIL**: Any test case fails

---

## 5. Test Execution

### 5.1 Pre-requisites
- Backend running on port 8088
- Frontend running on port 5174
- Test project can be created

### 5.2 Execution Order
1. Backend API tests (TC-11, TC-12)
2. Setup page tests (TC-02, TC-03, TC-04, TC-05)
3. Dashboard tests (TC-06, TC-07, TC-08)
4. Registry test (TC-01)
5. Workstation tests (TC-09, TC-10)

---

## 6. Notes

- Use browser DevTools Network tab to verify API calls
- For TC-10, need an active running project to test events
- TC-03 may auto-upgrade instead of error (acceptable)
