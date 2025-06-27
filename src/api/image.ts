// Pexels 图片 API 封装
// 功能：按单词关键字搜索图片，返回第一张图片 URL

import { APIResponse, PexelsResponse } from './types';

const PEXELS_API_URL = 'https://api.pexels.com/v1/search';

/**
 * 根据单词搜索图片
 * @param word 单词
 * @returns 首张图片的中等尺寸 URL
 */
export async function getImageForWord(word: string): Promise<APIResponse<string>> {
  const apiKey = import.meta.env.VITE_PEXELS_API_KEY;
  if (!apiKey) {
    return { success: false, error: { error: true, message: '缺少 Pexels API KEY' } };
  }

  try {
    const res = await fetch(`${PEXELS_API_URL}?query=${encodeURIComponent(word)}&per_page=1`, {
      headers: { Authorization: apiKey },
    });
    if (!res.ok) {
      return { success: false, error: { error: true, message: `HTTP ${res.status}`, code: 'HTTP_ERROR' } };
    }
    const data: PexelsResponse = await res.json();
    const url = data.photos?.[0]?.src?.medium;
    if (!url) {
      return { success: false, error: { error: true, message: '未找到图片' } };
    }
    return { success: true, data: url };
  } catch (error) {
    return { success: false, error: { error: true, message: String(error) } };
  }
} 