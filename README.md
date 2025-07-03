# 🎯 英语单词卡片生成器

**🎉 MVP已完成！可直接使用！**

专为中国小学生设计的英语学习工具，基于Oxford Phonics v3.1拼读规则，提供智能单词拆分、音标显示、图片匹配和卡片生成功能。

> **项目状态**：✅ MVP功能100%完成（2024-12-26）  
> **核心功能**：输入单词 → AI智能补全 → 卡片预览 → A4图片导出 → 打印使用  
> **技术栈**：React 18 + TypeScript + html2canvas + OpenRouter API

---

## 🚀 快速演示

### 完整使用流程（3分钟上手）

1. **启动应用**：`npm run dev` → 访问 http://localhost:3000
2. **输入单词**：在文本框输入"flower"或上传CSV文件
3. **智能补全**：系统自动生成音标、释义、图片、拼读拆分
4. **预览卡片**：查看正反面卡片效果，实时调整
5. **A4预览**：点击"显示A4预览"，查看打印版面
6. **导出图片**：点击"下载当前页面"或"下载全部页面"
7. **打印使用**：解压ZIP文件，直接打印A4页面

### 样例输入输出

**输入**：`flower`  
**输出**：
- **音标**：/ˈflaʊər/
- **拼读**：fl-ow-er（基于Oxford Phonics v3.1）
- **释义**：n. 花，花朵
- **图片**：高清花朵图片（AI匹配）
- **例句**：The flower is beautiful. / 这朵花很美。

---

## ✨ 核心特性

### 🎨 智能拼读拆分
- **Oxford Phonics v3.1规则**：基于辅音组合起始块识别和Vowel Teams拆分优先级的专业拼读算法
- **起始组合保护**：el/em/en等在词首整体保留（如elephant→el-e-ph-ant）
- **Digraph独立性优先**：ph/gh/sh等必须单独成块，防止误断
- **30+测试用例验证**：覆盖各种拼读场景，确保教学准确性
- **彩色可视化**：拼读块用不同颜色显示，便于儿童理解音素结构

### 🖼️ AI智能配图
- **语义匹配**：基于单词含义自动生成相关图片
- **儿童友好**：清晰明亮的卡通风格，适合6-10岁儿童
- **教学辅助**：图文结合提升记忆效果和学习兴趣

### 📚 完整学习信息
- **标准音标**：提供准确的IPA国际音标
- **中文释义**：包含词性、含义和使用说明
- **双语例句**：英文例句配中文翻译，理解更深入
- **四线三格**：标准英文书写格式，培养正确书写习惯

### 🎨 专业排版设计
- **教学级标准**：符合小学英语教学规范
- **响应式布局**：支持桌面端和移动端访问
- **A4图片导出**：高质量PNG格式，支持A4纸2×2卡片布局

### 📱 导出功能
- **一键导出**：将卡片导出为高清A4图片包
- **多页支持**：自动分页，每页4张卡片（2×2布局）
- **双导出模式**：支持单页导出和全量导出
- **真实尺寸**：85×120mm标准卡片尺寸，适合打印裁剪

