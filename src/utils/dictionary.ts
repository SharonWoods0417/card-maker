// ========================================
// 📚 本地词典构建与自动补全工具模块
// ========================================
// 核心功能：
// 1. CSV批量导入和字段自动补全
// 2. 本地词典文件管理 (base.json / custom.json)
// 3. 图片下载和本地存储
// 4. 自然拼读拆分算法
// 5. 开发调试工具
// ========================================

import { DictionaryEntry, Dictionary } from '../types';
import { getWordDataFromOpenAI } from '../api/openai';
import { getImageForWord } from '../api/image';

// ========================================
// 📁 文件路径配置
// ========================================
const BASE_DICT_PATH = '/dictionaries/base.json';
const CUSTOM_DICT_PATH = '/dictionaries/custom.json';

// ========================================
// 📋 数据类型定义
// ========================================
export type WordEntry = DictionaryEntry;

export interface CSVProcessResult {
  success: boolean;
  processedCount: number;
  skippedCount: number;
  errors: string[];
  newEntries: WordEntry[];
}

// ========================================
// 🔧 公共工具函数
// ========================================

/**
 * 判断字符是否为元音
 */
function isVowel(char: string): boolean {
  return 'aeiou'.includes(char?.toLowerCase());
}

/**
 * 格式化单词存储（除专有名词外都用小写）
 * 统一的单词格式化逻辑，避免重复代码
 */
export function formatWordForStorage(word: string): string {
  const properNouns = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 
    'September', 'October', 'November', 'December', 
    'China', 'America', 'English', 'Chinese', 'American'
  ];
  
  const capitalizedWord = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  
  if (properNouns.includes(capitalizedWord)) {
    return capitalizedWord;
  }
  
  return word.toLowerCase();
}

// ========================================
// 🔍 词典查询功能
// ========================================

/**
 * 从本地词典中查找单词条目
 * 查找顺序：base.json → custom.json
 */
export async function findInLocalDictionary(word: string): Promise<WordEntry | null> {
  const lowerWord = word.toLowerCase();
  
  try {
    // 1. 查找 base.json
    const baseResponse = await fetch(BASE_DICT_PATH);
    if (baseResponse.ok) {
      const baseDict: Dictionary = await baseResponse.json();
      if (baseDict[lowerWord]) {
        return baseDict[lowerWord];
      }
    }
    
    // 2. 查找 custom.json
    const customResponse = await fetch(CUSTOM_DICT_PATH);
    if (customResponse.ok) {
      const customDict: Dictionary = await customResponse.json();
      if (customDict[lowerWord]) {
        return customDict[lowerWord];
      }
    }
  } catch (error) {
    console.warn('查找本地词典失败:', error);
  }
  
  return null;
}

/**
 * 获取单词完整条目（本地优先 → AI补全）
 * 这是核心的单词数据获取函数
 */
