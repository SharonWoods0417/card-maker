# 英语单词卡片生成器 MVP 需求文档

> **版本 v1.9 — 2024-12-26（面向开发）**  
> **🎯 MVP完成度：90% | 最后一步：PDF导出真实实现**

## 🚀 **当前项目状态（重要）**

### **✅ 已完成的核心功能（90%）**
- **用户输入系统**：手动输入 + CSV上传 ✅ 100%完成
- **智能补全系统**：本地词典 + AI补全 + Oxford Phonics拼读 ✅ 100%完成  
- **卡片预览系统**：正反面预览 + 分页浏览 + 调试模式 ✅ 100%完成
- **API控制系统**：成本控制 + 缓存机制 + 实时监控 ✅ 100%完成

### **❌ 待完成的关键功能（10%）**
- **PDF导出系统**：当前仅有模拟实现，无法生成真实PDF ❌ 0%完成

### **🎯 下一步行动**
1. **立即开始**：实现React-PDF真实导出功能
2. **预计时间**：1小时完成MVP最后一步
3. **完成标准**：用户能下载真实可打印的PDF文件
4. **技术方案**：使用`@react-pdf/renderer`替换当前模拟代码

---

## 1 项目背景与目标

面向中国少儿英语学习者，提供"一键生成＋打印"单词卡片的网页工具，降低家长与老师制作高质量教具的门槛。

- **目标用户**：中国小学阶段英语学习者的家长和老师。
- **核心痛点**：卡片制作繁琐、图文不统一、排版不规范。
- **使用场景**：快速生成打印 A4 单词卡片用于学习复习。

---

## 2 项目角色说明与对接建议

### Bolt（前端 UI 设计）

负责生成用户操作界面及视觉原型，不需实现功能逻辑。

#### Bolt 前期沟通重点：

- 页面结构简洁，突出 3 个核心步骤：上传单词 → 预览卡片 → 导出 PDF。
- 支持两种输入方式：上传 CSV 文件、手动输入单词。
- 卡片需明确展示正反面内容：
  - **正面字段**：图片、单词（四线三格字体）、音标、自然拼读（彩色分块）
  - **反面字段**：中文释义、英文例句、中文翻译
- 预览区：设计 2×2 卡片网格，点击支持"正反面切换"，支持分页
- 提供"生成示例数据"按钮，便于开发测试
- 下载 PDF 按钮置于底部，提示"先添加数据后导出"
- **调试模式**（如边框或 ID 高亮）在开发阶段保留，正式上线前移除

### Cursor（功能逻辑开发）

负责将 Bolt 页面与核心逻辑联通：

- CSV 解析与字段校验
- 字典构建与查询（本地词库）
- AI 补全（OpenRouter 多模型支持 / 词典 API）✅ 已完成
- 图片接入（Pexels API）✅ 已完成
- 自然拼读处理（音节拆分并颜色标记）
- 卡片数据状态管理
- PDF 生成（默认使用 react-pdf）

#### 与 Cursor 对接重点：

- 页面状态管理（数据输入 → 卡片渲染 → 下载 PDF）
- 网页组件与 PDF 组件共享数据结构，分离渲染逻辑
- **字段填充逻辑统一：先查本地词典，缺失字段再使用 AI 补全** ✅ 已实现
- **AI 补全结果可写入用户词典文件（custom）供后续使用** ✅ 已实现
- **OpenRouter 多模型支持：可选择 GPT、Claude、Gemini 等模型** 🆕 已实现
- **成本控制系统：API使用监控、缓存机制、费用统计** 🆕 已实现
- 本地词典可逐步扩展为完整学习资源库

---

## 3 字典系统设计说明（新增）

### 总体策略

1. 使用一批单词，通过 API（OpenRouter）批量生成音标、释义、例句等字段；
2. 保存为本地 JSON 文件，构成本地离线词典库；
3. 系统运行时优先查本地词典库，缺失字段才调用 API 补齐；
4. 补全后的字段可保存到自定义词典文件，长期复用。

### 本地词典结构建议

- `/public/dictionary.base.json`：系统初始化生成的词典
- `/public/dictionary.custom.json`：用户新增词条、补全字段

### 字典字段示例结构

```json
{
  "apple": {
    "ipa": "/ˈæpəl/",
    "meaningCn": "苹果",
    "sentenceEn": "I eat an apple every day.",
    "sentenceCn": "我每天吃一个苹果。",
    "phonics": ["ap", "ple"]
  }
}
```

### 查询逻辑

```ts
async function getWordEntry(word: string): Promise<WordEntry> {
  const localEntry = await findInLocalDictionary(word);
  if (localEntry) return localEntry;

  const aiEntry = await fetchFromOpenRouter(word);
  if (aiEntry) saveToCustomDictionary(aiEntry);
  return aiEntry;
}
```

### 补全后保存建议

- 用户新增或 AI 生成的词条存入 `custom.json`，可通过按钮"保存为我的词典"触发
- 后期可支持打包导出词典、上传合并词典等扩展操作

---

## 4 功能需求与设计

### 数据输入

- 上传 CSV 文件或手动录入：字段包括 `word, ipa, meaningCn, sentenceEn, sentenceCn, imageUrl`
- `word` 为必填，其他字段缺失时自动补全（优先本地词典，再调用 OpenRouter）
- 提供"生成示例数据"功能便于测试与展示

