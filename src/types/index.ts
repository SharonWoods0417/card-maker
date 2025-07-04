export interface WordCard {
  id: string;
  word: string;
  ipa?: string;          // 与DictionaryEntry保持一致，可选
  meaningCn: string;
  sentenceEn?: string;   // 与DictionaryEntry保持一致，可选
  sentenceCn?: string;   // 与DictionaryEntry保持一致，可选
  imageUrl?: string;     // 与DictionaryEntry保持一致，可选
  phonics?: string;      // 确保这里是 string
  source?: 'base' | 'custom' | 'ai' | 'user' | 'csv';
}

export interface CardGeneratorState {
  words: WordCard[];
  isPreviewMode: boolean;
  isLoading: boolean;
  showCardBack: boolean;
}

// 新增：字典条目接口（与需求文档v1.8保持一致）
export interface DictionaryEntry {
  word: string;
  ipa: string;
  meaningCn: string;
  sentenceEn: string;
  sentenceCn: string;
  phonics: string;
  imageUrl?: string;
  source: 'base' | 'custom' | 'ai' | 'user';
}

// 新增：字典文件结构
export interface Dictionary {
  [word: string]: DictionaryEntry;
}

// 新增：单词补全请求接口
export interface WordCompletionRequest {
  word: string;
  requiredFields?: (keyof DictionaryEntry)[];
}

// 新增：单词补全响应接口
export interface WordCompletionResponse {
  success: boolean;
  data?: DictionaryEntry;
  error?: string;
  source: 'dictionary' | 'ai' | 'fallback';
}