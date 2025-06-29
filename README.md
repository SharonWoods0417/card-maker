# 🎯 英语单词卡片生成器

专为中国小学生设计的英语学习工具，基于Oxford Phonics v2.7拼读规则，提供智能单词拆分、音标显示、图片匹配和卡片生成功能。

---

## ✨ 核心特性

### 🎨 智能拼读拆分
- **Oxford Phonics v2.7规则**：基于音素映射对齐原则的专业拼读算法
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
- **PDF导出**：高质量打印，支持A4纸2×2卡片布局

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
- PDF格式导出，适合打印
- A4纸张2×2布局，每张卡片85×135mm
- 高清图片和清晰字体

---

## 🧠 拼读算法详解

### Oxford Phonics v2.7核心原则

#### 🔹 音素映射对齐
每个拼读块对应一个或一组连续音素，确保拆分结果与实际发音一致。

#### 🔹 起始组合保护（v2.7新增）
- `el`、`em`、`en`在词首时整体保留
- 解决了elephant误拆为e-lep-han-t的问题
- 现在正确拆分为el-e-ph-ant

#### 🔹 Digraph独立性优先（v2.7新增）
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
elephant → el-e-ph-ant  (起始组合保护 + digraph独立性)
empty    → em-p-t-y     (起始组合保护)
phone    → ph-o-n-e     (digraph独立性 + magic-e)
circle   → c-ir-c-le    (R-controlled + final stable)
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
├── components/          # React组件
│   ├── CardPreview.tsx  # 卡片预览
│   ├── InputSection.tsx # 输入控制
│   └── ExportSection.tsx # 导出功能
├── utils/               # 工具函数
│   └── dictionary.ts    # 拼读算法核心
├── api/                 # API接口
│   ├── openai.ts       # AI服务
│   └── dictionary.ts   # 词典服务
└── types/              # 类型定义
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
详见 `doc/Oxford_Phonics_Split_Rules_v2.7.md`

### 调试模式
详见 `doc/调试模式配置说明.md`

### 问题排查
详见 `doc/05_开发问题记录与解决方案.md`

---

## 📈 版本历程

- **v2.7** (当前) - 起始组合保护 + Digraph独立性优先
- **v2.6** - 音素映射对齐 + 不可拆组合保护  
- **v2.3** - 基础拼读规则实现
- **v1.0** - MVP功能上线

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

让每个中国小学生都能享受到专业、有趣、有效的英语拼读学习体验，通过科学的Oxford Phonics v2.7算法和现代化的技术手段，为英语启蒙教育贡献力量。

**🌟 如果这个项目对你有帮助，请给我们一个星标！**