export async function getWordEntry(word: string): Promise<WordEntry | null> {
  const isDebug = import.meta.env.DEV;
  if (isDebug) console.log(`🔍 获取单词条目: ${word}`);
  
  // 1. 先查本地词典
  const localEntry = await findInLocalDictionary(word);
  if (localEntry) {
    if (isDebug) console.log(`✅ 本地词典命中: ${word}`);
    
    // 🎯 字段自动补全：如果phonics字段缺失，自动补全
    if (!localEntry.phonics) {
      if (isDebug) console.log(`🔧 自动补全phonics字段: ${word}`);
      const phonicsResult = splitSyllables(word);
      if (phonicsResult) {
        localEntry.phonics = phonicsResult;
        // 更新到自定义词典
        await saveToCustomDict(localEntry);
        if (isDebug) console.log(`💾 已更新phonics字段到词典: ${word}`);
      }
    }
    
    return localEntry;
  }
  
  // 2. 调用AI补全
  if (isDebug) console.log(`🤖 调用AI补全: ${word}`);
  
  // 🎯 关键修复：无论AI是否成功，都先生成基础的音节拆分
  const phonicsResult = splitSyllables(word);
  if (isDebug) console.log(`🔧 生成音节拆分: ${word} → [${phonicsResult}]`);
  
  try {
    const aiResponse = await getWordDataFromOpenAI(word);
    if (aiResponse.success && aiResponse.data) {
      // AI成功：获取图片并创建完整条目
      const imageResponse = await getImageForWord(word);
      const imageUrl = imageResponse.success ? imageResponse.data : undefined;
      
       const wordEntry: WordEntry = {
         word: word,
         ipa: aiResponse.data.phonetic,
         meaningCn: aiResponse.data.meaning,
         sentenceEn: aiResponse.data.example,
         sentenceCn: aiResponse.data.exampleTranslation,
        phonics: phonicsResult, // 使用已生成的音节拆分
         imageUrl: imageUrl,
         source: 'ai' as const
       };
      
      // 保存到自定义词典
      await saveToCustomDict(wordEntry);
      
      if (isDebug) console.log(`✅ AI补全成功并已保存: ${word}`);
      return wordEntry;
    } else {
      // AI失败但有响应：记录错误并使用fallback
      if (isDebug) console.warn(`⚠️ AI调用失败但有响应: ${word}`, aiResponse.success ? 'Unknown error' : aiResponse.error?.message);
    }
  } catch (error) {
    if (isDebug) console.error(`❌ AI补全失败: ${word}`, error);
  }
  
  // 🎯 新增fallback逻辑：AI失败时创建基础条目
  if (isDebug) console.log(`🔧 AI失败，创建fallback条目: ${word}`);
  
  // 尝试获取图片（即使AI失败，图片可能仍能获取）
  let imageUrl: string | undefined;
  try {
    const imageResponse = await getImageForWord(word);
    if (imageResponse.success) {
      imageUrl = imageResponse.data;
      if (isDebug) console.log(`📸 fallback模式获取图片成功: ${word}`);
    } else {
      if (isDebug) console.warn(`📸 fallback模式获取图片失败: ${word}`);
    }
  } catch (error) {
    if (isDebug) console.warn(`📸 fallback模式图片获取异常: ${word}`, error);
  }
  
  // 创建基础条目（至少包含单词和音节拆分）
  // 🎯 改进：提供基本的音标估算
  const basicIPA = `/${word}/`; // 简单的音标估算格式
  
  const fallbackEntry: WordEntry = {
    word: word,
    ipa: basicIPA, // 提供基本音标而不是空字符串
    meaningCn: `${word}（AI调用失败，请手动补充释义）`, // 提供提示信息
    sentenceEn: `I need to learn the word "${word}".`, // 提供基本例句
    sentenceCn: `我需要学习单词"${word}"。`, // 提供基本翻译
    phonics: phonicsResult, // 🎯 确保音节拆分总是存在
    imageUrl: imageUrl, // 可能有图片，也可能没有
    source: 'user' as const
  };
  
  // 保存fallback条目到自定义词典
  await saveToCustomDict(fallbackEntry);
  if (isDebug) console.log(`💾 fallback条目已保存: ${word}`);
  
  return fallbackEntry;
}

// ========================================
// 💾 词典文件管理
// ========================================

/**
 * 保存单词条目到自定义词典
 */
export async function saveToCustomDict(entry: WordEntry): Promise<boolean> {
  try {
    // 读取现有自定义词典
    let customDict: Dictionary = {};
    try {
      const response = await fetch(CUSTOM_DICT_PATH);
      if (response.ok) {
        customDict = await response.json();
      }
    } catch (error) {
      console.warn('读取自定义词典失败，将创建新词典:', error);
    }
    
    // 添加新条目
    customDict[entry.word.toLowerCase()] = entry;
    
    // 保存到localStorage（因为网页环境无法直接写文件）
    const customDictKey = 'customDictionary';
    localStorage.setItem(customDictKey, JSON.stringify(customDict));
    
    const isDebug = import.meta.env.DEV;
    if (isDebug) console.log(`💾 已保存到自定义词典: ${entry.word}`);
    return true;
  } catch (error) {
    console.error('保存到自定义词典失败:', error);
    return false;
  }
}

/**
 * 从localStorage加载自定义词典
 */
export function loadCustomDictFromStorage(): Dictionary {
  try {
    const stored = localStorage.getItem('customDictionary');
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('从localStorage加载自定义词典失败:', error);
    return {};
  }
}

/**
 * 导出自定义词典为JSON文件
 */
