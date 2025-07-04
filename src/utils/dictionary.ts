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
  
  // 🎯 关键修复：无论AI是否成功，都先生成基础的音节拆分
  const phonicsResult = splitPhonics(word);
  if (isDebug) console.log(`🔧 生成音节拆分: ${word} → [${phonicsResult.join(', ')}]`);
  
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
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = 'custom-dictionary.json';
  link.click();
  
  const isDebug = import.meta.env.DEV;
  if (isDebug) console.log('📁 自定义词典已导出');
}

// ========================================
// 🎯 Oxford Phonics 自然拼读拆分算法 v3.1
// 基于最新Oxford Phonics Split Rules v3.1规范
// 核心理念：拼读块 = 音素块（Phonics = Phonemes）
// 适用于6-10岁儿童英文拼读教学、发音辅助训练
// 新增v3.1: 辅音组合起始块识别(fl/tr/bl/gr) + Vowel Teams拆分优先级提升
// ========================================

/**
 * 基于Oxford Phonics规则v3.1的单词拆分
 * 核心原则：
 * v3.1核心变更:
 * 1. 规则9：辅音组合起始块识别 - fl/tr/bl/gr等必须整体保留（如flower→fl-ow-er）
 * 2. 规则10：Vowel Teams拆分优先级提升 - ow/oy/oi/ai/ay/ee等必须整体保留
 * 3. 继承v3.0所有特性：闭音节优先、Final C+le匹配优化
 * 4. 音素映射对齐 - 每个拼读块对应一个或一组连续音素
 * 5. 不可拆组合保护 - 保护digraphs、vowel teams、magic-e等
 * 6. 语音优先级 > 音节结构 - 以发音结构为主
 * 
 * 输入：单词字符串
 * 输出：拼读块数组
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
    const isDebug = import.meta.env.DEV;

    // 1. 例外词查表（最高优先级）
    const exceptionResult = checkExceptionWordsV30(cleanWord);
    if (exceptionResult.length > 0) {
      if (isDebug) console.log(`🎯 例外词拆分 ${word}: [${exceptionResult.join(', ')}]`);
      return exceptionResult;
    }

    // 2. 音节初步拆分
    const syllables = splitSyllablesV32(cleanWord);
    if (isDebug) console.log(`🎵 音节拆分 ${word}: [${syllables.join(', ')}]`);

    // 3. 处理每个音节
    const result: string[] = [];
    for (let syllable of syllables) {
      // 检查是否是CVC模式
      if (isCVCPattern(syllable)) {
        result.push(syllable);
        continue;
      }

      // 检查前缀
      const prefix = matchPrefixV30(syllable);
      if (prefix) {
        result.push(prefix);
        syllable = syllable.slice(prefix.length);
      }

      // 检查后缀
      const suffix = matchSuffixV30(syllable);
      if (suffix) {
        const mainPart = syllable.slice(0, -suffix.length);
        // 处理主体部分
        let i = 0;
        while (i < mainPart.length) {
          const pattern = matchPhonicsPatternV32(mainPart, i);
          if (pattern) {
            result.push(pattern);
            i += pattern.length;
          } else {
            result.push(mainPart[i]);
            i++;
          }
        }
        result.push(suffix);
      } else {
        // 如果没有后缀，直接处理整个音节
        let i = 0;
        while (i < syllable.length) {
          const pattern = matchPhonicsPatternV32(syllable, i);
          if (pattern) {
            result.push(pattern);
            i += pattern.length;
          } else {
            result.push(syllable[i]);
            i++;
          }
        }
      }
    }

    return result.filter(part => part.length > 0);

  } catch (error) {
    console.error(`❌ 拼读拆分失败: ${word}`, error);
    return [word];
  }
}

// v3.0 例外词查表 (基于v2.9，可按需更新)
function checkExceptionWordsV30(word: string): string[] {
  const exceptions: Record<string, string[]> = {
    // 发音与拼写严重不一致的词
    'said': ['s', 'ai', 'd'], // ai发/ɛ/
    'have': ['h', 'a', 've'], // e不发音
    'one': ['one'], // 整体发音/wʌn/
    'two': ['two'], // 整体发音/tuː/
    'done': ['done'], // 整体发音/dʌn/
    'gone': ['g', 'o', 'ne'], // o发/ɒ/
    'some': ['s', 'o', 'me'], // o发/ʌ/
    'come': ['c', 'o', 'me'], // o发/ʌ/
    'love': ['l', 'o', 've'], // o发/ʌ/
    'give': ['g', 'i', 've'], // i发/ɪ/
    'live': ['l', 'i', 've'], // i发/ɪ/
    'move': ['m', 'o', 've'], // o发/uː/
    'lose': ['l', 'o', 'se'], // o发/uː/
    'above': ['a', 'b', 'o', 've'], // o发/ʌ/
    'what': ['wh', 'a', 't'], // a发/ɒ/
    'who': ['wh', 'o'], // o发/uː/
    'where': ['wh', 'ere'], // ere发/eə/
    'when': ['wh', 'e', 'n'], // e发/ɛ/
    'why': ['wh', 'y'], // y发/aɪ/
    'which': ['wh', 'i', 'ch'], // i发/ɪ/
    'whose': ['wh', 'o', 'se'], // o发/uː/
    'how': ['h', 'ow'], // ow发/aʊ/
    'are': ['are'], // 整体发音/ɑː/
    'were': ['w', 'ere'], // ere发/ɜː/
    'was': ['w', 'a', 's'], // a发/ɒ/
    'does': ['d', 'oe', 's'], // oe发/ʌ/
    'friend': ['fr', 'ie', 'n', 'd'], // ie发/ɛ/
    'again': ['a', 'g', 'ai', 'n'], // ai发/ɛ/
    'any': ['a', 'n', 'y'], // a发/ɛ/
    'many': ['m', 'a', 'n', 'y'], // a发/ɛ/
    'been': ['b', 'ee', 'n'], // ee发/ɪ/
    'eye': ['eye'], // 整体发音/aɪ/
    'sugar': ['s', 'u', 'g', 'ar'], // s发/ʃ/
  };

  return exceptions[word] || [];
}


// v3.2 前缀/后缀
function matchPrefixV30(word: string): string | null {
  const prefixes = [
    'un', 're', 'dis', 'mis', 'pre', 'ex', 'in', 'im', 'ir', 'il',
    'sub', 'inter', 'over', 'under', 'trans', 'en', 'em', 'fore',
    'de', 'non', 'anti', 'auto', 'bi', 'tri', 'co', 'con'
  ];
  
  // 按长度降序排序，确保优先匹配最长的前缀
  prefixes.sort((a, b) => b.length - a.length);
  
  for (const prefix of prefixes) {
    if (word.startsWith(prefix) && word.length > prefix.length) {
      return prefix;
    }
  }
  return null;
}

function matchSuffixV30(word: string): string | null {
  const suffixes = {
    verb: ['ing', 'ed', 'en', 'ify', 'ize'],
    adj: ['er', 'est', 'ful', 'less', 'ous', 'ive', 'al', 'ic', 'able', 'ible', 'y'],
    noun: ['ment', 'ness', 'tion', 'sion', 'ity', 'ty', 'ship', 'hood', 'dom', 'ance', 'ence', 'age', 'ist', 'or', 'er'],
    adv: ['ly', 'ward', 'wise']
  };
  
  // 将所有后缀合并到一个数组，并按长度降序排序
  const allSuffixes = Object.values(suffixes).flat().sort((a, b) => b.length - a.length);
  
  for (const suffix of allSuffixes) {
    if (word.endsWith(suffix) && word.length > suffix.length) {
      // v3.2优化：避免将R-controlled元音模式误识别为后缀
      if (suffix === 'er') {
        const beforeEr = word.slice(0, -2);
        if (beforeEr.length >= 2) {
          const lastTwoChars = beforeEr.slice(-2);
          const vowelTeams = ['ai', 'ay', 'ee', 'ea', 'oa', 'oo', 'ue', 'ew', 'ie', 'igh', 'ou', 'ow', 'oy', 'oi', 'ey', 'ui'];
          if (vowelTeams.includes(lastTwoChars)) {
            continue; // 'er'前面是vowel team，不作为后缀处理
          }
        }
      }
      return suffix;
    }
  }
  return null;
}

// v3.2 音节结构初步拆分
function splitSyllablesV32(word: string): string[] {
  // 如果单词长度小于等于3，视为单音节
  if (word.length <= 3) {
    return [word];
  }

  const syllables: string[] = [];
  let current = '';
  let vowelCount = 0;
  let i = 0;

  while (i < word.length) {
    current += word[i];
    
    if (isVowel(word[i])) {
      vowelCount++;
      // 检查是否是元音组合
      if (i + 1 < word.length && isVowel(word[i + 1])) {
        current += word[i + 1];
        i++;
      }
    } else {
      // 检查辅音组合
      if (i + 1 < word.length && !isVowel(word[i + 1])) {
        // 检查是否是有效的辅音组合
        const cluster = word.slice(i, i + 2);
        const validClusters = ['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr'];
        if (validClusters.includes(cluster)) {
          if (current.length > 1) {
            syllables.push(current);
            current = cluster;
            i++;
          } else {
            current += word[i + 1];
            i++;
          }
        }
      }
    }

    // 音节切分规则
    if (vowelCount === 1 && i + 2 < word.length) {
      // VC/V 模式
      if (!isVowel(word[i]) && isVowel(word[i + 1])) {
        syllables.push(current);
        current = '';
        vowelCount = 0;
      }
    }

    i++;
  }

  if (current) {
    syllables.push(current);
  }

  return syllables;
}

// v3.2 拼读块查表规则
function matchPhonicsPatternV32(word: string, index: number): string | null {
  // Hard C & G
  if (index + 1 < word.length) {
    const pattern = word.slice(index, index + 2);
    if (['ge', 'gi', 'gy', 'ce', 'ci', 'cy'].includes(pattern)) {
      return pattern;
    }
  }
  if (index + 3 < word.length && word.slice(index, index + 4) === 'dge') {
    return 'dge';
  }

  // 特殊拼写组合
  const specialPatterns = ['kn', 'wr', 'mb', 'tw', 'gn', 'ds'];
  for (const pattern of specialPatterns) {
    if (index + pattern.length <= word.length && 
        word.slice(index, index + pattern.length) === pattern) {
      return pattern;
    }
  }

  // Digraphs
  const digraphs = ['ch', 'tch', 'sh', 'th', 'wh', 'ph', 'gh'];
  for (const pattern of digraphs) {
    if (index + pattern.length <= word.length && 
        word.slice(index, index + pattern.length) === pattern) {
      return pattern;
    }
  }

  // S blends
  const sBlends = ['sc', 'sk', 'st', 'sp', 'sm', 'sn', 'sl', 'sw'];
  for (const pattern of sBlends) {
    if (index + pattern.length <= word.length && 
        word.slice(index, index + pattern.length) === pattern) {
      return pattern;
    }
  }

  // R blends
  const rBlends = ['br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr'];
  for (const pattern of rBlends) {
    if (index + pattern.length <= word.length && 
        word.slice(index, index + pattern.length) === pattern) {
      return pattern;
    }
  }

  // L blends
  const lBlends = ['bl', 'cl', 'fl', 'gl', 'pl', 'sl'];
  for (const pattern of lBlends) {
    if (index + pattern.length <= word.length && 
        word.slice(index, index + pattern.length) === pattern) {
      return pattern;
    }
  }

  // R Vowels I & II
  const rVowels = ['ar', 'or', 'ir', 'ur', 'er', 'air', 'are', 'ear', 'eer', 'ire', 'ore', 'oar'];
  for (const pattern of rVowels) {
    if (index + pattern.length <= word.length && 
        word.slice(index, index + pattern.length) === pattern) {
      return pattern;
    }
  }

  // Magic E
  if (index + 2 < word.length && word[index + 2] === 'e') {
    const pattern = word.slice(index, index + 3);
    if (['a_e', 'i_e', 'o_e', 'u_e', 'e_e'].includes(pattern.replace(pattern[1], '_'))) {
      return pattern;
    }
  }

  // Vowel Teams
  const vowelTeams = [
    'ai', 'ay', 'au', 'aw', 'al', 'ar', 'are', 'ere',
    'ee', 'ea', 'ey', 'ei',
    'ie', 'igh', 'ire',
    'oa', 'ow', 'oe', 'ore',
    'oi', 'oy',
    'ue', 'ui', 'ew'
  ];
  for (const pattern of vowelTeams) {
    if (index + pattern.length <= word.length && 
        word.slice(index, index + pattern.length) === pattern) {
      return pattern;
    }
  }

  // Word Families
  const wordFamilies = ['an', 'en', 'in', 'on', 'un'];
  for (const pattern of wordFamilies) {
    if (index + pattern.length <= word.length && 
        word.slice(index, index + pattern.length) === pattern) {
      return pattern;
    }
  }

  return null;
}

// v3.2 CVC简化规则
function isCVCPattern(word: string): boolean {
  if (word.length !== 3) return false;
  return !isVowel(word[0]) && isVowel(word[1]) && !isVowel(word[2]);
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
 * 测试拼读拆分规则v3.1（开发调试用）
 * 基于v3.1规则，新增辅音组合起始块识别和Vowel Teams拆分优先级
 */