---

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装运行
```bash
# 克隆项目
git clone https://github.com/your-username/card-maker.git
cd card-maker

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 环境配置
创建 `.env` 文件：
```env
VITE_OPENROUTER_API_KEY=your_api_key_here
VITE_DEBUG_MODE=true
```

---

## 🎯 使用指南

### 单词输入
1. 在输入框中输入英文单词
2. 系统自动进行拼读拆分和音标标注
3. 生成配套图片和中文释义

### 卡片预览
- 实时预览卡片效果
- 支持拼读块颜色自定义
- 可调整字体大小和间距

### 批量处理
- 支持CSV文件批量导入
- 一次性处理多个单词
- 自动去重和错误处理

### 导出功能
- **A4图片包导出**：高清PNG格式，完美打印效果
- **双导出模式**：单页导出（快速）+ 全量导出（完整）
- **A4纸张2×2布局**：每张卡片85×120mm标准尺寸
- **ZIP打包下载**：自动打包所有页面，方便管理
- **实时进度显示**：导出过程可视化，用户体验友好

---

## 🧠 拼读算法详解

### Oxford Phonics v3.1核心原则

我们的拼读算法严格遵循Oxford Phonics教学标准，确保每个拼读块都对应明确的音素结构：

#### 🔹 辅音组合起始块识别（v3.1新增）
识别常见辅音组合（如fl, tr, bl, gr等），必须整体保留：
- `flower` → `fl-ow-er`（`fl`为起始组合）
- `blue` → `bl-ue`（`bl`为起始组合）
- `truck` → `tr-u-ck`（`tr`为起始组合）
- `green` → `gr-ee-n`（`gr`为起始组合）

#### 🔹 Vowel Teams拆分优先级提升（v3.1新增）
元音组合必须整体保留，**禁止拆分**：
- `flower` → `fl-ow-er`（`ow`为元音组合）
- `enjoy` → `en-joy`（`oy`为元音组合）
- `paint` → `p-ai-n-t`（`ai`为元音组合）
- `coin` → `c-oi-n`（`oi`为元音组合）

#### 🔹 闭音节优先划分（继承v3.0）
若单词中部结构为**短元音+辅音（VC）**，应优先作为自然拼读块保留：
- `apple` → `ap-ple`（`ap`为闭音节）
- `bottle` → `bot-tle`（`bot`为闭音节）
- `simple` → `sim-ple`（`sim`为闭音节）

#### 🔹 Final C+le匹配优先级提升（继承v3.0）
在识别`-ble`, `-ple`, `-tle`等结构时，**禁止插入双写辅音块或破坏前缀结构**：
- ❌ 错误：`apple` → `a-pp-le`
- ✅ 正确：`apple` → `ap-ple`

#### 🔹 起始组合保护（继承v2.7）
- `el`、`em`、`en`等在词首整体保留
- elephant原本错误拆分为e-lep-han-t
- 现在正确拆分为el-e-ph-ant

#### 🔹 Digraph独立性优先（继承v2.7）
- `ph`、`gh`、`sh`等必须单独成块
- 防止被其他规则夹断
- 确保音素映射的准确性

#### 🔹 不可拆组合保护
- **Digraphs**: ch, sh, th, ph, wh, ck, ng, gh, tch, dge
- **Vowel Teams**: ai, ay, ee, ea, oa, oo, ue, ew, ie, igh
- **R-controlled**: ar, er, ir, or, ur, air, are, ear
- **Magic-e**: a-e, i-e, o-e, u-e结构保持完整

### 拆分示例
```
flower   → fl-ow-er     (v3.1: 辅音组合fl + 元音组合ow)
blue     → bl-ue        (v3.1: 辅音组合bl + 元音组合ue)
elephant → el-e-ph-ant  (继承: 起始组合保护 + digraph独立性)
apple    → ap-ple       (继承: 闭音节+ple)
```

### 🎯 拼读示例

**v3.1核心示例：**
```
flower   → fl-ow-er    (辅音组合fl + 元音组合ow)
blue     → bl-ue       (辅音组合bl + 元音组合ue)  
truck    → tr-u-ck     (辅音组合tr + 单元音)
green    → gr-ee-n     (辅音组合gr + 元音组合ee)
enjoy    → en-joy      (起始en + 元音组合oy)
paint    → p-ai-n-t    (元音组合ai)
```

**继承v3.0示例：**
```
apple    → ap-ple      (闭音节+ple)
bottle   → bot-tle     (闭音节+tle)  
little   → lit-tle     (闭音节+tle)
simple   → sim-ple     (闭音节+ple)
```

**继承v2.7示例：**
```
elephant → el-e-ph-ant  (起始组合+digraph)
empty    → em-p-t-y     (起始组合保护)
phone    → ph-o-n-e     (digraph独立性)
```

**其他复杂结构：**
```
circle   → c-ir-c-le    (R-controlled + final stable)
running  → r-u-nn-ing   (双写辅音 + 后缀)
picture  → pic-ture     (前缀 + final stable)
```

---

## 🛠️ 技术架构

### 前端技术栈
- **React 18**: 现代化UI框架
- **TypeScript**: 类型安全的JavaScript
- **Vite**: 快速构建工具
- **Tailwind CSS**: 实用优先的CSS框架

### API集成
- **OpenRouter**: 多模型AI服务，支持成本优化
- **本地词典**: 内置800+常用词汇，支持离线使用
- **智能缓存**: 避免重复API调用，降低成本

### 核心模块
```
src/
├── components/             # React组件
│   ├── CardPreview.tsx     # 卡片预览
│   ├── InputSection.tsx    # 输入控制
│   ├── ExportSection.tsx   # 导出功能
│   ├── A4PageRenderer.tsx  # A4页面渲染
│   └── SingleCardRenderer.tsx # 单卡片渲染
├── utils/                  # 工具函数
│   └── dictionary.ts       # 拼读算法核心
├── api/                    # API接口
│   ├── openai.ts          # AI服务
│   ├── imageExport.ts     # 图片导出功能
│   └── image.ts           # 图片搜索
└── types/                 # 类型定义
```

### 部署配置

**环境要求**：
- Node.js 18+
- npm 9+
- 现代浏览器（支持html2canvas）

**生产部署**：
```bash
# 构建项目
npm run build

# 部署dist/目录到Web服务器
# 支持静态部署到：Vercel、Netlify、GitHub Pages等
```

**环境变量**：
```env
VITE_OPENROUTER_API_KEY=your_api_key_here
VITE_PEXELS_API_KEY=your_pexels_key_here
VITE_DEBUG_MODE=false
```

---

## 📚 教育价值

### 适用场景
- **课堂教学**: 教师制作拼读教学卡片
- **家庭辅导**: 家长协助孩子学习英语
- **自主学习**: 学生独立练习拼读技能
- **培训机构**: 专业英语教育机构使用

### 学习效果
- **拼读能力**: 通过视觉化拼读块理解音素结构
- **发音准确**: 基于IPA音标的标准发音指导
- **词汇记忆**: 图文结合增强记忆效果
- **书写规范**: 四线三格培养正确书写习惯

---

## 🔧 开发指南

### 项目结构
详见 `doc/03_项目目录结构说明.md`

### 拼读规则
详见 `doc/Oxford_Phonics_Split_Rules_v3.1.md`

### 调试模式
详见 `doc/调试模式配置说明.md`

### 问题排查
详见 `doc/05_开发问题记录与解决方案.md`

---

## 🔧 算法演进

详见 `doc/Oxford_Phonics_Split_Rules_v3.0.md`

### 🎯 版本历史
- **v3.1** (当前) - 辅音组合起始块识别 + Vowel Teams拆分优先级提升
- **v3.0** - 闭音节优先划分 + Final C+le匹配优化
- **v2.7** - 起始组合保护 + Digraph独立性优先
- **v2.6** - 音素映射对齐原则确立
- **v2.3** - 基础规则体系建立

---

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 贡献方式
1. Fork本项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

### 开发规范
- 遵循TypeScript类型安全
- 保持代码注释完整
- 添加相应的测试用例
- 更新相关文档

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## 🎯 项目愿景

让每个中国小学生都能享受到专业、有趣、有效的英语拼读学习体验，通过科学的Oxford Phonics v3.1算法和现代化的技术手段，为英语启蒙教育贡献力量。

**🌟 如果这个项目对你有帮助，请给我们一个星标！**