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

    // v3.1 拆分逻辑
    
    // 1. 例外词查表 (最高优先级)
    const exceptionResult = checkExceptionWordsV30(cleanWord);
    if (exceptionResult.length > 0) {
      if (isDebug) console.log(`🎯 例外词拆分 ${word}: [${exceptionResult.join(', ')}]`);
      return exceptionResult;
    }
    
    // 2. Final 'C+le' 规则 (继承v3.0)
    // 优先处理 'C+le' 结尾的单词，如 apple -> ap + ple
    const cleMatch = matchFinalCleV30(cleanWord);
    if (cleMatch) {
      const mainPart = cleanWord.slice(0, -cleMatch.length);
      // 对前半部分递归应用完整的拆分规则
      const mainChunks = splitPhonics(mainPart); 
      return [...mainChunks, cleMatch];
    }
    
    // 3. 对非 'C+le' 单词或递归的子部分，应用v3.1标准流程
    const result: string[] = [];
    let remaining = cleanWord;

    const startCombo = matchStartingComboV30(remaining);
    if (startCombo) {
      result.push(startCombo);
      remaining = remaining.slice(startCombo.length);
    }
    
    const prefixMatch = matchPrefixV30(remaining);
    if (prefixMatch) {
      result.push(prefixMatch);
      remaining = remaining.slice(prefixMatch.length);
    }
    
    const suffixMatch = matchSuffixV30(remaining);
    let suffix = '';
    if (suffixMatch) {
      suffix = suffixMatch;
      remaining = remaining.slice(0, -suffixMatch.length);
    }
    
    const middleParts = splitMiddlePartV30(remaining);
    result.push(...middleParts);
    
    if (suffix) {
      result.push(suffix);
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

// v3.0 起始组合保护
function matchStartingComboV30(word: string): string | null {
  // v3.0 继承v2.7起始组合保护：el, em, en（只在词首且不与前缀冲突时匹配）
  const combos = ['el', 'em', 'en'];
  for (const combo of combos) {
    if (word.startsWith(combo) && word.length > combo.length) {
      // 确保不与常见前缀冲突：如果单词以前缀开头，则不应用起始组合保护
      const prefixes = ['re', 'un', 'pre', 'dis', 'mis', 'non', 'sub', 'inter'];
      const hasPrefix = prefixes.some(prefix => word.startsWith(prefix));
      if (!hasPrefix) {
        return combo;
      }
    }
  }
  return null;
}

// v3.0 前缀/后缀
function matchPrefixV30(word: string): string | null {
  const prefixes = ['un', 're', 'pre', 'dis', 'mis', 'non', 'sub', 'inter'];
  for (const prefix of prefixes) {
    if (word.startsWith(prefix) && word.length > prefix.length) {
      return prefix;
    }
  }
  return null;
}
function matchSuffixV30(word: string): string | null {
  const suffixes = ['ing', 'ed', 'er', 'est', 'ly', 'ful', 'less', 'ness', 'ment', 'tion'];
  
  for (const suffix of suffixes) {
    if (word.endsWith(suffix) && word.length > suffix.length) {
      // v3.1优化：避免将R-controlled元音模式误识别为后缀
      // 如果是'er'后缀，需要检查前面是否是辅音+元音的模式
      if (suffix === 'er') {
        const beforeEr = word.slice(0, -2);
        // 如果'er'前面是元音，则更可能是R-controlled模式而非后缀
        // 例如：flower中的'ow'+'er'应该识别为vowel team + R-controlled
        if (beforeEr.length >= 2) {
          const lastTwoChars = beforeEr.slice(-2);
          const vowelTeams = ['ai', 'ay', 'ee', 'ea', 'oa', 'oo', 'ue', 'ew', 'ie', 'igh', 'ou', 'ow', 'oy', 'oi', 'ey', 'ui'];
          if (vowelTeams.includes(lastTwoChars)) {
            // 'er'前面是vowel team，不作为后缀处理
            continue;
          }
        }
      }
      return suffix;
    }
  }
  return null;
}

// v3.0 中间部分拆分
function splitMiddlePartV30(word: string): string[] {
  if (!word) return [];

  // v3.1 规则7: 闭音节（VC）优先划分（修正版）
  // 只有在确认不包含特殊组合模式的情况下，才将短词作为整体闭音节处理
  if (word.length <= 4) {
    const vowelCount = word.split('').filter(isVowel).length;
    // 检查是否为简单闭音节：单个元音且以辅音结尾
    if (vowelCount === 1 && !isVowel(word[word.length - 1])) {
      // v3.1优化：检查是否包含需要拆分的组合模式
      let hasSpecialPatterns = false;
      
      // 检查是否包含辅音组合（规则9）
      for (let i = 0; i < word.length; i++) {
        if (matchConsonantClustersV31(word, i)) {
          hasSpecialPatterns = true;
          break;
        }
      }
      
      // 检查是否包含元音组合（规则10）
      if (!hasSpecialPatterns) {
        for (let i = 0; i < word.length; i++) {
          const vowelTeamMatch = matchDigraphsV31(word, i);
          if (vowelTeamMatch && vowelTeamMatch.length > 1) {
            hasSpecialPatterns = true;
            break;
          }
        }
      }
      
      // 只有在没有特殊模式的情况下，才作为整体闭音节处理
      if (!hasSpecialPatterns) {
        const vowelIndex = word.split('').findIndex(isVowel);
        if (vowelIndex >= 0 && vowelIndex < word.length - 1) {
          return [word]; // 整个词作为一个闭音节拼读块
        }
      }
    }
  }

  const result: string[] = [];
  let i = 0;
  while (i < word.length) {
    // Final stable syllables (不含-le, 因为已在顶层处理)
    const finalStableMatch = matchFinalStableSyllablesV30(word, i);
    if (finalStableMatch) {
      result.push(finalStableMatch);
      i += finalStableMatch.length;
      continue;
    }
    // Magic-e结构
    const magicEMatch = checkMagicEV30(word, i);
    if (magicEMatch) {
      result.push(magicEMatch);
      i += magicEMatch.length;
      continue;
    }
    // v3.1: digraph/trigraph/vowel team独立性优先（规则10升级）
    const digraphMatch = matchDigraphsV31(word, i);
    if (digraphMatch) {
      result.push(digraphMatch);
      i += digraphMatch.length;
      continue;
    }
    // R-Controlled元音
    const rControlledMatch = matchRControlledV30(word, i);
    if (rControlledMatch) {
      result.push(rControlledMatch);
      i += rControlledMatch.length;
      continue;
    }
    // 鼻音组合
    const nasalMatch = matchNasalCombinations(word, i);
    if (nasalMatch) {
      result.push(nasalMatch);
      i += nasalMatch.length;
      continue;
    }
    // v3.1 规则9: 辅音组合起始块识别
    const consonantClusterMatch = matchConsonantClustersV31(word, i);
    if (consonantClusterMatch) {
      result.push(consonantClusterMatch);
      i += consonantClusterMatch.length;
      continue;
    }
    // v3.0: 双写辅音（在非C+le情况下保留）
    const doubleConsonantMatch = matchDoubleConsonants(word, i);
    if (doubleConsonantMatch) {
      result.push(doubleConsonantMatch);
      i += doubleConsonantMatch.length;
      continue;
    }
    // 单元音
    if (isVowel(word[i])) {
      result.push(word[i]);
      i++;
      continue;
    }
    // 单辅音
    result.push(word[i]);
    i++;
  }
  return result.filter(part => part.length > 0);
}

// v3.1 规则10: Vowel Teams拆分优先级提升 + digraph/trigraph独立性
function matchDigraphsV31(word: string, index: number): string | null {
  const consonantDigraphs = ['ch', 'sh', 'th', 'ph', 'wh', 'ck', 'ng', 'gh', 'tch', 'dge', 'wr', 'kn', 'gn', 'qu', 'squ'];
  
  // v3.1 规则10: Vowel Teams 必须整体保留（优先级提升）
  const vowelTeams = ['ai', 'ay', 'ee', 'ea', 'oa', 'oo', 'ue', 'ew', 'ie', 'igh', 'ou', 'ow', 'oy', 'oi', 'ey', 'ui'];
  
  // 优先匹配Vowel Teams（规则10）
  for (const vowelTeam of vowelTeams) {
    if (word.slice(index, index + vowelTeam.length) === vowelTeam) {
      return vowelTeam;
    }
  }
  
  // 然后匹配辅音digraphs
  for (const digraph of consonantDigraphs) {
    if (word.slice(index, index + digraph.length) === digraph) {
      return digraph;
    }
  }
  
  return null;
}
function matchRControlledV30(word: string, index: number): string | null {
  const rControlled = ['ar', 'er', 'ir', 'or', 'ur', 'air', 'are', 'ear', 'ere', 'eir'];
  for (const pattern of rControlled) {
    if (word.slice(index, index + pattern.length) === pattern) {
      return pattern;
    }
  }
  return null;
}
function matchFinalStableSyllablesV30(word: string, index: number): string | null {
  // v3.0中 'le' 已在顶层处理，此处不再匹配
  const finalStables = ['tion', 'sion', 'ture', 'cian', 'sure', 'age', 'dge'];
  for (const stable of finalStables) {
    if (word.slice(index, index + stable.length) === stable && index + stable.length >= word.length - 1) {
      return stable;
    }
  }
  return null;
}
function checkMagicEV30(word: string, index: number): string | null {
  if (index + 3 < word.length) {
    const consonant1 = word[index];
    const vowel = word[index + 1];
    const consonant2 = word[index + 2];
    const e = word[index + 3];
    if (!isVowel(consonant1) && isVowel(vowel) && !isVowel(consonant2) && e === 'e') {
      if (index + 4 === word.length || !isVowel(word[index + 4])) {
        return word.slice(index, index + 4);
      }
    }
  }
  return null;
}
function matchConsonantClustersV31(word: string, index: number): string | null {
  // v3.1 三辅音组合（优先级更高）
  const threeClusters = ['squ', 'scr', 'spl', 'spr', 'str', 'thr', 'shr'];
  
  // v3.1 双辅音组合（规则9核心）
  const twoClusters = [
    'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 
    'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'tw'
  ];
  
  // 只在单词开头或元音后面匹配辅音组合
  if (index > 0 && !isVowel(word[index - 1])) {
    return null;
  }
  
  // 优先匹配三辅音组合
  for (const cluster of threeClusters) {
    if (word.slice(index, index + cluster.length) === cluster) {
      return cluster;
    }
  }
  
  // 然后匹配双辅音组合
  for (const cluster of twoClusters) {
    if (word.slice(index, index + cluster.length) === cluster) {
      return cluster;
    }
  }
  
  return null;
}
function isVowel(char: string): boolean {
  return 'aeiou'.includes(char?.toLowerCase());
}

// ========================================
// 🎯 v3.0拼读规则辅助函数
// ========================================

/**
 * 匹配Final 'C+le'结尾 (v3.0核心)
 */
function matchFinalCleV30(word: string): string | null {
  const endings = ['ble', 'cle', 'dle', 'fle', 'gle', 'kle', 'ple', 'tle', 'zle'];
  for (const ending of endings) {
    if (word.endsWith(ending) && word.length > ending.length) {
      return ending;
    }
  }
  return null;
}

/**
 * 匹配鼻音组合拼读块
 */
function matchNasalCombinations(word: string, index: number): string | null {
  const nasalCombinations = ['an', 'en', 'in', 'on', 'un', 'ang', 'ing'];
  
  for (const combination of nasalCombinations) {
    if (word.slice(index, index + combination.length) === combination) {
      return combination;
    }
  }
  
  return null;
}

// 已移除未使用的v2.3/v2.6旧函数，保持代码整洁

/**
 * 匹配双写辅音
 */
function matchDoubleConsonants(word: string, index: number): string | null {
  if (index + 1 < word.length) {
    const char1 = word[index];
    const char2 = word[index + 1];
    
    // 检查是否为双写辅音（除了元音）
    if (!isVowel(char1) && char1 === char2) {
      return char1 + char2;
    }
  }
  
  return null;
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
  
  console.log('\n🎯 Oxford Phonics 拆分规则v3.1测试');
  console.log('📖 核心理念：拼读块 = 音素块（Phonics = Phonemes）');
  console.log('📖 新增：v3.1 辅音组合起始块识别 + Vowel Teams拆分优先级提升');
  console.log('📖 参考：Oxford_Phonics_Split_Rules_v3.1.md');
  console.log('=' .repeat(60));
  
  const testCases = [
    // v3.1核心：规则9 - 辅音组合起始块识别
    { word: 'flower', expected: ['fl', 'ow', 'er'], ipa: '/ˈflaʊər/', note: 'v3.1-规则9：fl起始组合' },
    { word: 'blue', expected: ['bl', 'ue'], ipa: '/bluː/', note: 'v3.1-规则9：bl起始组合' },
    { word: 'truck', expected: ['tr', 'u', 'ck'], ipa: '/trʌk/', note: 'v3.1-规则9：tr起始组合' },
    { word: 'green', expected: ['gr', 'ee', 'n'], ipa: '/griːn/', note: 'v3.1-规则9：gr起始组合' },
    { word: 'plant', expected: ['pl', 'a', 'n', 't'], ipa: '/plænt/', note: 'v3.1-规则9：pl起始组合' },
    { word: 'brave', expected: ['br', 'a', 'v', 'e'], ipa: '/breɪv/', note: 'v3.1-规则9：br起始组合' },
    
    // v3.1核心：规则10 - Vowel Teams拆分优先级
    { word: 'enjoy', expected: ['en', 'joy'], ipa: '/ɪnˈdʒɔɪ/', note: 'v3.1-规则10：oy元音组合' },
    { word: 'boy', expected: ['b', 'oy'], ipa: '/bɔɪ/', note: 'v3.1-规则10：oy元音组合' },
    { word: 'paint', expected: ['p', 'ai', 'n', 't'], ipa: '/peɪnt/', note: 'v3.1-规则10：ai元音组合' },
    { word: 'play', expected: ['pl', 'ay'], ipa: '/pleɪ/', note: 'v3.1-规则10：ay元音组合+pl组合' },
    { word: 'coin', expected: ['c', 'oi', 'n'], ipa: '/kɔɪn/', note: 'v3.1-规则10：oi元音组合' },
    
    // v3.0核心保留验证：闭音节+C+le
    { word: 'apple', expected: ['ap', 'ple'], ipa: '/ˈæpəl/', note: 'v3.0-闭音节+ple' },
    { word: 'bottle', expected: ['bot', 'tle'], ipa: '/ˈbɒtəl/', note: 'v3.0-闭音节+tle' },
    { word: 'little', expected: ['lit', 'tle'], ipa: '/ˈlɪtəl/', note: 'v3.0-闭音节+tle' },
    { word: 'simple', expected: ['sim', 'ple'], ipa: '/ˈsɪmpəl/', note: 'v3.0-闭音节+ple' },
    { word: 'table', expected: ['t', 'a', 'ble'], ipa: '/ˈteɪbəl/', note: 'v3.0-开音节+ble' },
    { word: 'jungle', expected: ['jun', 'gle'], ipa: '/ˈdʒʌŋɡəl/', note: 'v3.0-闭音节+gle' },
    { word: 'puzzle', expected: ['puz', 'zle'], ipa: '/ˈpʌzəl/', note: 'v3.0-闭音节+zle' },
    { word: 'candle', expected: ['can', 'dle'], ipa: '/ˈkændəl/', note: 'v3.0-闭音节+dle' },
    
    // v2.9保留验证：前后缀
    { word: 'unlock', expected: ['un', 'l', 'o', 'ck'], ipa: '/ʌnˈlɒk/', note: 'v2.9-前缀un-' },
    { word: 'redo', expected: ['re', 'd', 'o'], ipa: '/ˌriːˈduː/', note: 'v2.9-前缀re-' },
    { word: 'running', expected: ['r', 'u', 'nn', 'ing'], ipa: '/ˈrʌnɪŋ/', note: 'v2.9-后缀ing' },
    { word: 'played', expected: ['pl', 'ay', 'ed'], ipa: '/pleɪd/', note: 'v3.1混合：pl组合+ay元音+ed后缀' },
    { word: 'kindness', expected: ['k', 'i', 'n', 'd', 'ness'], ipa: '/ˈkaɪndnəs/', note: 'v2.9-后缀ness' },

    // v2.9保留验证：双写辅音（非C+le情况）
    { word: 'rabbit', expected: ['r', 'a', 'bb', 'i', 't'], ipa: '/ˈræbɪt/', note: 'v2.9-双写bb' },

    // v2.7核心示例（保留验证）
    { word: 'elephant', expected: ['el', 'e', 'ph', 'ant'], ipa: '/ˈɛləfənt/', note: 'v2.7-el起始' },
    { word: 'empty', expected: ['em', 'p', 't', 'y'], ipa: '/ˈɛmpti/', note: 'v2.7-em起始' },
    { word: 'energy', expected: ['en', 'er', 'g', 'y'], ipa: '/ˈɛnədʒi/', note: 'v2.7-en起始' },
    
    // 其他保留验证
    { word: 'phone', expected: ['ph', 'o', 'n', 'e'], ipa: '/fəʊn/', note: 'Magic-e(待优化)' },
    { word: 'graph', expected: ['gr', 'a', 'ph'], ipa: '/grɑːf/', note: 'v3.1混合：gr组合+ph结尾' },
    { word: 'write', expected: ['wr', 'i', 't', 'e'], ipa: '/raɪt/', note: 'Magic-e(待优化)' },
    { word: 'catch', expected: ['c', 'a', 'tch'], ipa: '/kætʃ/', note: '不可拆组合tch' },
    { word: 'cake', expected: ['c', 'a', 'k', 'e'], ipa: '/keɪk/', note: 'Magic-e(待优化)' },
    { word: 'car', expected: ['c', 'ar'], ipa: '/kɑː/', note: 'R-Controlled' },
    { word: 'rain', expected: ['r', 'ai', 'n'], ipa: '/reɪn/', note: 'v3.1-规则10：ai元音组合' },
    { word: 'one', expected: ['one'], ipa: '/wʌn/', note: '例外词' },
    { word: 'picture', expected: ['pic', 'ture'], ipa: '/ˈpɪktʃə/', note: '-ture结尾' },
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
  console.log(`📊 v3.1 规则测试结果: ${passCount}/${totalCount} 通过 (${Math.round(passCount/totalCount*100)}%)`);
  
  if (passCount === totalCount) {
    console.log('🎉 所有v3.1测试通过！辅音组合起始块识别和Vowel Teams拆分优化运行正常！');
  } else {
    console.log('⚠️ 部分测试未通过，请检查v3.1拆分逻辑。');
    console.log('💡 重点检查：规则9（辅音组合fl/tr/bl/gr）和规则10（Vowel Teams ow/oy/oi/ai）');
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