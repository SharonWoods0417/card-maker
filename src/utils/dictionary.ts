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
    if (!localEntry.phonics || localEntry.phonics.length === 0) {
      if (isDebug) console.log(`🔧 自动补全phonics字段: ${word}`);
      const phonicsResult = splitPhonics(word);
      if (phonicsResult.length > 0) {
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
  try {
    const aiResponse = await getWordDataFromOpenAI(word);
    if (aiResponse.success && aiResponse.data) {
      // 获取图片
      const imageResponse = await getImageForWord(word);
      const imageUrl = imageResponse.success ? imageResponse.data : undefined;
      
             // 转换AI响应格式为词典格式
       const wordEntry: WordEntry = {
         word: word,
         ipa: aiResponse.data.phonetic,
         meaningCn: aiResponse.data.meaning,
         sentenceEn: aiResponse.data.example,
         sentenceCn: aiResponse.data.exampleTranslation,
         phonics: splitPhonics(word), // 自动拆分音节（同步函数）
         imageUrl: imageUrl,
         source: 'ai' as const
       };
      
      // 3. 保存到自定义词典
      await saveToCustomDict(wordEntry);
      
      if (isDebug) console.log(`✅ AI补全成功并已保存: ${word}`);
      return wordEntry;
    }
  } catch (error) {
    console.error(`❌ AI补全失败: ${word}`, error);
  }
  
  console.warn(`⚠️ 无法获取单词数据: ${word}`);
  return null;
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
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = 'custom-dictionary.json';
  link.click();
  
  const isDebug = import.meta.env.DEV;
  if (isDebug) console.log('📁 自定义词典已导出');
}

// ========================================
// 🎯 Oxford Phonics 自然拼读拆分算法
// ========================================

/**
 * 基于Oxford Phonics规则的单词拆分
 * 输入：单词字符串
 * 输出：音节数组
 */
export function splitPhonics(word: string): string[] {
  if (!word || typeof word !== 'string') {
    return [];
  }
  
  const cleanWord = word.toLowerCase().trim();
  if (cleanWord.length === 0) {
    return [];
  }
  
  try {
    // 1. 检查例外词
    const exceptionResult = checkExceptionWords(cleanWord);
    if (exceptionResult.length > 0) {
      const isDebug = import.meta.env.DEV;
      if (isDebug) console.log(`🎯 例外词拆分 ${word}: [${exceptionResult.join(', ')}]`);
      return exceptionResult;
    }
    
    // 2. 应用拼读规则
    const result = performPhonicsRuleSplit(cleanWord);
    const isDebug = import.meta.env.DEV;
    if (isDebug) console.log(`🎯 规则拆分 ${word}: [${result.join(', ')}]`);
    return result;
    
  } catch (error) {
    console.error(`❌ 拼读拆分失败: ${word}`, error);
    return [cleanWord]; // 降级方案：返回原词
  }
}

/**
 * 例外词查表
 */
function checkExceptionWords(word: string): string[] {
  const exceptions: Record<string, string[]> = {
    // 🔴 常见不规则词汇
    'said': ['s', 'ai', 'd'],
    'have': ['h', 'a', 've'],
    'again': ['a', 'g', 'ai', 'n'],
    'one': ['o', 'n', 'e'],
    'two': ['t', 'w', 'o'],
    'was': ['w', 'a', 's'],
    'does': ['d', 'o', 'e', 's'],
    'gone': ['g', 'o', 'n', 'e'],
    'any': ['a', 'n', 'y'],
    'been': ['b', 'e', 'e', 'n'],
    'answer': ['a', 'n', 's', 'w', 'er'],
    'are': ['a', 'r', 'e'],
    'were': ['w', 'e', 'r', 'e'],
    'done': ['d', 'o', 'n', 'e'],
  };
  
  return exceptions[word] || [];
}

/**
 * 执行规则拆分
 */
function performPhonicsRuleSplit(word: string): string[] {
  let remaining = word;
  const result: string[] = [];
  
  // 🎯 2. 前缀匹配
  const prefixMatch = matchPrefix(remaining);
  if (prefixMatch) {
    result.push(prefixMatch);
    remaining = remaining.slice(prefixMatch.length);
  }
  
  // 🎯 3. 后缀匹配（从末尾检查）
  const suffixMatch = matchSuffix(remaining);
  let suffix = '';
  if (suffixMatch) {
    suffix = suffixMatch;
    remaining = remaining.slice(0, -suffixMatch.length);
  }
  
  // 🎯 4-7. 处理中间部分
  const middleParts = splitMiddlePart(remaining);
  result.push(...middleParts);
  
  // 🎯 添加后缀
  if (suffix) {
    result.push(suffix);
  }
  
  return result.filter(part => part.length > 0);
}

/**
 * 匹配前缀
 */
function matchPrefix(word: string): string | null {
  const prefixes = ['re', 'un', 'pre', 'dis'];
  
  for (const prefix of prefixes) {
    if (word.startsWith(prefix) && word.length > prefix.length) {
      return prefix;
    }
  }
  
  return null;
}

/**
 * 匹配后缀
 */
function matchSuffix(word: string): string | null {
  const suffixes = ['ing', 'ed', 'ful', 'less', 'ness', 'ment'];
  
  for (const suffix of suffixes) {
    if (word.endsWith(suffix) && word.length > suffix.length) {
      return suffix;
    }
  }
  
  return null;
}

/**
 * 拆分中间部分（核心拼读规则）
 */
function splitMiddlePart(word: string): string[] {
  if (!word) return [];
  
  const result: string[] = [];
  let i = 0;
  
  while (i < word.length) {
    // 🎯 4. Digraphs 辅音双字母组合
    const digraphMatch = matchDigraphs(word, i);
    if (digraphMatch) {
      result.push(digraphMatch);
      i += digraphMatch.length;
      continue;
    }
    
    // 🎯 起始辅音组合（仅在词首或音节开始）
    const consonantClusterMatch = matchConsonantClusters(word, i);
    if (consonantClusterMatch) {
      result.push(consonantClusterMatch);
      i += consonantClusterMatch.length;
      continue;
    }
    
    // 🎯 5. Magic-e 规则检查
    const magicEMatch = checkMagicE(word, i);
    if (magicEMatch) {
      result.push(magicEMatch);
      i += magicEMatch.length;
      continue;
    }
    
    // 🎯 6. R-Controlled 元音
    const rControlledMatch = matchRControlled(word, i);
    if (rControlledMatch) {
      result.push(rControlledMatch);
      i += rControlledMatch.length;
      continue;
    }
    
    // 🎯 6. 元音组合
    const vowelDigraphMatch = matchVowelDigraphs(word, i);
    if (vowelDigraphMatch) {
      result.push(vowelDigraphMatch);
      i += vowelDigraphMatch.length;
      continue;
    }
    
    // 🎯 7. 单元音
    if (isVowel(word[i])) {
      result.push(word[i]);
      i++;
      continue;
    }
    
    // 🎯 8. 单辅音
    result.push(word[i]);
    i++;
  }
  
  return result.filter(part => part.length > 0);
}

/**
 * 匹配辅音双字母组合
 */
function matchDigraphs(word: string, index: number): string | null {
  const digraphs = ['ch', 'sh', 'th', 'ph', 'wh', 'ck'];
  
  for (const digraph of digraphs) {
    if (word.slice(index, index + digraph.length) === digraph) {
      return digraph;
    }
  }
  
  return null;
}

/**
 * 匹配起始辅音组合
 */
function matchConsonantClusters(word: string, index: number): string | null {
  const clusters = [
    'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr',
    'pl', 'pr', 'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'tw'
  ];
  
  // 只在词首或前面是元音时匹配
  if (index > 0 && !isVowel(word[index - 1])) {
    return null;
  }
  
  for (const cluster of clusters) {
    if (word.slice(index, index + cluster.length) === cluster) {
      return cluster;
    }
  }
  
  return null;
}

/**
 * 检查Magic-e结构 (CVCe)
 */
function checkMagicE(word: string, index: number): string | null {
  // 检查是否符合 CVCe 模式
  if (index + 3 < word.length && 
      !isVowel(word[index]) &&     // 辅音
      isVowel(word[index + 1]) &&  // 元音
      !isVowel(word[index + 2]) && // 辅音
      word[index + 3] === 'e' &&   // e
      (index + 4 === word.length || !isVowel(word[index + 4]))) { // 结尾或后面不是元音
    
    return word.slice(index, index + 4);
  }
  
  return null;
}

/**
 * 匹配R-Controlled元音
 */
function matchRControlled(word: string, index: number): string | null {
  const rControlled = ['ar', 'er', 'ir', 'or', 'ur'];
  
  for (const pattern of rControlled) {
    if (word.slice(index, index + pattern.length) === pattern) {
      return pattern;
    }
  }
  
  return null;
}

/**
 * 匹配元音组合
 */
function matchVowelDigraphs(word: string, index: number): string | null {
  const vowelDigraphs = ['oa', 'oo', 'ou', 'ow', 'ee', 'ea', 'ai', 'ay', 'oy', 'oi', 'ie', 'igh'];
  
  for (const digraph of vowelDigraphs) {
    if (word.slice(index, index + digraph.length) === digraph) {
      return digraph;
    }
  }
  
  return null;
}

/**
 * 判断是否为元音字母
 */
function isVowel(char: string): boolean {
  return 'aeiou'.includes(char?.toLowerCase());
}

// ========================================
// 📁 CSV批量处理功能
// ========================================

/**
 * 解析CSV内容为单词数组
 */
export function parseCSVContent(csvContent: string): string[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const words: string[] = [];
  
  // 跳过表头
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      // 假设第一列是单词
      const columns = line.split(',');
      const word = columns[0]?.trim().replace(/["']/g, '');
      if (word) {
        words.push(word);
      }
    }
  }
  
  return words;
}

/**
 * 批量处理CSV文件中的单词
 * 自动补全缺失字段并保存到自定义词典
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
    console.log(`📋 开始批量处理 ${words.length} 个单词`);
    
    for (const word of words) {
      try {
        // 检查是否已存在
        const existing = await findInLocalDictionary(word);
        if (existing) {
          result.skippedCount++;
          console.log(`⏭️ 跳过已存在的单词: ${word}`);
          continue;
        }
        
        // 获取完整条目
        const entry = await getWordEntry(word);
        if (entry) {
          result.newEntries.push(entry);
          result.processedCount++;
          console.log(`✅ 成功处理单词: ${word}`);
        } else {
          result.errors.push(`无法获取单词数据: ${word}`);
          console.error(`❌ 处理失败: ${word}`);
        }
        
        // 添加延迟避免API限制
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
 * 测试拼读拆分规则（开发调试用）
 */
export function testPhonicsRules(): void {
  const isDebug = import.meta.env.DEV;
  if (!isDebug) {
    console.warn('测试功能仅在开发环境中可用');
    return;
  }
  
  console.log('🧪 开始测试Oxford Phonics拼读拆分规则...\n');
  
  const testCases = [
    { word: 'cat', expected: ['c', 'a', 't'] },
    { word: 'dog', expected: ['d', 'o', 'g'] },
    { word: 'apple', expected: ['a', 'pp', 'le'] },
    { word: 'book', expected: ['b', 'oo', 'k'] },
    { word: 'elephant', expected: ['e', 'le', 'ph', 'a', 'nt'] },
    { word: 'beautiful', expected: ['b', 'eau', 't', 'i', 'f', 'ul'] },
    { word: 'house', expected: ['h', 'ou', 'se'] },
    { word: 'flower', expected: ['fl', 'ow', 'er'] },
    { word: 'said', expected: ['said'] }, // 例外词
    { word: 'have', expected: ['have'] }, // 例外词
  ];
  
  let passCount = 0;
  const totalCount = testCases.length;
  
  testCases.forEach(({ word, expected }) => {
    const result = splitPhonics(word);
    const passed = JSON.stringify(result) === JSON.stringify(expected);
    
    if (passed) passCount++;
    
    console.log(`${passed ? '✅' : '❌'} ${word}:`);
    console.log(`   期望: [${expected.join(', ')}]`);
    console.log(`   实际: [${result.join(', ')}]`);
    
    if (!passed) {
      console.log(`   🔍 差异分析需要优化`);
    }
    console.log('');
  });
  
  console.log(`🎯 测试结果: ${passCount}/${totalCount} 通过 (${Math.round(passCount/totalCount*100)}%)`);
  
  if (passCount === totalCount) {
    console.log('🎉 所有测试通过！拼读拆分规则运行正常。');
  } else {
    console.log('⚠️ 部分测试未通过，需要优化拼读规则。');
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