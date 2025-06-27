// API响应类型定义文件
// 这里定义了所有外部API的数据格式，确保类型安全

// OpenAI API 相关类型
export interface OpenAIWordData {
  word: string;           // 单词本身
  phonetic: string;       // 音标 (IPA格式)
  meaning: string;        // 中文释义（适合小学生）
  example: string;        // 英文例句
  exampleTranslation: string; // 例句中文翻译
}

// Pexels 图片API 相关类型
export interface PexelsPhoto {
  id: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;     // 原图链接
    large: string;        // 大图链接
    medium: string;       // 中图链接
    small: string;        // 小图链接
  };
}

export interface PexelsResponse {
  photos: PexelsPhoto[];
  total_results: number;
  page: number;
  per_page: number;
}

// 词典API 相关类型（备用方案）
export interface DictionaryEntry {
  word: string;
  phonetic?: string;     // 音标（可选）
  meanings: {
    partOfSpeech: string; // 词性
    definitions: {
      definition: string;  // 英文定义
    }[];
  }[];
}

// API错误响应类型
export interface APIError {
  error: boolean;
  message: string;
  code?: string;
}

// API通用响应包装器
export type APIResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: APIError;
};

// 音节拆分相关类型
export interface SyllableData {
  word: string;
  syllables: string[];   // 音节数组，如 ["cat"] 或 ["but", "ter", "fly"]
  colors: string[];      // 对应每个音节的颜色
} 