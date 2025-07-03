// 图片配置文件
export const ImageConfig = {
  // 图片源模式配置
  // 'local' - 仅使用Canvas生成的本地图片（速度快，无跨域问题）
  // 'pexels' - 优先使用Pexels真实图片，失败时fallback到本地图片
  // 'pexels-only' - 仅使用Pexels图片，失败时显示错误
  imageSource: 'pexels' as 'local' | 'pexels' | 'pexels-only',
  
  // Pexels API配置
  pexelsConfig: {
    // API调用间隔（毫秒）- 避免频率限制
    requestDelay: 500,
    // 并发请求数量
    batchSize: 2,
    // 请求超时时间（毫秒）
    timeout: 5000,
  },
  
  // 本地Canvas图片配置
  canvasConfig: {
    width: 300,
    height: 200,
    // 字体设置
    font: 'bold 24px "Comic Sans MS", sans-serif',
    // 颜色主题
    colors: [
      '#E3F2FD', '#F3E5F5', '#E8F5E8', '#FFF3E0', '#FCE4EC', 
      '#E0F2F1', '#F1F8E9', '#FFF8E1', '#FFEBEE', '#E8EAF6'
    ]
  }
}; 