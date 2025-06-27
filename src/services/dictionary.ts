// 字典查询服务
// 功能：
// 1. 先查本地 base.json / custom.json
// 2. 缺失时调用 OpenAI API 补全
// 3. 将 AI 结果暂存到 localStorage（模拟 custom.json）
// 4. 导出 getWordEntry / getBatchEntries 等函数

import { Dictionary, DictionaryEntry } from '../types';
import { getWordDataFromOpenAI } from '../api/openai';

const BASE_DICT_URL = '/dictionaries/base.json';
const CUSTOM_DICT_URL = '/dictionaries/custom.json';
const LOCAL_STORAGE_KEY = 'customDictionary';

let baseDictionary: Dictionary = {};
let customDictionary: Dictionary = {};

/**
 * 加载 base.json
 */
async function loadBaseDictionary(): Promise<Dictionary> {
  if (Object.keys(baseDictionary).length) return baseDictionary;
  try {
    const res = await fetch(BASE_DICT_URL);
    if (res.ok) {
      baseDictionary = await res.json();
    } else {
      baseDictionary = {};
    }
  } catch (error) {
    console.error('加载 base.json 失败', error);
    baseDictionary = {};
  }
  return baseDictionary;
}

/**
 * 加载 custom.json（若不存在则尝试 localStorage）
 */
async function loadCustomDictionary(): Promise<Dictionary> {
  if (Object.keys(customDictionary).length) return customDictionary;
  try {
    const res = await fetch(CUSTOM_DICT_URL);
    if (res.ok) {
      customDictionary = await res.json();
    } else {
      customDictionary = {};
    }
  } catch (error) {
    console.error('加载 custom.json 失败', error);
    // Fallback to localStorage
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    customDictionary = cached ? JSON.parse(cached) : {};
    if (!cached) {
      console.warn('custom.json 未找到，使用 localStorage 或空字典');
    }
  }
  return customDictionary;
}

/**
 * 将条目写入 customDictionary 并保存至 localStorage
 */
function saveToCustomDictionary(entry: DictionaryEntry) {
  if (!customDictionary) {
    customDictionary = {};
  }
  customDictionary[entry.word.toLowerCase()] = entry;
  // 持久化到 localStorage（网页环境下无文件写入权限）
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customDictionary));
}

/**
 * 查询单词条目（本地优先 → OpenAI → 返回 null）
 */
export async function getWordEntry(word: string): Promise<DictionaryEntry | null> {
  const lower = word.toLowerCase();
  const [baseDict, customDict] = await Promise.all([
    loadBaseDictionary(),
    loadCustomDictionary(),
  ]);

  // 1. 本地 base.json
  if (baseDict && baseDict[lower]) {
    return { ...baseDict[lower], source: 'base' };
  }

  // 2. 本地 custom.json / localStorage
  if (customDict && customDict[lower]) {
    return { ...customDict[lower], source: 'user' };
  }

  // 3. OpenAI 补全
  const aiResp = await getWordDataFromOpenAI(word);
  if (aiResp.success) {
    const aiEntry: DictionaryEntry = {
      word: aiResp.data.word,
      ipa: aiResp.data.phonetic,
      meaningCn: aiResp.data.meaning,
      sentenceEn: aiResp.data.example,
      sentenceCn: aiResp.data.exampleTranslation,
      phonics: [], // AI暂未提供，后续可用音节算法补全
      imageUrl: undefined,
      source: 'ai',
    };
    // 存入自定义词典
    saveToCustomDictionary(aiEntry);
    return aiEntry;
  }

  // 4. 如果失败返回 null
  return null;
}

/**
 * 批量查询
 */
export async function getBatchEntries(words: string[]): Promise<DictionaryEntry[]> {
  const results: DictionaryEntry[] = [];
  for (const word of words) {
    const entry = await getWordEntry(word);
    if (entry) results.push(entry);
  }
  return results;
} 