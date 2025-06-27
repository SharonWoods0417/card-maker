// Free Dictionary API 封装（备用方案）
// 文档：https://dictionaryapi.dev/

import { APIResponse, DictionaryEntry } from './types';

const DICT_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';

export async function getWordDataFromFreeDict(word: string): Promise<APIResponse<DictionaryEntry>> {
  try {
    const res = await fetch(`${DICT_API_URL}/${encodeURIComponent(word)}`);
    if (!res.ok) {
      return { success: false, error: { error: true, message: `HTTP ${res.status}` } };
    }
    const data = await res.json();
    const first = data[0];
    if (!first) {
      return { success: false, error: { error: true, message: '词典中无该词' } };
    }
    const entry: DictionaryEntry = {
      word: first.word,
      phonetic: first.phonetic || '',
      meanings: first.meanings,
    };
    return { success: true, data: entry };
  } catch (error) {
    return { success: false, error: { error: true, message: String(error) } };
  }
} 