export function testPhonicsRules(): void {
  const isDebug = import.meta.env.DEV;
  if (!isDebug) {
    console.warn('测试功能仅在开发环境中可用');
    return;
  }
  
  console.log('\n🎯 Oxford Phonics 拆分规则v3.2测试');
  console.log('📖 核心理念：音节结构 + 拼读块 = 自然发音单位');
  console.log('📖 新增：v3.2 音节结构初步拆分 + CVC简化规则');
  console.log('📖 参考：Oxford_Phonics_Split_Rules_v3.2.md');
  console.log('=' .repeat(60));
  
  const testCases = [
    // v3.2 音节结构示例
    { word: 'observe', expected: ['ob', 'serve'], ipa: '/əbˈzɜːv/', note: 'v3.2-音节：ob-serve' },
    { word: 'building', expected: ['build', 'ing'], ipa: '/ˈbɪldɪŋ/', note: 'v3.2-音节+后缀：build-ing' },
    { word: 'scientist', expected: ['sci', 'en', 'tist'], ipa: '/ˈsaɪəntɪst/', note: 'v3.2-音节：sci-en-tist' },
    
    // v3.2 CVC简化规则示例
    { word: 'cat', expected: ['cat'], ipa: '/kæt/', note: 'v3.2-CVC简化' },
    { word: 'pan', expected: ['pan'], ipa: '/pæn/', note: 'v3.2-CVC简化' },
    { word: 'mix', expected: ['mix'], ipa: '/mɪks/', note: 'v3.2-CVC简化' },
    { word: 'fam', expected: ['fam'], ipa: '/fæm/', note: 'v3.2-CVC简化' },
    
    // v3.2 Hard C & G示例
    { word: 'gem', expected: ['g', 'e', 'm'], ipa: '/dʒem/', note: 'v3.2-Hard G' },
    { word: 'city', expected: ['c', 'i', 't', 'y'], ipa: '/ˈsɪti/', note: 'v3.2-Hard C' },
    { word: 'bridge', expected: ['br', 'i', 'dge'], ipa: '/brɪdʒ/', note: 'v3.2-dge组合' },
    
    // v3.2 特殊拼写组合示例
    { word: 'knife', expected: ['kn', 'i', 'fe'], ipa: '/naɪf/', note: 'v3.2-kn组合' },
    { word: 'write', expected: ['wr', 'i', 'te'], ipa: '/raɪt/', note: 'v3.2-wr组合' },
    { word: 'lamb', expected: ['l', 'a', 'mb'], ipa: '/læm/', note: 'v3.2-mb组合' },
    { word: 'twin', expected: ['tw', 'i', 'n'], ipa: '/twɪn/', note: 'v3.2-tw组合' },
    { word: 'sign', expected: ['s', 'i', 'gn'], ipa: '/saɪn/', note: 'v3.2-gn组合' },
    
    // v3.2 Digraphs示例
    { word: 'church', expected: ['ch', 'ur', 'ch'], ipa: '/tʃɜːtʃ/', note: 'v3.2-ch组合' },
    { word: 'catch', expected: ['c', 'a', 'tch'], ipa: '/kætʃ/', note: 'v3.2-tch组合' },
    { word: 'ship', expected: ['sh', 'i', 'p'], ipa: '/ʃɪp/', note: 'v3.2-sh组合' },
    { word: 'think', expected: ['th', 'i', 'n', 'k'], ipa: '/θɪŋk/', note: 'v3.2-th组合' },
    { word: 'phone', expected: ['ph', 'o', 'ne'], ipa: '/fəʊn/', note: 'v3.2-ph组合' },
    
    // v3.2 S blends示例
    { word: 'school', expected: ['sc', 'oo', 'l'], ipa: '/skuːl/', note: 'v3.2-sc组合' },
    { word: 'skip', expected: ['sk', 'i', 'p'], ipa: '/skɪp/', note: 'v3.2-sk组合' },
    { word: 'stop', expected: ['st', 'o', 'p'], ipa: '/stɒp/', note: 'v3.2-st组合' },
    { word: 'smile', expected: ['sm', 'i', 'le'], ipa: '/smaɪl/', note: 'v3.2-sm组合' },
    { word: 'snow', expected: ['sn', 'ow'], ipa: '/snəʊ/', note: 'v3.2-sn组合' },
    
    // v3.2 R blends示例
    { word: 'bread', expected: ['br', 'ea', 'd'], ipa: '/bred/', note: 'v3.2-br组合' },
    { word: 'cry', expected: ['cr', 'y'], ipa: '/kraɪ/', note: 'v3.2-cr组合' },
    { word: 'drive', expected: ['dr', 'i', 've'], ipa: '/draɪv/', note: 'v3.2-dr组合' },
    { word: 'frog', expected: ['fr', 'o', 'g'], ipa: '/frɒɡ/', note: 'v3.2-fr组合' },
    
    // v3.2 L blends示例
    { word: 'blue', expected: ['bl', 'ue'], ipa: '/bluː/', note: 'v3.2-bl组合' },
    { word: 'clean', expected: ['cl', 'ea', 'n'], ipa: '/kliːn/', note: 'v3.2-cl组合' },
    { word: 'fly', expected: ['fl', 'y'], ipa: '/flaɪ/', note: 'v3.2-fl组合' },
    { word: 'glass', expected: ['gl', 'a', 'ss'], ipa: '/ɡlɑːs/', note: 'v3.2-gl组合' },
    
    // v3.2 R Vowels示例
    { word: 'car', expected: ['c', 'ar'], ipa: '/kɑː/', note: 'v3.2-ar组合' },
    { word: 'fork', expected: ['f', 'or', 'k'], ipa: '/fɔːk/', note: 'v3.2-or组合' },
    { word: 'bird', expected: ['b', 'ir', 'd'], ipa: '/bɜːd/', note: 'v3.2-ir组合' },
    { word: 'turn', expected: ['t', 'ur', 'n'], ipa: '/tɜːn/', note: 'v3.2-ur组合' },
    { word: 'hair', expected: ['h', 'air'], ipa: '/heə/', note: 'v3.2-air组合' },
    { word: 'bear', expected: ['b', 'ear'], ipa: '/beə/', note: 'v3.2-ear组合' },
    { word: 'deer', expected: ['d', 'eer'], ipa: '/dɪə/', note: 'v3.2-eer组合' },
    
    // v3.2 Magic E示例
    { word: 'cake', expected: ['c', 'a', 'k', 'e'], ipa: '/keɪk/', note: 'v3.2-a_e组合' },
    { word: 'bike', expected: ['b', 'i', 'k', 'e'], ipa: '/baɪk/', note: 'v3.2-i_e组合' },
    { word: 'home', expected: ['h', 'o', 'm', 'e'], ipa: '/həʊm/', note: 'v3.2-o_e组合' },
    { word: 'cute', expected: ['c', 'u', 't', 'e'], ipa: '/kjuːt/', note: 'v3.2-u_e组合' },
    
    // v3.2 Vowel Teams示例
    { word: 'rain', expected: ['r', 'ai', 'n'], ipa: '/reɪn/', note: 'v3.2-ai组合' },
    { word: 'play', expected: ['pl', 'ay'], ipa: '/pleɪ/', note: 'v3.2-ay组合' },
    { word: 'boat', expected: ['b', 'oa', 't'], ipa: '/bəʊt/', note: 'v3.2-oa组合' },
    { word: 'coin', expected: ['c', 'oi', 'n'], ipa: '/kɔɪn/', note: 'v3.2-oi组合' },
    { word: 'boy', expected: ['b', 'oy'], ipa: '/bɔɪ/', note: 'v3.2-oy组合' },
    
    // v3.2 Word Families示例
    { word: 'fan', expected: ['f', 'an'], ipa: '/fæn/', note: 'v3.2-an组合' },
    { word: 'pen', expected: ['p', 'en'], ipa: '/pen/', note: 'v3.2-en组合' },
    { word: 'pin', expected: ['p', 'in'], ipa: '/pɪn/', note: 'v3.2-in组合' },
    { word: 'sun', expected: ['s', 'un'], ipa: '/sʌn/', note: 'v3.2-un组合' }
  ];
  
  let passCount = 0;
  const totalCount = testCases.length;
  
  testCases.forEach(testCase => {
    const result = splitPhonics(testCase.word);
    const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);
    const status = passed ? '✅' : '❌';
    
    if (passed) passCount++;
    
    console.log(`${status} ${testCase.word.padEnd(12)} → [${result.join('-').padEnd(18)}] ${testCase.ipa.padEnd(15)} (${testCase.note})`);
    
    if (!passed) {
      console.log(`    期望: [${testCase.expected.join('-')}]`);
    }
  });
  
  console.log('=' .repeat(60));
  console.log(`📊 v3.2 规则测试结果: ${passCount}/${totalCount} 通过 (${Math.round(passCount/totalCount*100)}%)`);
  
  if (passCount === totalCount) {
    console.log('🎉 所有v3.2测试通过！音节结构拆分和CVC简化规则运行正常！');
  } else {
    console.log('⚠️ 部分测试未通过，请检查v3.2拆分逻辑。');
    console.log('💡 重点检查：音节结构拆分、CVC简化规则、拼读块查表规则');
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