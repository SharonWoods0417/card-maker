export interface WordCard {
  id: string;
  word: string;
  ipa?: string;          // 与DictionaryEntry保持一致，可选
  meaningCn: string;
  sentenceEn?: string;   // 与DictionaryEntry保持一致，可选
  sentenceCn?: string;   // 与DictionaryEntry保持一致，可选
  imageUrl?: string;     // 与DictionaryEntry保持一致，可选
  phonics?: string[];    // 音节数组，可选
  ipaImage?: string;     // 音标截图base64，用于PDF显示
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
  ipa?: string;         // 国际音标（可选，与WordCard保持一致）
  meaningCn: string;    // 中文释义
  sentenceEn?: string;  // 英文例句（可选）
  sentenceCn?: string;  // 中文翻译（可选）
  phonics?: string[];   // 音节数组（可选）
  imageUrl?: string;    // 图片URL（可选）
  source: 'base' | 'ai' | 'user'; // 数据来源
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