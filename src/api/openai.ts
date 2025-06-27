// OpenAI API 封装服务
import { OpenAIWordData, APIResponse } from './types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function getWordDataFromOpenAI(word: string): Promise<APIResponse<OpenAIWordData>> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    return { success: false, error: { error: true, message: '缺少 OpenAI API 密钥' } };
  }

  const prompt = `请为英文单词"${word}"生成以下JSON格式数据：{
    "word": "${word}",
    "phonetic": "/xxx/",
    "meaning": "中文释义",
    "example": "英文例句",
    "exampleTranslation": "中文翻译"
  }`;
  try {
    const res = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: 'gpt-3.5-turbo', messages: [{ role: 'user', content: prompt }], temperature: 0.3 }),
    });
    if (!res.ok) return { success: false, error: { error: true, message: `HTTP ${res.status}` } };
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return { success: false, error: { error: true, message: '无内容' } };
    const parsed: OpenAIWordData = JSON.parse(content);
    return { success: true, data: parsed };
  } catch (error) {
    return { success: false, error: { error: true, message: String(error) } };
  }
} 