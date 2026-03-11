# Workstation Visual QA Specification

> **Target**: http://localhost:5174/workstation
> **Type**: Visual Audit
> **Focus**: UI/UX Issues

---

## Visual Checklist

### 1. Page Layout
- [ ] Header displays correctly (reasonable height ~48px, white background)
- [ ] Title "ASF Workstation" visible and aligned left
- [ ] Project Select dropdown works and shows all projects
- [ ] Team/Process tag shows current project info
- [ ] Refresh button on right side

### 2. ReactFlow Canvas
- [ ] Canvas fills available space (no scroll issues)
- [ ] Nodes display with correct labels and icons
- [ ] Edges connect nodes with arrows
- [ ] MiniMap visible in corner
- [ ] Controls (zoom/fit) visible

### 3. Team Flow Display
- [ ] T1: Mission Goal → PM → DEV → Complete
- [ ] T2: Mission Goal → PM → DEV → QA → Complete
- [ ] T3: Mission Goal → PM → VD → DEV → QA → Complete
- [ ] T5: Mission Goal → IA → JQA → SQA → Complete

### 4. Activity Stream Panel
- [ ] Dark panel on right (380px width)
- [ ] "Agent Activity Stream" title visible
- [ ] Live tag indicator
- [ ] Logs scroll properly
- [ ] New logs appear at top

### 5. Interaction
- [ ] Selecting project updates flow
- [ ] Events appear when project runs
- [ ] Node colors change based on status

---

## Issues to Verify

1. **页面遮盖** - No elements overlapping
2. **标题匹配** - Shows correct project name
3. **Flow正确** - Team type matches T1-T5
4. **流转显示** - Node highlighting works

---

## Success Criteria

- [ ] All 5 sections pass visual inspection
- [ ] No layout breaking on resize
- [ ] Responsive behavior correct
