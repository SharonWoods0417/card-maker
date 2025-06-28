// Pexels 图片 API 封装 - 带成本控制
// 功能：按单词关键字搜索图片，返回第一张图片 URL

import { APIResponse, PexelsResponse } from './types';
import { apiUsageController } from '../services/apiUsageControl';

const PEXELS_API_URL = 'https://api.pexels.com/v1/search';
const DEFAULT_IMAGE_URL = 'https://via.placeholder.com/400x300/f0f0f0/666666?text=No+Image';

/**
 * 根据单词搜索图片（带缓存和成本控制）
 * @param word 单词
 * @returns 首张图片的中等尺寸 URL
 */
export async function getImageForWord(word: string): Promise<APIResponse<string>> {
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
}

/**
 * 批量获取图片（带成本控制）
 * @param words 单词数组
 * @returns 单词到图片URL的映射
 */
export async function getImagesForWords(words: string[]): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  
  // 检查总体限制
  const stats = apiUsageController.getUsageStats();
  const remainingCalls = Math.min(stats.dailyPexelsRemaining, stats.monthlyPexelsRemaining);
  
  if (words.length > remainingCalls) {
    console.warn(`⚠️ 批量图片请求数量(${words.length})超过剩余配额(${remainingCalls})`);
  }

  // 并发控制：每次最多处理3个
  const batchSize = 3;
  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize);
    const batchPromises = batch.map(async word => {
      const result = await getImageForWord(word);
      return { word, url: result.success ? result.data : DEFAULT_IMAGE_URL };
    });
    
    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(({ word, url }) => {
      results[word] = url;
    });
    
    // 批次间延迟，避免过于频繁的API调用
    if (i + batchSize < words.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
}

// 获取API使用统计
export function getPexelsUsageStats() {
  return apiUsageController.getUsageStats();
} 