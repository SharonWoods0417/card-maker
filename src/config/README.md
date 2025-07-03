# 图片配置使用说明

## 🖼️ 图片源模式选择

在 `src/config/imageConfig.ts` 中，您可以通过修改 `imageSource` 来选择不同的图片源：

### 1. **本地Canvas模式** (`'local'`)
```typescript
imageSource: 'local'
```
- ✅ **速度最快** - 无网络请求延迟
- ✅ **无跨域问题** - 100%成功率
- ✅ **图片导出完美** - Base64格式，html2canvas完全支持
- 🎨 生成彩色背景+单词文字的简洁图片
- 💡 **推荐用于：** 快速测试、批量生成、确保稳定性

### 2. **混合模式** (`'pexels'`) - **当前默认**
```typescript
imageSource: 'pexels'
```
- 🌍 **优先使用Pexels真实图片** - 内容丰富，视觉效果好
- 🔄 **自动Fallback** - Pexels失败时自动使用本地Canvas图片
- 🛡️ **Base64转换** - 解决跨域问题，确保图片导出成功
- ⏱️ **适度延迟** - 每批请求间隔500ms，避免API限制
- 💡 **推荐用于：** 正式使用、追求视觉效果

### 3. **仅Pexels模式** (`'pexels-only'`)
```typescript
imageSource: 'pexels-only'
```
- 📸 **仅使用Pexels真实图片**
- ❌ **失败时报错** - 不会Fallback到本地图片
- 🔍 **适用于调试** - 明确知道哪些单词没有找到图片
- 💡 **推荐用于：** 测试Pexels API、质量控制

## ⚙️ Pexels API配置

### 设置API Key
在项目根目录的 `.env` 文件中添加：
```env
VITE_PEXELS_API_KEY=your_pexels_api_key_here
```

### 性能调优
在 `imageConfig.ts` 中可以调整：
```typescript
pexelsConfig: {
  requestDelay: 500,    // API调用间隔（毫秒）
  batchSize: 2,         // 并发请求数量
  timeout: 5000,        // 请求超时时间
}
```

## 🎨 本地Canvas图片定制

在 `imageConfig.ts` 中可以定制Canvas图片样式：
```typescript
canvasConfig: {
  width: 300,           // 图片宽度
  height: 200,          // 图片高度
  font: 'bold 24px "Comic Sans MS", sans-serif', // 字体样式
  colors: [             // 背景颜色主题
    '#E3F2FD', '#F3E5F5', '#E8F5E8', // 蓝、紫、绿
    '#FFF3E0', '#FCE4EC', '#E0F2F1', // 橙、粉、青
    // ... 更多颜色
  ]
}
```

## 🔧 快速切换示例

### 场景1：快速测试 → 使用本地模式
```typescript
// src/config/imageConfig.ts
export const ImageConfig = {
  imageSource: 'local',  // 改为本地模式
  // ... 其他配置
};
```

### 场景2：正式发布 → 使用混合模式
```typescript
// src/config/imageConfig.ts
export const ImageConfig = {
  imageSource: 'pexels', // 混合模式（默认）
  // ... 其他配置
};
```

### 场景3：调试Pexels → 仅Pexels模式
```typescript
// src/config/imageConfig.ts
export const ImageConfig = {
  imageSource: 'pexels-only', // 仅Pexels，方便排查问题
  // ... 其他配置
};
```

## 📊 实际使用建议

1. **开发阶段** - 使用 `'local'` 模式，快速调试功能
2. **测试阶段** - 使用 `'pexels'` 模式，验证真实图片效果
3. **生产环境** - 根据需求选择：
   - 重视稳定性 → `'local'` 模式
   - 重视视觉效果 → `'pexels'` 模式
   - 网络条件差 → `'local'` 模式

## 🐛 故障排除

### Pexels图片不显示
1. 检查API Key是否正确设置
2. 检查网络连接是否正常
3. 查看浏览器控制台是否有错误信息
4. 临时切换到 `'local'` 模式确认其他功能正常

### 图片导出空白
- 现在不会出现此问题，因为所有图片都转换为Base64格式 