### 卡片字段说明

- **正面字段**：
  - `imageUrl`: 单词配图（Pexels API）
  - `word`: 使用专用四线三格英文字体（默认使用 AU School Handwriting Fonts）
  - `ipa`: 国际音标
  - `phonics`: 自然拼读（数组结构 `string[]`，彩色分块）
- **反面字段**：
  - `meaningCn`: 中文释义
  - `sentenceEn`: 英文例句
  - `sentenceCn`: 中文翻译

### 卡片展示

- 每张卡片尺寸：85 × 135 mm，A4 纸 2×2 排布
- 网页支持分页浏览，预览正反面切换
- 设计风格为白底、圆角、纸质感卡片
- 支持调试视图（高亮边框、字段标签等）
- 拼读色块配色建议：使用 6–8 种浅色背景（如 `#F4A`, `#9CF`, `#AFA`），透明度 20%，保持色块区分性

### PDF 导出

- 使用 `react-pdf` 实现，尽可能复用网页组件样式
- 每页最多 4 张卡片，支持分页（最多 40 张卡片）
- 使用嵌入字体（AU School Handwriting 英文字体 + 思源宋体或等效中文字体）
  - 网页可使用 CDN 引用，PDF 必须通过 `Font.register()` 本地加载字体文件
- 禁止使用 canvas 转图方式，保持 PDF 文本可选性
- 若排版或样式无法满足需求，可封装切换至 `pdf-lib` 的能力

---

## 5 技术实现建议

### 技术架构

- **保留 Vite + React 架构**，支持快速开发与测试
- API 请求通过本地 Node 脚本或 Serverless Functions 代理封装
- 后期若迁移 Next.js，可保留前端结构，仅替换代理 API 结构
- 推荐代理函数部署方式：
  - 本地开发：`vite-plugin-mock` 或 Node 脚本（本地 `src/api/*.ts`）
  - 正式部署：Vercel/Netlify Functions 方式

### 数据模型

```ts
export interface WordEntry {
  id: string;
  word: string;
  ipa?: string;
  meaningCn: string;
  sentenceEn?: string;
  sentenceCn?: string;
  phonics?: string[];
  imageUrl?: string;
}
```

### API 接口说明 ✅ 已实现

| 方法   | 路径/服务                    | 描述               | 状态 |
| ---- | ------------------------- | ---------------- | ---- |
| OpenRouter | `src/api/openai.ts`      | AI补全（多模型支持）    | ✅ 已完成 |
| Pexels | `src/api/image.ts`        | 获取单词图片 URL       | ✅ 已完成 |
| 词典API | `src/api/dictionary.ts`   | 词典查询备用方案        | ✅ 已完成 |
| 本地词典 | `src/services/dictionary.ts` | 本地词典管理服务    | ✅ 已完成 |
| 成本控制 | `src/services/apiUsageControl.ts` | API使用监控和控制 | ✅ 已完成 |

### 自然拼读策略说明

- 优先使用现成库（如 `nlp-syllables`）进行音节拆分；
- 若效果不佳，再切换为规则引擎（VCV/VCCV）或小词典；
- 若拆分失败或词无法识别，则不展示拼读色块；
- 接口抽象为 `getSyllables(word: string): string[]`。

### 图片处理策略

- MVP 阶段直接使用 Pexels API 返回的临时图片 URL 展示；
- 后续若生成 Anki 卡片等用途，可扩展为支持转存图片（base64 / CDN 缓存）；
- 推荐设计参数：如 `/api/image?word=apple&persist=true` 用于启用图片持久缓存逻辑。

### API 成本控制系统 ✅ 已完成

- ✅ **智能缓存机制**：24小时有效期，最多1000条记录，避免重复API调用
- ✅ **使用限制控制**：每日限制200次OpenRouter调用，月度限制3000次
- ✅ **预算监控**：月度预算$20限制，实时费用统计
- ✅ **可视化监控**：实时API使用统计界面，5秒更新频率
- ✅ **调试控制**：开发模式下可手动清空缓存和重置统计
- ✅ **多模型支持**：OpenRouter集成，支持GPT、Claude、Gemini等模型
- ✅ **成本优化**：OpenRouter通常比直接调用OpenAI便宜20-30%

---

## 6 非功能性要求

- PDF 生成性能：50 词 ≤10秒
- 字体：使用已授权 AU School 四线三格英文字体、思源宋体等嵌入字体
- 浏览器兼容性：Chrome、Edge、Safari 最新版
- 移动端适配非必须，优先支持桌面端完整流程

---

## 7 项目排期（建议）

| 日期    | 任务                   |
| ----- | -------------------- |
| 07-05 | 完成 CSV 解析与表格编辑 UI    |
| 07-12 | 实现本地词典与 AI 补全功能      |
| 07-19 | 对齐卡片样式并实现网页 + PDF 组件 |
| 07-26 | 完成 PDF 导出功能          |
| 07-31 | Bug 修复与上线测试          |

---

> 本文档为 Bolt 与 Cursor 的开发协作基础文档，后续版本将根据进展与测试反馈继续迭代。

