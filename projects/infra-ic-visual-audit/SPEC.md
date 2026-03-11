# 📋 Infra Center 视觉检查 SPEC (UI/QA)

> **版本:** 1.0  
> **目标:** 补充 UI 视觉对齐检查，作为 P5 流程的第二阶段
> **范围:** Tab1-Tab4 的排版、间距、对齐、字体等视觉规范

---

## 1. 通用视觉规范

### 1.1 对齐要求
| 元素 | 规范 |
|------|------|
| 所有 Card | `textAlign: 'left'` |
| 所有 List.Item | `textAlign: 'left'` |
| 所有 Text 标签 | 显式对齐或使用 Flex |
| Tab 内容区 | 整体左对齐 |

### 1.2 间距规范
| 元素 | 规范 |
|------|------|
| Card 内边距 | `padding: 24px` 或 `bodyStyle={{padding:24}}` |
| 列表项间距 | `marginBottom: 8-16px` |
| 卡片间距 | `marginTop: 24px` |
| 页面内边距 | `padding: 32px` |

### 1.3 字体规范
| 元素 | 字体 |
|------|------|
| 页面标题 | `Title level={2}` |
| 卡片标题 | `Title level={4}` 或 `<span><Icon/> Label</span>` |
| 正文 | `Text` 组件，默认 14px |
| 辅助文字 | `Text type="secondary"`, 12px |
| 等宽字体 | `fontFamily: '"Fira Code", monospace'` |

---

## 2. Tab 1: Operational Dashboard

### 2.1 状态卡片 (Col span=8 × 3)
```tsx
<div style={{ 
  padding: '16px',           // 内边距
  background: '#f8fafc',    // 背景
  borderRadius: '12px',     // 圆角
  border: '1px solid #f1f5f9' // 边框
}}>
  // 标签和数值都需要左对齐
  <div style={{ textAlign: 'left' }}>
    <Text ...>Label</Text>
    <div style={{ textAlign: 'left' }}>Value</div>
  </div>
</div>
```

**检查点:**
- [ ] 3 个卡片等高排列 (flex 或 grid)
- [ ] 标签和数值均为左对齐
- [ ] 卡片内部 padding 一致 (16px)
- [ ] 卡片间距相等 (gutter=16)

### 2.2 Evolution Logs
```tsx
<List.Item style={{ 
  border:'none', 
  padding:'8px 0',
  textAlign: 'left'  // 关键
}}>
  <div style={{ display: 'flex', alignItems: 'center', textAlign: 'left', gap: 8 }}>
    <Tag>time</Tag>
    <Text strong>action</Text>
    <Text type="secondary">correction</Text>
  </div>
</List.Item>
```

**检查点:**
- [ ] List.Item 有 `textAlign: 'left'`
- [ ] 使用 Flex 容器确保元素不换行
- [ ] Tag + Text 垂直居中对齐
- [ ] 时间标签、动作、修正说明依次左对齐

---

## 3. Tab 2: Soul Constitution

```tsx
<List.Item style={{ 
  padding: '16px 0', 
  borderBottom: '1px solid #f1f5f9',
  textAlign: 'left'  // 关键
}}>
  <div style={{ display: 'flex', alignItems: 'flex-start', textAlign: 'left' }}>
    <span>⚡</span>
    <Text style={{ fontSize: 14 }}>principle text</Text>
  </div>
</List.Item>
```

**检查点:**
- [ ] List.Item 左对齐
- [ ] ⚡ 图标与文本垂直顶部对齐
- [ ] 文本不溢出容器
- [ ] 每条原则之间有分隔线

---

## 4. Tab 3: Daemon Agents

### 4.1 Backlog 区域
```tsx
<div style={{ 
  background: '#f1f5f9',   // SPEC 要求灰底
  padding: 20,              // 内边距
  borderRadius: 12,         // 圆角
  textAlign: 'left'         // 左对齐
}}>
```

**检查点:**
- [ ] 背景色为 `#f1f5f9`
- [ ] 使用等宽字体
- [ ] 内容不超出容器边界

### 4.2 Jobs 列表
```tsx
<List.Item style={{ 
  textAlign: 'left',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
  <Text>Job Name</Text>
  <Button icon={<Play/>}>Trigger</Button>
</List.Item>
```

**检查点:**
- [ ] Job 名称和按钮左右对齐
- [ ] 按钮可点击区域足够大

