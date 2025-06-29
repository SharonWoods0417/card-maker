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
// 🎯 Oxford Phonics 自然拼读拆分算法 v2.7
// 基于最新Oxford Phonics Split Rules v2.7规范
// 核心理念：拼读块 = 音素块（Phonics = Phonemes）
// 适用于6-10岁儿童英文拼读教学、发音辅助训练
// ========================================

/**
 * 基于Oxford Phonics规则v2.7的单词拆分
 * 核心原则：
 * 1. 音素映射对齐 - 每个拼读块对应一个或一组连续音素
 * 2. 不可拆组合保护 - 保护digraphs、vowel teams、magic-e等
 * 3. 起始组合保护 - el/em/en等在词首整体保留
 * 4. digraph独立性优先 - ph等必须单独成块
 * 5. 语音优先级 > 音节结构 - 以发音结构为主
 * 6. 拼读块构建方法 - 按优先级构建拼读块
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
    // v2.7拆分优先级：音素映射对齐
    // 1. 例外词查表
    const exceptionResult = checkExceptionWordsV27(cleanWord);
    if (exceptionResult.length > 0) {
      if (isDebug) console.log(`🎯 例外词拆分 ${word}: [${exceptionResult.join(', ')}]`);
      return exceptionResult;
    }
    // 2. 起始组合保护（el/em/en）
    const startCombo = matchStartingComboV27(cleanWord);
    let remaining = cleanWord;
    const result: string[] = [];
    if (startCombo) {
      result.push(startCombo);
      remaining = remaining.slice(startCombo.length);
    }
    // 3. 前缀/后缀
    const prefixMatch = matchPrefixV27(remaining);
    if (prefixMatch) {
      result.push(prefixMatch);
      remaining = remaining.slice(prefixMatch.length);
    }
    const suffixMatch = matchSuffixV27(remaining);
    let suffix = '';
    if (suffixMatch) {
      suffix = suffixMatch;
      remaining = remaining.slice(0, -suffixMatch.length);
    }
    // 4. 处理中间部分（v2.7音素对齐拆分）
    const middleParts = splitMiddlePartV27(remaining);
    result.push(...middleParts);
    // 5. 添加后缀
    if (suffix) {
      result.push(suffix);
    }
    return result.filter(part => part.length > 0);
  } catch (error) {
    console.error(`❌ 拼读拆分失败: ${word}`, error);
    return [word];
  }
}

// v2.7例外词查表（完整版）
function checkExceptionWordsV27(word: string): string[] {
  const exceptions: Record<string, string[]> = {
    // 发音与拼写严重不一致的词
    'said': ['s', 'ai', 'd'],        // ai发/ɛ/
    'have': ['h', 'a', 've'],        // e不发音
    'again': ['a', 'g', 'ai', 'n'],  // ai发短音
    'one': ['one'],                  // 整体发音/wʌn/
    'two': ['two'],                  // 整体发音/tuː/
    'does': ['does'],                // 整体发音/dʌz/
    'done': ['done'],                // 整体发音/dʌn/
    'gone': ['gone'],                // 整体发音/gɒn/
    'any': ['any'],                  // 整体发音/ˈɛni/
    'been': ['been'],                // 整体发音/bɪn/
    'are': ['are'],                  // 整体发音/ɑːr/
    'were': ['were'],                // 整体发音/wɜːr/
    'was': ['was'],                  // 整体发音/wɒz/
    'what': ['what'],                // wh发/w/
    'who': ['who'],                  // wh发/h/
    'where': ['where'],              // 整体处理
    'when': ['when'],                // 整体处理
    'why': ['why'],                  // 整体处理
    'come': ['come'],                // o发/ʌ/
    'some': ['some'],                // o发/ʌ/
  };
  return exceptions[word] || [];
}

// v2.7起始组合保护（修正逻辑）
function matchStartingComboV27(word: string): string | null {
  // 只在词首且不与前缀冲突时匹配
  const combos = ['el', 'em', 'en'];
  for (const combo of combos) {
    if (word.startsWith(combo) && word.length > combo.length) {
      // 确保不与常见前缀冲突：如果单词以前缀开头，则不应用起始组合保护
      const prefixes = ['re', 'un', 'pre', 'dis', 'mis', 'non', 'over', 'under'];
      const hasPrefix = prefixes.some(prefix => word.startsWith(prefix));
      if (!hasPrefix) {
        return combo;
      }
    }
  }
  return null;
}

// v2.7前缀/后缀（可扩展）
function matchPrefixV27(word: string): string | null {
  const prefixes = ['re', 'un', 'pre', 'dis', 'mis', 'non', 'over', 'under'];
  for (const prefix of prefixes) {
    if (word.startsWith(prefix) && word.length > prefix.length) {
      return prefix;
    }
  }
  return null;
}
function matchSuffixV27(word: string): string | null {
  const suffixes = ['ing', 'ed', 'ful', 'less', 'ness', 'ment', 'ly', 'est', 'er'];
  for (const suffix of suffixes) {
    if (word.endsWith(suffix) && word.length > suffix.length) {
      return suffix;
    }
  }
  return null;
}

// v2.7中间部分拆分（digraph独立性优先、不可拆组合保护）
function splitMiddlePartV27(word: string): string[] {
  if (!word) return [];
  const result: string[] = [];
  let i = 0;
  while (i < word.length) {
    // Final stable syllables
    const finalStableMatch = matchFinalStableSyllablesV27(word, i);
    if (finalStableMatch) {
      result.push(finalStableMatch);
      i += finalStableMatch.length;
      continue;
    }
    // Magic-e结构
    const magicEMatch = checkMagicEV27(word, i);
    if (magicEMatch) {
      result.push(magicEMatch);
      i += magicEMatch.length;
      continue;
    }
    // digraph/trigraph/vowel team独立性优先
    const digraphMatch = matchDigraphsV27(word, i);
    if (digraphMatch) {
      result.push(digraphMatch);
      i += digraphMatch.length;
      continue;
    }
    // R-Controlled元音
    const rControlledMatch = matchRControlledV27(word, i);
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
    // 起始辅音组合
    const consonantClusterMatch = matchConsonantClustersV27(word, i);
    if (consonantClusterMatch) {
      result.push(consonantClusterMatch);
      i += consonantClusterMatch.length;
      continue;
    }
    // 双写辅音
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

// v2.7 digraph/trigraph/vowel team独立性优先
function matchDigraphsV27(word: string, index: number): string | null {
  const consonantDigraphs = ['ch', 'sh', 'th', 'ph', 'wh', 'ck', 'ng', 'gh', 'tch', 'dge', 'wr', 'kn', 'gn', 'qu', 'squ'];
  const vowelDigraphs = ['ai', 'ay', 'ee', 'ea', 'oa', 'oo', 'ue', 'ew', 'ie', 'igh', 'ou', 'ow', 'oy', 'oi', 'ey', 'ui'];
  const allDigraphs = [...consonantDigraphs, ...vowelDigraphs];
  for (const digraph of allDigraphs) {
    if (word.slice(index, index + digraph.length) === digraph) {
      return digraph;
    }
  }
  return null;
}
function matchRControlledV27(word: string, index: number): string | null {
  const rControlled = ['ar', 'er', 'ir', 'or', 'ur', 'air', 'are', 'ear', 'ere', 'eir'];
  for (const pattern of rControlled) {
    if (word.slice(index, index + pattern.length) === pattern) {
      return pattern;
    }
  }
  return null;
}
function matchFinalStableSyllablesV27(word: string, index: number): string | null {
  const finalStables = ['le', 'tion', 'sion', 'ture', 'cian', 'sure', 'age', 'dge'];
  for (const stable of finalStables) {
    if (word.slice(index, index + stable.length) === stable && index + stable.length >= word.length - 1) {
      return stable;
    }
  }
  return null;
}
function checkMagicEV27(word: string, index: number): string | null {
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
function matchConsonantClustersV27(word: string, index: number): string | null {
  const twoClusters = ['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'tw'];
  const threeClusters = ['squ', 'scr', 'spl', 'spr', 'str', 'thr'];
  if (index > 0 && !isVowel(word[index - 1])) {
    return null;
  }
  for (const cluster of threeClusters) {
    if (word.slice(index, index + cluster.length) === cluster) {
      return cluster;
    }
  }
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
// 🎯 v2.7拼读规则辅助函数
// ========================================

/**
 * 匹配鼻音组合拼读块（v2.7规则）
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
 * 匹配双写辅音（v2.7规则）
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
 * 测试拼读拆分规则v2.7（开发调试用）
 * 基于音素映射对齐原则 + 起始组合保护 + digraph独立性优先
 */
