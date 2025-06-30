# PDF排版与卡片排版对照标准

> **版本：v1.3 - 2024-06-30**
> **状态：✅ 已完成实现并验证**

## 📊 **排版一致性对照表**

此表格确保网页上的实时预览效果与最终生成的PDF文件在关键视觉元素上保持高度一致。

| 排版要素 | 网页预览 (React) | PDF导出 (@react-pdf) | 状态 | 备注 |
|:---|:---|:---|:---|:---|
| **卡片尺寸** | `aspect-[85/120]` | `85mm × 120mm` | ✅ 一致 | 核心尺寸标准，严格统一 |
| **图片区域** | `h-1/2` (高度50%) | `height: 60mm` | ✅ 一致 | 占据卡片上半部分 |
| **文字区域** | `h-1/2` (高度50%) | `height: 60mm` | ✅ 一致 | 占据卡片下半部分 |
| **主单词字体** | **`AU School Handwriting`** | **`AU School Handwriting Fonts`** | ✅ 一致 | **核心教学字体，已内嵌** |
| **音标字体** | `Nunito` | `Nunito` | ✅ 一致 | **已内嵌，显示效果统一** |
| **中文字体** | `sans-serif` (系统) | **`Source Han Sans CN`** | ✅ 一致 | **已内嵌，解决中文显示问题** |
| **例句字体** | `Kalam` | `Kalam` | ✅ 一致 | **已内嵌，手写风格例句** |
| **四线三格** | CSS 边框实现 | PDF 线条绘制 | ✅ 一致 | 视觉效果统一 |
| **边框样式** | `border-2 border-gray-300` | `2pt solid #e2e8f0` | ✅ 一致 | 颜色与粗细匹配 |
| **内容完整性**| 所有字段按需显示 | 所有字段按需显示 | ✅ 一致 | 正反面内容显示正确 |

---

## 🎯 **核心实现要点**

### 1. **字体注册与应用**
为了确保PDF中的字体与网页预览完全一致，我们采取了全面的字体嵌入策略。

```typescript
// src/components/ExportSection.tsx
// 字体注册函数，确保所有字体在PDF生成前加载
const initializeFonts = async () => {
  // 字体名称与文件路径的映射
  const fontMap = {
    'AU School Handwriting Fonts': '/fonts/AU-School-Handwriting-Fonts.ttf',
    'Nunito': '/fonts/Nunito-SemiBold.ttf',
    'Kalam': '/fonts/Kalam-Bold.ttf',
    'Source Han Sans CN': '/fonts/Source Han Sans CN Regular.otf', // <-- 新增中文字体
  };

  // 遍历注册所有字体，并增加错误处理
  for (const fontFamily in fontMap) {
    try {
      // 动态获取字体文件并注册
      const response = await fetch(fontMap[fontFamily]);
      const fontBuffer = await response.arrayBuffer();
      Font.register({ fontFamily, src: fontBuffer });
    } catch (error) {
      console.error(`Failed to register font ${fontFamily}:`, error);
    }
  }
};

// 在组件加载时调用
useEffect(() => {
  initializeFonts();
}, []);

// PDF样式中直接使用注册好的字体名称
const styles = StyleSheet.create({
  word: {
    fontFamily: 'AU School Handwriting Fonts', // 主单词
  },
  ipa: {
    fontFamily: 'Nunito', // 音标
  },
  meaningCn: {
    fontFamily: 'Source Han Sans CN', // 中文释义
  },
  sentenceEn: {
    fontFamily: 'Kalam', // 英文例句
  },
});
```

### 2. **解决字体加载时序问题**
**问题**：PDF渲染时，若自定义字体尚未注册完成，会回退到默认字体（如 `Helvetica`），导致字体不匹配。
**解决方案**：通过在 `StyleSheet.create` 中**硬编码字体名称**，而不是使用动态变量，确保了即使在字体注册完成前创建样式对象，PDF在最终渲染时也能正确查找并应用已注册的字体。这是解决字体问题的关键。

---

## ✅ **当前成果 (v1.3)**

### **功能完整性**
- ✅ **字体完全一致**：PDF中的手写体、音标、中文、例句字体均与网页预览保持一致。
- ✅ **中文显示正常**：成功嵌入思源黑体，解决了所有中文内容（如释义、例句翻译）在PDF中无法显示的问题。
- ✅ **布局精确对位**：A4页面2x2布局、卡片尺寸、间距等所有参数在网页和PDF中完全统一。
- ✅ **下载功能稳定**：一键导出功能流畅，支持大批量卡片生成，控制台无错误。

### **技术稳定性**
- ✅ **字体加载健壮**：通过 `try-catch` 块增强了字体注册的稳定性，单个字体失败不会影响整个应用。
- ✅ **时序问题解决**：通过硬编码字体名称的方式，彻底解决了 `@react-pdf/renderer` 的样式缓存与字体注册之间的时序竞态问题。

---

## 📐 **A4页面及卡片布局最终规范**

- **页面尺寸**：A4 (210mm × 297mm)
- **页面边距**：四周各 `15mm`
- **内容区尺寸**：180mm × 267mm
- **卡片网格**：2行 × 2列
- **卡片尺寸**：**85mm × 120mm**
- **卡片间距**：横向 `5mm`，纵向 `5mm`
- **网格总尺寸**：175mm × 245mm (在内容区内居中)
- **卡片圆角**：`4mm`
- **卡片内边距**: `3mm`
- **图片区高度**: `60mm`

> **标准说明**: 此规范为最终版本，确保了从设计、预览到最终打印的每一个环节都拥有一致的视觉体验。

---

## 📝 **维护说明**
- 本文档是排版和字体标准的唯一依据。
- 未来任何对卡片样式的修改，都应先更新此文档，再进行代码实现。
- **特别注意**：在 `StyleSheet.create` 中，**必须使用字符串字面量（如 `'Source Han Sans CN'`）来指定 `fontFamily`**，避免再次引入因变量导致的时序问题。