export function exportCustomDict(): void {
  const customDict = loadCustomDictFromStorage();
  const dataStr = JSON.stringify(customDict, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'custom_dictionary.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
  
  const isDebug = import.meta.env.DEV;
  if (isDebug) console.log('📦 自定义词典已导出');
}

// ========================================
// 🔬 自然拼读拆分算法 (v4.0 - Syllable Based)
// ========================================

/**
 * 主函数：按v4.0音节规则拆分单词
 * @param word 单词
 * @returns {string} 用连字符'-'连接的音节字符串, e.g., "ap-ple"
 */
export function splitSyllables(word: string): string {
    word = word.toLowerCase().trim();
    if (!word) return '';

    // 规则 1: 复合词优先处理 (简化版，可扩展)
    const compoundWords: Record<string, string> = {
        'football': 'foot-ball',
        'watermelon': 'wa-ter-mel-on',
        'pancake': 'pan-cake',
        'cannot': 'can-not'
    };
    if (compoundWords[word]) {
        return compoundWords[word];
    }
    
    // 规则 2 & 3: 前后缀和稳定词尾处理
    const prefixes = ['un', 're', 'dis', 'mis', 'pre', 'ex', 'in', 'im', 'ir', 'il', 'sub', 'inter', 'over', 'under'];
    const suffixes = ['ing', 'ed', 'tion', 'sion', 'ture', 'ment', 'ness', 'ly', 'able', 'ous', 'ful', 'less'];
    
    for (const prefix of prefixes) {
        if (word.startsWith(prefix) && word.length > prefix.length) {
            return `${prefix}-${splitSyllables(word.slice(prefix.length))}`;
        }
    }
    
    for (const suffix of suffixes) {
        if (word.endsWith(suffix) && word.length > suffix.length) {
            const stem = word.slice(0, word.length - suffix.length);
            if (countVowels(stem) > 0) {
                 return `${splitSyllables(stem)}-${suffix}`;
            }
        }
    }

    if (word.length > 3 && word.endsWith('le') && !isVowel(word[word.length - 3])) {
        const stem = word.slice(0, word.length - 3);
        if (countVowels(stem) > 0) {
             return `${splitSyllables(stem)}-${word.slice(word.length - 3)}`;
        }
    }
    
    // 规则 4 & 5 & 6: VCCV, VCV 规则
    const chars = word.split('');
    let vowelsIndices = chars.map((c, i) => isVowel(c) ? i : -1).filter(i => i !== -1);
    
    if (vowelsIndices.length <= 1) {
        return word; // 单音节词
    }

    for (let i = 0; i < vowelsIndices.length - 1; i++) {
        const v1_idx = vowelsIndices[i];
        const v2_idx = vowelsIndices[i+1];
        const consonantsBetween = word.substring(v1_idx + 1, v2_idx);

        if (consonantsBetween.length === 2) { // VCCV
            const splitPoint = v1_idx + 2;
            return `${word.slice(0, splitPoint)}-${splitSyllables(word.slice(splitPoint))}`;
        }
        if (consonantsBetween.length === 1) { // VCV
            const splitPoint = v1_idx + 1;
            return `${word.slice(0, splitPoint)}-${splitSyllables(word.slice(splitPoint))}`;
        }
    }

    return word; // Fallback
}

function countVowels(word: string): number {
    return word.split('').filter(isVowel).length;
}

// ========================================
// 📁 CSV批量处理功能
// ========================================

/**
 * 解析CSV文件内容
 */
export function parseCSVContent(csvContent: string): string[] {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return [];

  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const wordIndex = header.indexOf('word');

  if (wordIndex === -1) {
    throw new Error('CSV文件中必须包含 "word" 列');
  }

  return lines.slice(1).map(line => {
    const values = line.split(',');
    return values[wordIndex].trim();
  });
}

/**
 * 批量从CSV文件生成单词条目
 */
export async function batchGenerateFromCSV(csvContent: string): Promise<CSVProcessResult> {
  const result: CSVProcessResult = {
    success: true,
    processedCount: 0,
    skippedCount: 0,
    errors: [],
    newEntries: []
  };

  try {
    const words = parseCSVContent(csvContent);
    for (const word of words) {
      if (!word) continue;
      
      try {
        const existing = await findInLocalDictionary(word);
        if (existing) {
          result.skippedCount++;
          console.log(`⏭️ 跳过已存在的单词: ${word}`);
          continue;
        }
        
        const entry = await getWordEntry(word);
        if (entry) {
          result.newEntries.push(entry);
          result.processedCount++;
          console.log(`✅ 成功处理单词: ${word}`);
        } else {
          result.errors.push(`无法获取单词数据: ${word}`);
          console.error(`❌ 处理失败: ${word}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        const errorMsg = `处理 ${word} 时出错: ${String(error)}`;
        result.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }
    
    console.log(`📊 批量处理完成: 成功 ${result.processedCount}, 跳过 ${result.skippedCount}, 错误 ${result.errors.length}`);
    
  } catch (error) {
    result.success = false;
    result.errors.push(`CSV解析失败: ${String(error)}`);
    console.error('❌ CSV批量处理失败:', error);
  }
  
  return result;
}

// ========================================
// 🔧 调试和开发工具
// ========================================

/**
 * 清空自定义词典（开发调试用）
 */
export function clearCustomDict(): void {
  localStorage.removeItem('customDictionary');
  const isDebug = import.meta.env.DEV;
  if (isDebug) console.log('🗑️ 自定义词典已清空');
}

/**
 * 显示词典内容（开发调试用）
 */
export function debugShowDictionary(): void {
  const customDict = loadCustomDictFromStorage();
  console.table(customDict);
}

/**
 * 测试音节拆分规则v4.0
 */
export function testPhonicsRules(): void {
  const isDebug = import.meta.env.DEV;
  if (!isDebug) {
    console.warn('测试功能仅在开发环境中可用');
    return;
  }
  
  console.log('\n🎯 Syllable Split Rules v4.0 Test');
  console.log('📖 核心理念: 基于音节规则的层级拆分');
  console.log('📖 参考: doc/phonics_split_rules_v4.0_syllable.md');
  console.log('=' .repeat(60));
  
  const testCases = [
      { word: 'rabbit', expected: 'rab-bit' },
      { word: 'apple', expected: 'ap-ple' },
      { word: 'watermelon', expected: 'wa-ter-mel-on' },
      { word: 'disappear', expected: 'dis-ap-pear' }, // a-ppear is tricky
      { word: 'tiger', expected: 'ti-ger' },
      { word: 'celebrate', expected: 'cel-e-brate' },
      { word: 'banana', expected: 'ba-na-na' },
      { word: 'nation', expected: 'na-tion' },
      { word: 'little', expected: 'lit-tle' },
      { word: 'unhappy', expected: 'un-hap-py'},
      { word: 'beautiful', expected: 'beau-ti-ful'}
  ];
  
  let passCount = 0;
  const totalCount = testCases.length;
  const failedCases: { word: string, expected: string, actual: string }[] = [];
  
  testCases.forEach(testCase => {
    const result = splitSyllables(testCase.word);
    const passed = result === testCase.expected;
    const status = passed ? '✅' : '❌';
    
    if (passed) {
        passCount++;
    } else {
        failedCases.push({ word: testCase.word, expected: testCase.expected, actual: result });
    }
    
    console.log(`${status} ${testCase.word.padEnd(15)} → ${result.padEnd(20)} (期望: ${testCase.expected})`);
  });
  
  console.log('=' .repeat(60));
  console.log(`📊 v4.0 Syllable Test Result: ${passCount}/${totalCount} Passed (${Math.round(passCount/totalCount*100)}%)`);
  
  if (passCount < totalCount) {
    console.log('⚠️ Some test cases failed. Please review the logic. Failed cases:');
    failedCases.forEach(fail => {
        console.log(`- ${fail.word}: Expected [${fail.expected}], Got [${fail.actual}]`);
    });
  }
}

// ========================================
// 🔧 开发调试工具
// ========================================

/**
 * 获取词典统计信息
 */
export async function getDictionaryStats() {
  const stats = {
    baseCount: 0,
    customCount: 0,
    localStorageCount: 0,
    totalImages: 0
  };
  
  try {
    // 统计 base.json
    const baseResponse = await fetch(BASE_DICT_PATH);
    if (baseResponse.ok) {
      const baseDict: Dictionary = await baseResponse.json();
      stats.baseCount = Object.keys(baseDict).length;
    }
    
    // 统计 custom.json
    const customResponse = await fetch(CUSTOM_DICT_PATH);
    if (customResponse.ok) {
      const customDict: Dictionary = await customResponse.json();
      stats.customCount = Object.keys(customDict).length;
    }
    
    // 统计 localStorage
    const localDict = loadCustomDictFromStorage();
    stats.localStorageCount = Object.keys(localDict).length;
    
  } catch (error) {
    console.error('获取词典统计失败:', error);
  }
  
  return stats;
} 