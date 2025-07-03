// OpenRouter API 封装服务 - 带成本控制
// 支持多种AI模型：OpenAI GPT、Anthropic Claude、Google Gemini等
import { OpenAIWordData, APIResponse } from './types';
import { apiUsageController } from '../services/apiUsageControl';

// OpenRouter API配置
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-4.1-mini'; // 默认模型

// 获取配置
function getOpenRouterConfig() {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const model = import.meta.env.VITE_OPENROUTER_MODEL || DEFAULT_MODEL;
  
  return { apiKey, model };
}

export async function getWordDataFromOpenAI(word: string): Promise<APIResponse<OpenAIWordData>> {
  const { apiKey, model } = getOpenRouterConfig();
  
  if (!apiKey) {
    return { 
      success: false, 
      error: { 
        error: true, 
        message: '缺少 OpenRouter API 密钥。请在 .env.local 中设置 VITE_OPENROUTER_API_KEY' 
      } 
    };
  }

  // 生成缓存键（包含模型信息）
  const cacheKey = `openrouter_${model}_${word.toLowerCase()}`;
  
  // 检查缓存
  const cachedData = apiUsageController.getCachedOpenAI<OpenAIWordData>(cacheKey);
  if (cachedData) {
    console.log(`🎯 OpenRouter缓存命中: ${word} (${model})`);
    return { success: true, data: cachedData };
  }

  // 检查调用限制
  const canCall = apiUsageController.canCallOpenAI();
  if (!canCall.allowed) {
    console.warn(`🚫 OpenRouter调用被拒绝: ${canCall.reason}`);
    return { 
      success: false, 
      error: { 
        error: true, 
        message: `API调用已达限制: ${canCall.reason}`,
        code: 'QUOTA_EXCEEDED'
      } 
    };
  }

  const prompt = `请为英文单词"${word}"生成以下JSON格式数据，适合小学生学习：{
    "word": "${word}",
    "phonetic": "/xxx/",
    "meaning": "中文释义（简单易懂）",
    "example": "英文例句（小学水平）",
    "exampleTranslation": "中文翻译"
  }`;

  try {
    console.log(`🤖 调用OpenRouter API: ${word} (模型: ${model})`);
    
    const res = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin, // OpenRouter要求
        'X-Title': 'English Word Card Generator', // 应用名称
      },
      body: JSON.stringify({ 
        model: model,
        messages: [{ role: 'user', content: prompt }], 
        temperature: 0.3,
        max_tokens: 300, // 限制token使用量
        // OpenRouter特定参数
        route: 'fallback', // 启用模型降级
      }),
    });

    // 记录API调用
    apiUsageController.recordOpenAICall();

    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage = `HTTP ${res.status}: ${errorText}`;
      
      // 处理OpenRouter特定错误
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch {
        // 保持原始错误文本
      }
      
      console.error(`❌ OpenRouter API错误 (${res.status}):`, errorText);
      return { 
        success: false, 
        error: { 
          error: true, 
          message: errorMessage,
          code: 'HTTP_ERROR'
        } 
      };
    }

    const data = await res.json();
    let content = data.choices?.[0]?.message?.content?.trim();
    
    if (!content) {
      return { 
        success: false, 
        error: { 
          error: true, 
          message: '无内容返回，可能是模型响应异常' 
        } 
      };
    }

    // 增加对Markdown代码块的兼容处理
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = content.match(jsonRegex);
    if (match && match[1]) {
      content = match[1];
      console.log('🧹 已清理Markdown代码块，提取出JSON内容。');
    }

    let parsed: OpenAIWordData;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error(`❌ JSON解析失败:`, content);
      return { 
        success: false, 
        error: { 
          error: true, 
          message: `响应格式错误，无法解析JSON: ${String(parseError)}。原始响应: ${content}`,
          code: 'PARSE_ERROR'
        } 
      };
    }
    
    // 缓存结果
    apiUsageController.setCachedOpenAI(cacheKey, parsed);
    console.log(`✅ OpenRouter调用成功并已缓存: ${word} (${model})`);
    
    return { success: true, data: parsed };
    
  } catch (error) {
    console.error(`❌ OpenRouter API调用失败:`, error);
    return { 
      success: false, 
      error: { 
        error: true, 
        message: `调用失败: ${String(error)}`,
        code: 'NETWORK_ERROR'
      } 
    };
  }
}

// 批量处理多个单词（带成本控制）
export async function getWordDataBatch(words: string[]): Promise<Record<string, APIResponse<OpenAIWordData>>> {
  const results: Record<string, APIResponse<OpenAIWordData>> = {};
  
  // 检查总体限制
  const stats = apiUsageController.getUsageStats();
  const remainingCalls = Math.min(stats.dailyOpenAIRemaining, stats.monthlyOpenAIRemaining);
  
  if (words.length > remainingCalls) {
    console.warn(`⚠️ 批量请求数量(${words.length})超过剩余配额(${remainingCalls})`);
    // 只处理允许的数量
    words = words.slice(0, remainingCalls);
  }

  // 并发控制：每次最多处理3个（OpenRouter建议更保守）
  const batchSize = 3;
  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize);
    const batchPromises = batch.map(word => 
      getWordDataFromOpenAI(word).then(result => ({ word, result }))
    );
    
    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(({ word, result }) => {
      results[word] = result;
    });
    
    // 批次间延迟，避免过于频繁的API调用
    if (i + batchSize < words.length) {
      await new Promise(resolve => setTimeout(resolve, 1500)); // 增加延迟
    }
  }
  
  return results;
}

// 获取当前使用的模型信息
export function getCurrentModel(): string {
  const { model } = getOpenRouterConfig();
  return model;
}

// 获取API使用统计
export function getOpenAIUsageStats() {
  return apiUsageController.getUsageStats();
}

// 检查API配置是否正确
export function checkOpenRouterConfig(): { valid: boolean; message: string } {
  const { apiKey, model } = getOpenRouterConfig();
  
  if (!apiKey) {
    return {
      valid: false,
      message: '缺少OpenRouter API密钥，请在.env.local中设置VITE_OPENROUTER_API_KEY'
    };
  }
  
  return {
    valid: true,
    message: `配置正常，使用模型: ${model}`
  };
} 