// Pexels 图片 API 封装 - 带成本控制
// 功能：按单词关键字搜索图片，返回第一张图片 URL

import { APIResponse } from './types';
import { ImageConfig } from '../config/imageConfig';

// 注释掉暂时不用的导入
// import { PexelsResponse } from './types';
// import { apiUsageController } from '../services/apiUsageControl';
// const PEXELS_API_URL = 'https://api.pexels.com/v1/search';

// 将Pexels图片转换为Base64，避免跨域问题
const getPexelsImageAsBase64 = async (word: string): Promise<string | null> => {
  const apiKey = import.meta.env.VITE_PEXELS_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ 缺少 Pexels API KEY');
    return null;
  }

  try {
    // 1. 调用Pexels API获取图片URL
    const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(word)}&per_page=1&orientation=landscape`, {
      headers: { Authorization: apiKey },
    });

    if (!response.ok) {
      console.error(`❌ Pexels API错误 (${response.status})`);
      return null;
    }

    const data = await response.json();
    const imageUrl = data.photos?.[0]?.src?.medium;
    
    if (!imageUrl) {
      console.warn(`⚠️ Pexels未找到图片: ${word}`);
      return null;
    }

    // 2. 获取图片并转换为Base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error(`❌ 图片下载失败: ${imageUrl}`);
      return null;
    }

    const blob = await imageResponse.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        console.log(`🎯 图片转换Base64成功: ${word}`);
        resolve(base64);
      };
      reader.onerror = () => {
        console.error(`❌ Base64转换失败: ${word}`);
        reject(new Error('Base64转换失败'));
      };
      reader.readAsDataURL(blob);
    });

  } catch (error) {
    console.error(`❌ 获取Pexels图片失败: ${word}`, error);
    return null;
  }
};

// 使用Canvas生成本地图片，避免跨域问题
const generateWordImage = (word: string): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  canvas.width = 300;
  canvas.height = 200;
  
  // 生成基于单词的颜色
  const colors = [
    '#E3F2FD', '#F3E5F5', '#E8F5E8', '#FFF3E0', '#FCE4EC', 
    '#E0F2F1', '#F1F8E9', '#FFF8E1', '#FFEBEE', '#E8EAF6'
  ];
  
  const colorIndex = word.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];
  
  // 绘制背景
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 300, 200);
  
  // 绘制单词
  ctx.fillStyle = '#424242';
  ctx.font = 'bold 24px "Comic Sans MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(word.toUpperCase(), 150, 100);
  
  // 绘制装饰边框
  ctx.strokeStyle = '#9E9E9E';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 300, 200);
  
  return canvas.toDataURL('image/png');
};

// const DEFAULT_IMAGE_URL = 'https://via.placeholder.com/400x300/f0f0f0/666666?text=No+Image';

/**
 * 根据单词搜索图片（带缓存和成本控制）
 * @param word 单词
 * @returns 首张图片的中等尺寸 URL
 */
export async function getImageForWord(word: string): Promise<APIResponse<string>> {
  // 根据配置决定图片源策略
  switch (ImageConfig.imageSource) {
    case 'local':
      // 仅使用本地Canvas图片
      console.log(`🎨 使用Canvas生成本地图片: ${word}`);
      return { success: true, data: generateWordImage(word) };
      
    case 'pexels-only':
      // 仅使用Pexels图片，失败时返回错误
      console.log(`📸 尝试获取Pexels图片 (仅Pexels模式): ${word}`);
      try {
        const base64Image = await getPexelsImageAsBase64(word);
        if (base64Image) {
          console.log(`✅ Pexels图片获取成功: ${word}`);
          return { success: true, data: base64Image };
        }
                 return { success: false, error: { error: true, message: `未找到Pexels图片: ${word}` } };
       } catch (error) {
         console.error(`❌ Pexels图片获取失败: ${word}`, error);
         return { success: false, error: { error: true, message: `Pexels图片获取失败: ${word}` } };
      }
      
    case 'pexels':
    default:
      // 混合模式：优先Pexels，失败时使用本地图片
      console.log(`📸 尝试获取Pexels图片 (混合模式): ${word}`);
      try {
        const base64Image = await getPexelsImageAsBase64(word);
        if (base64Image) {
          console.log(`✅ Pexels图片获取成功: ${word}`);
          return { success: true, data: base64Image };
        }
      } catch (error) {
        console.warn(`⚠️ Pexels图片获取失败: ${word}`, error);
      }
      
      // Fallback: 使用本地生成的图片
      console.log(`🎨 Fallback到Canvas生成本地图片: ${word}`);
      return { success: true, data: generateWordImage(word) };
  }

  // 注释掉外部API，避免跨域问题
  /*
  const apiKey = import.meta.env.VITE_PEXELS_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ 缺少 Pexels API KEY，使用默认图片');
    return { success: true, data: DEFAULT_IMAGE_URL };
  }

  // 生成缓存键
  const cacheKey = `pexels_image_${word.toLowerCase()}`;
  
  // 检查缓存
  const cachedImage = apiUsageController.getCachedPexels(cacheKey);
  if (cachedImage) {
    console.log(`🎯 Pexels缓存命中: ${word}`);
    return { success: true, data: cachedImage };
  }

  // 检查调用限制
  const canCall = apiUsageController.canCallPexels();
  if (!canCall.allowed) {
    console.warn(`🚫 Pexels调用被拒绝: ${canCall.reason}，使用默认图片`);
    return { success: true, data: DEFAULT_IMAGE_URL };
  }

  try {
    console.log(`📸 调用Pexels API: ${word}`);
    
    const res = await fetch(`${PEXELS_API_URL}?query=${encodeURIComponent(word)}&per_page=1&orientation=landscape`, {
      headers: { Authorization: apiKey },
    });

    // 记录API调用
    apiUsageController.recordPexelsCall();

    if (!res.ok) {
      console.error(`❌ Pexels API错误 (${res.status})`);
      return { success: true, data: DEFAULT_IMAGE_URL };
    }
    
    const data: PexelsResponse = await res.json();
    const url = data.photos?.[0]?.src?.medium;
    
    if (!url) {
      console.warn(`⚠️ Pexels未找到图片: ${word}，使用默认图片`);
      return { success: true, data: DEFAULT_IMAGE_URL };
    }

    // 缓存结果
    apiUsageController.setCachedPexels(cacheKey, url);
    console.log(`✅ Pexels调用成功并已缓存: ${word}`);
    
    return { success: true, data: url };
    
  } catch (error) {
    console.error(`❌ Pexels API调用失败:`, error);
    return { success: true, data: DEFAULT_IMAGE_URL };
  }
  */
}

/**
 * 批量获取图片（混合模式：优先Pexels，失败时使用本地生成）
 * @param words 单词数组
 * @returns 单词到图片URL的映射
 */
export async function getImagesForWords(words: string[]): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  
  console.log(`🖼️ 批量获取图片（混合模式）: ${words.length} 个单词`);

  // 并发控制：每次最多处理2个（避免Pexels API过载）
  const batchSize = 2;
  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize);
    const batchPromises = batch.map(async word => {
      const result = await getImageForWord(word);
      return { word, url: result.success ? result.data : generateWordImage(word) };
    });
    
    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(({ word, url }) => {
      results[word] = url;
    });
    
    // 批次间延迟，避免API频率限制
    if (i + batchSize < words.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`✅ 批量获取完成，共 ${Object.keys(results).length} 张图片`);
  return results;
}

// 获取API使用统计 - 暂时注释掉
/*
export function getPexelsUsageStats() {
  return apiUsageController.getUsageStats();
}
*/ 