# 英语单词卡片生成器

一个专为中国小学生设计的英语单词卡片生成工具，支持生成可打印的双面单词卡片。

## 功能特点

- 🎨 **专业设计**：四线三格手写体显示，符合教学标准
- 📱 **响应式布局**：支持桌面和移动设备
- 🎯 **智能输入**：支持CSV文件上传和手动输入
- 🖼️ **自动配图**：集成Pexels高质量图片
- 🔤 **音标标注**：自动生成IPA音标
- 🌈 **拼读色块**：彩色音节分割，20%透明度设计
- 📄 **PDF导出**：A4格式，2×2网格布局
- 🎭 **双面预览**：正反面实时切换预览

## 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite
- **样式框架**：Tailwind CSS
- **图标库**：Lucide React
- **字体**：Kalam (手写体) + Nunito (现代字体)

## 项目结构

```
src/
├── components/          # React组件
│   ├── Header.tsx      # 页面头部
│   ├── InputSection.tsx # 输入区域
│   ├── CardPreview.tsx # 卡片预览
│   └── ExportSection.tsx # 导出功能
├── types/              # TypeScript类型定义
│   └── index.ts
├── utils/              # 工具函数
│   └── sampleData.ts   # 示例数据
├── App.tsx             # 主应用组件
├── main.tsx            # 应用入口
└── index.css           # 全局样式
```

## 安装和运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 卡片设计规范

### 正面设计
- **图片区域**：占卡片高度50%
- **四线三格**：85%宽度，Kalam字体，专业虚线格式
- **音标显示**：蓝色标注，Nunito字体
- **拼读色块**：20%透明度，多彩色块设计

### 背面设计
- **中文释义**：1.5rem字号，包含词性标注
- **例句容器**：统一灰色背景，左对齐
- **序号标注**：1. 2. 3. 自动编号
- **边距设计**：左右10px，上下20px

## 开发说明

### 调试模式
项目内置调试模式，可以显示各个容器的边框和调试信息：
- 红色边框：整个卡片容器
- 绿色边框：图片容器
- 蓝色边框：文字区域容器
- 紫色边框：四线三格容器

### 字体规范
- **专有名词**：首字母大写 (Monday, China, English等)
- **普通单词**：全小写显示
- **四线三格**：使用Kalam手写体字体

### 响应式设计
- **桌面端**：完整功能，最佳体验
- **移动端**：自适应布局，优化触控操作

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发送邮件

---

**注意**：本项目专为教育用途设计，图片资源来自Pexels免费图库。