---

## 5. Tab 4: Neural Link

### 5.1 终端容器
```tsx
<div style={{ 
  height: 'calc(100vh - 280px)',
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  textAlign: 'left'  // 关键
}}>
```

### 5.2 消息列表
```tsx
<div style={{ 
  textAlign: 'left',  // 关键
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 16  // 消息之间间距
}}>
  {/* 每条消息 */}
  <div style={{ textAlign: 'left' }}>
    <Text prefix>root@asf # </Text>
    <div style={{ 
      textAlign: 'left',
      padding: '8px 12px',
      borderLeft: '2px solid #2563eb'  // 用户蓝，助理灰
    }}>
      {message}
    </div>
  </div>
</div>
```

**检查点:**
- [ ] 容器高度正确 (calc(100vh - 280px))
- [ ] 消息列表左对齐
- [ ] 用户消息有蓝色左边框
- [ ] 助理消息有灰色左边框
- [ ] 消息之间有适当间距 (gap: 16)
- [ ] 输入框与消息列表间距

### 5.3 输入区域
```tsx
<div style={{ 
  padding: '16px 24px',
  background: '#f8fafc',
  borderTop: '1px solid #e2e8f0',
  textAlign: 'left'
}}>
  <Input 
    prefix={<ChevronRight/>}
    placeholder="Instruct the Brain..."
  />
</div>
```

**检查点:**
- [ ] 输入框左对齐
- [ ] 有 ChevronRight 前缀图标
- [ ] placeholder 文字正确

---

## 6. 全局检查

### 6.1 响应式适配
- [ ] 页面在 1920px 宽度下正常显示
- [ ] 页面在 1440px 宽度下正常显示
- [ ] 卡片不会重叠

### 6.2 颜色一致性
- [ ] 主色调 `#2563eb` (蓝色) 用于关键元素
- [ ] 背景色 `#f8fafc` 一致
- [ ] 边框色 `#e2e8f0` / `#f1f5f9` 一致
- [ ] 文字颜色 `#1e2937` / `#64748b` 层次分明

### 6.3 交互反馈
- [ ] 按钮 hover 有视觉反馈
- [ ] 输入框 focus 有边框变化
- [ ] 消息发送有 loading 状态

---

## 7. JQA 检查清单 (llama3.2)

```json
{
  "checks": [
    "所有 Card 使用 bodyStyle={{padding:24}} 或 style={{padding:24}}",
    "所有 List.Item 使用 textAlign: 'left'",
    "Tab1 状态卡片使用统一 padding (16px)",
    "Evolution Logs 使用 Flex 容器确保左对齐",
    "Tab2 Principles 使用 flex-start 对齐 ⚡ 图标",
    "Tab3 Backlog 背景为 #f1f5f9",
    "Tab4 终端高度为 calc(100vh - 280px)",
    "Tab4 消息使用 border-left 区分用户/助理",
    "Tab4 输入框有 ChevronRight prefix",
    "所有 Text 组件有明确的 textAlign 或在 Flex 容器内"
  ]
}
```

---

## 8. SQA 检查清单 (kimi-k2.5)

```json
{
  "visual_checks": [
    "验证页面整体布局为左对齐",
    "验证 3 个状态卡片等高且间距相等",
    "验证 Evolution Logs 时间-动作-说明水平排列",
    "验证 Principles 列表图标与文本垂直对齐",
    "验证 Backlog 区域有正确的灰底背景",
    "验证 Tab4 终端高度正确",
    "验证消息列表每条消息独立且左对齐",
    "验证用户消息与助理消息样式区分明显",
    "验证输入框与消息列表间距适当",
    "验证整体颜色层次分明"
  ]
}
```

---

## 9. 已知问题 (由本次 audit 发现)

1. Evolution Logs 的 List.Item 缺少 textAlign: 'left'
2. Principles 列表的 ⚡ 图标未使用 flex-start
3. Tab4 终端容器可能需要显式 textAlign
4. 消息列表需要检查 border-left 样式一致性

---

## 10. 输出格式

QA 报告必须包含:
```json
{
  "decision": "PASS/FAIL",
  "issues": [
    {
      "location": "Tab1/EvolutionLogs",
      "problem": "描述",
      "suggestion": "修复建议"
    }
  ],
  "visual_score": "8/10",  // 视觉完整性评分
  "alignment_score": "9/10"  // 对齐评分
}
```