export function testPhonicsRules(): void {
  const isDebug = import.meta.env.DEV;
  if (!isDebug) {
    console.warn('测试功能仅在开发环境中可用');
    return;
  }
  
  console.log('\n🎯 Oxford Phonics 拆分规则v2.7测试');
  console.log('📖 核心理念：拼读块 = 音素块（Phonics = Phonemes）');
  console.log('📖 新增：起始组合保护 + digraph独立性优先');
  console.log('📖 参考：Oxford_Phonics_Split_Rules_v2.7.md');
  console.log('=' .repeat(60));
  
  const testCases = [
    // v2.7核心示例（起始组合保护）
    { word: 'elephant', expected: ['el', 'e', 'ph', 'ant'], ipa: '/ˈɛləfənt/', note: 'el起始保护, ph独立' },
    { word: 'empty', expected: ['em', 'p', 't', 'y'], ipa: '/ˈɛmpti/', note: 'em起始保护' },
    { word: 'energy', expected: ['en', 'er', 'g', 'y'], ipa: '/ˈɛnədʒi/', note: 'en起始保护' },
    
    // digraph独立性优先
    { word: 'phone', expected: ['ph', 'o', 'n', 'e'], ipa: '/fəʊn/', note: 'ph独立, o-e→/əʊ/' },
    { word: 'graph', expected: ['gr', 'a', 'ph'], ipa: '/grɑːf/', note: 'ph独立成块' },
    { word: 'laugh', expected: ['l', 'au', 'gh'], ipa: '/lɑːf/', note: 'gh独立, au→/ɑː/' },
    
    // 不可拆组合保护
    { word: 'write', expected: ['wr', 'i', 't', 'e'], ipa: '/raɪt/', note: 'wr→/r/（不可拆）' },
    { word: 'know', expected: ['kn', 'ow'], ipa: '/nəʊ/', note: 'kn→/n/（不可拆）' },
    { word: 'catch', expected: ['c', 'a', 'tch'], ipa: '/kætʃ/', note: 'tch→/tʃ/（不可拆）' },
    { word: 'bridge', expected: ['br', 'i', 'dge'], ipa: '/brɪdʒ/', note: 'dge→/dʒ/（不可拆）' },
    { word: 'fruit', expected: ['fr', 'ui', 't'], ipa: '/fruːt/', note: 'ui→/uː/' },
    
    // 基础CVC（单音素拆分）
    { word: 'cat', expected: ['c', 'a', 't'], ipa: '/kæt/', note: '单音素对齐' },
    { word: 'dog', expected: ['d', 'o', 'g'], ipa: '/dɒg/', note: '单音素对齐' },
    
    // Magic-e结构
    { word: 'cake', expected: ['c', 'a', 'k', 'e'], ipa: '/keɪk/', note: 'a-e→/eɪ/' },
    { word: 'bike', expected: ['b', 'i', 'k', 'e'], ipa: '/baɪk/', note: 'i-e→/aɪ/' },
    { word: 'hope', expected: ['h', 'o', 'p', 'e'], ipa: '/həʊp/', note: 'o-e→/əʊ/' },
    
    // R-Controlled元音
    { word: 'car', expected: ['c', 'ar'], ipa: '/kɑː/', note: 'ar→/ɑː/' },
    { word: 'bird', expected: ['b', 'ir', 'd'], ipa: '/bɜːd/', note: 'ir→/ɜː/' },
    { word: 'care', expected: ['c', 'are'], ipa: '/keə/', note: 'are→/eə/' },
    
    // 元音组合（Vowel Teams）
    { word: 'rain', expected: ['r', 'ai', 'n'], ipa: '/reɪn/', note: 'ai→/eɪ/' },
    { word: 'boat', expected: ['b', 'oa', 't'], ipa: '/bəʊt/', note: 'oa→/əʊ/' },
    { word: 'night', expected: ['n', 'igh', 't'], ipa: '/naɪt/', note: 'igh→/aɪ/' },
    
    // 例外词（发音与拼写不一致）
    { word: 'one', expected: ['one'], ipa: '/wʌn/', note: '例外词整体处理' },
    { word: 'done', expected: ['done'], ipa: '/dʌn/', note: '例外词整体处理' },
    { word: 'what', expected: ['what'], ipa: '/wɒt/', note: '例外词整体处理' },
    
    // 前缀后缀拆分
    { word: 'reading', expected: ['re', 'a', 'd', 'ing'], ipa: '/ˈriːdɪŋ/', note: '前缀re-, 后缀-ing' },
    { word: 'unhappy', expected: ['un', 'h', 'a', 'pp', 'y'], ipa: '/ʌnˈhæpi/', note: '前缀un-' },
    { word: 'careful', expected: ['c', 'are', 'ful'], ipa: '/ˈkeəfʊl/', note: '后缀-ful' },
    
    // Final stable syllables
    { word: 'picture', expected: ['p', 'i', 'c', 'ture'], ipa: '/ˈpɪktʃə/', note: '-ture结尾结构' },
    { word: 'nation', expected: ['n', 'a', 'tion'], ipa: '/ˈneɪʃən/', note: '-tion结尾结构' },
    { word: 'table', expected: ['t', 'a', 'ble'], ipa: '/ˈteɪbəl/', note: '-ble结尾结构' }
  ];
  
  let passCount = 0;
  const totalCount = testCases.length;
  
  testCases.forEach(({ word, expected, ipa, note }, index) => {
    const result = splitPhonics(word);
    const passed = JSON.stringify(result) === JSON.stringify(expected);
    
    if (passed) passCount++;
    
    console.log(`${(index + 1).toString().padStart(2)}. ${word.padEnd(10)} → [${result.join('-').padEnd(18)}] ${passed ? '✅' : '❌'}`);
    if (!passed) {
      console.log(`     预期: [${expected.join('-')}]`);
    }
    console.log(`     音标: ${ipa} | ${note}`);
    console.log('');
  });
  
  console.log('=' .repeat(60));
  console.log(`📊 v2.7音素对齐测试结果: ${passCount}/${totalCount} 通过 (${Math.round(passCount/totalCount*100)}%)`);
  
  if (passCount === totalCount) {
    console.log('🎉 所有测试通过！v2.7拆分规则运行正常，起始组合保护和digraph独立性成功！');
  } else {
    console.log('⚠️ 部分测试未通过，请检查v2.7音素对齐逻辑。');
    console.log('📋 建议查看Oxford_Phonics_Split_Rules_v2.7.md了解详细规则');
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