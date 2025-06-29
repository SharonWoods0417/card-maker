import React, { useState } from 'react';
import { RotateCcw, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { WordCard } from '../types';
import { formatWordForStorage } from '../utils/dictionary';

interface CardPreviewProps {
  words: WordCard[];
  showDebugControls?: boolean;
}

const CardPreview: React.FC<CardPreviewProps> = ({ words, showDebugControls = false }) => {
  const [showBack, setShowBack] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [flippingCard, setFlippingCard] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(showDebugControls); // 根据环境变量控制调试模式
  
  const cardsPerPage = 4;
  const totalPages = Math.ceil(words.length / cardsPerPage);
  const currentCards = words.slice(currentPage * cardsPerPage, (currentPage + 1) * cardsPerPage);



  // 生成词性标注的完整释义
  const generateMeaningWithPartOfSpeech = (word: string, meaning: string): string => {
    // 如果释义已经包含词性标注，直接返回
    if (/^(n\.|adj\.|v\.|adv\.|prep\.|conj\.|pron\.|art\.|interj\.)\s/.test(meaning)) {
      return meaning;
    }
    
    // 基于单词特征的智能词性推断
    const inferPartOfSpeech = (word: string): string => {
      const lowerWord = word.toLowerCase();
      
      // 动词特征
      if (lowerWord.endsWith('ing') && lowerWord.length > 4) return 'v.';
      if (lowerWord.endsWith('ed') && lowerWord.length > 3) return 'v.';
      if (['run', 'walk', 'eat', 'drink', 'play', 'study', 'read', 'write', 'sing', 'dance'].includes(lowerWord)) return 'v.';
      
      // 形容词特征
      if (lowerWord.endsWith('ful') || lowerWord.endsWith('less') || lowerWord.endsWith('ous')) return 'adj.';
      if (['beautiful', 'happy', 'big', 'small', 'good', 'bad', 'nice', 'kind', 'smart'].includes(lowerWord)) return 'adj.';
      
      // 副词特征
      if (lowerWord.endsWith('ly') && lowerWord.length > 3) return 'adv.';
      
      // 默认为名词
      return 'n.';
    };
    
    const partOfSpeech = inferPartOfSpeech(word);
    return `${partOfSpeech} ${meaning}`;
  };

  // 渲染自然拼读色块 - 使用WordCard中的phonics数据
  const renderPhonicsBlocks = (phonics: string[]) => {
    if (!phonics || phonics.length === 0) {
      return null;
    }
    
    return phonics.map((syllable, index) => (
      <span key={index} className="phonics-block">
        {syllable}
      </span>
    ));
  };

  const handleSideToggle = (side: boolean) => {
    setFlippingCard('all');
    setTimeout(() => {
      setShowBack(side);
      setFlippingCard(null);
    }, 300);
  };

  if (words.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 card-title-decoration">卡片预览区</h2>
        <div className="flex items-center justify-center h-96 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-dashed border-blue-300">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
              <Sparkles className="h-10 w-10 text-blue-500" />
            </div>
            <p className="text-gray-700 text-xl font-bold mb-3 gradient-text">
              等待单词数据输入
            </p>
            <p className="text-gray-500 text-sm leading-relaxed max-w-md">
              请在左侧输入单词数据，这里将显示精美的2×2网格卡片预览
              <br />
              支持正反面切换，专业四线三格设计
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 card-title-decoration">
          卡片预览 ({words.length} 张卡片)
        </h2>
        
        <div className="flex items-center space-x-4">
          {/* 调试模式开关 - 只在开发环境显示 */}
          {showDebugControls && (
            <button
            onClick={() => setDebugMode(!debugMode)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
              debugMode 
                ? 'bg-red-500 text-white shadow-md' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {debugMode ? '关闭调试' : '开启调试'}
          </button>
          )}
          
          {/* 正反面切换按钮 */}
          <div className="flex items-center bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-1 shadow-inner">
            <button
              onClick={() => handleSideToggle(false)}
              className={`px-6 py-3 rounded-lg text-sm font-bold transition-all duration-300 ${
                !showBack 
                  ? 'bg-white text-blue-600 shadow-md transform scale-105' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              正面
            </button>
            <button
              onClick={() => handleSideToggle(true)}
              className={`px-6 py-3 rounded-lg text-sm font-bold transition-all duration-300 ${
                showBack 
                  ? 'bg-white text-blue-600 shadow-md transform scale-105' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              反面
            </button>
          </div>
        </div>
      </div>
      
      {/* 卡片网格 */}
      <div className={`grid grid-cols-2 gap-6 mb-8 ${debugMode ? 'debug-mode' : ''}`}>
        {currentCards.map((word) => (
          <div
            key={word.id}
            className={`word-card aspect-[85/135] ${flippingCard === 'all' ? 'card-flip' : ''}`}
          >
            {!showBack ? (
              // 正面：图片50% + 文字区域50%，上边距0px
              <div className="h-full flex flex-col">
                {/* 图片区域 - 占卡片50% */}
                <div className="card-image-container" style={{ height: '50%' }}>
                  <img
                    src={word.imageUrl}
                    alt={word.word}
                    className="card-image"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=300&h=200';
                    }}
                  />
                </div>
                
                {/* 文字信息区域 - 占卡片50%，上边距0px */}
                <div className="card-text-area" style={{ height: '50%', paddingTop: '0px' }}>
                  {/* 四线三格单词显示 */}
                  <div className="four-line-grid">
                    <div className="four-line-font four-line-font-md">
                      {formatWordForStorage(word.word)}
                    </div>
                  </div>
                  
                  {/* 音标 */}
                  <div className="phonetic-text">
                    {word.ipa}
                  </div>
                  
                  {/* 自然拼读彩色色块 */}
                  <div className="phonics-container">
                    {renderPhonicsBlocks(word.phonics || [])}
                  </div>
                </div>
              </div>
            ) : (
              // 反面：中文释义（含词性）+ 统一灰色例句容器
              <div className="card-back">
                <div className="meaning-text">
                  {generateMeaningWithPartOfSpeech(word.word, word.meaningCn)}
                </div>
                
                {word.sentenceEn && (
                  <div className="unified-sentence-container">
                    {/* 例句1 */}
                    <div className="sentence-item">
                      <div>
                        <span className="sentence-number">1.</span>
                        <span className="sentence-english">{word.sentenceEn}</span>
                      </div>
                      {word.sentenceCn && (
                        <div className="sentence-chinese">
                          {word.sentenceCn}
                        </div>
                      )}
                    </div>
                    
                    {/* 预留例句2和例句3的位置 */}
                    {/* 
                    <div className="sentence-item">
                      <div>
                        <span className="sentence-number">2.</span>
                        <span className="sentence-english">Second example sentence here.</span>
                      </div>
                      <div className="sentence-chinese">
                        第二个例句的中文翻译。
                      </div>
                    </div>
                    */}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        
        {/* 填充空白卡片 */}
        {currentCards.length < 4 && Array.from({ length: 4 - currentCards.length }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="empty-card aspect-[85/135]"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                <RotateCcw className="h-6 w-6 text-gray-400" />
              </div>
              <span>空白卡片</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* 分页控制 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="flex items-center px-6 py-3 text-sm font-bold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            上一页
          </button>
          
          <div className="flex items-center space-x-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`w-10 h-10 rounded-lg font-bold text-sm transition-all duration-200 ${
                  currentPage === index
                    ? 'bg-blue-600 text-white shadow-lg transform scale-110'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
            className="flex items-center px-6 py-3 text-sm font-bold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
          >
            下一页
            <ChevronRight className="h-5 w-5 ml-2" />
          </button>
        </div>
      )}
      
      {/* 调试信息面板 */}
      {debugMode && (
        <div className="bg-gray-900 text-white rounded-xl p-6 mb-6 font-mono text-sm">
          <h3 className="text-lg font-bold mb-4 text-yellow-400">🔧 背面排版调试信息</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-green-400 mb-2">✅ 背面新设计：</h4>
              <ul className="space-y-1">
                <li>• 中文释义：<span className="text-yellow-400">1.5rem</span> (含词性标注)</li>
                <li>• 统一灰色容器：<span className="text-gray-400">无阴影设计</span></li>
                <li>• 例句序号：<span className="text-cyan-400">1. 2. 3.</span> 标注</li>
                <li>• 文本对齐：<span className="text-green-400">左对齐</span> (不居中)</li>
                <li>• 容器颜色：<span className="text-purple-400">#f8fafc</span> 浅灰色</li>
                <li>• 边框颜色：<span className="text-orange-400">#d1d5db</span> 灰色</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-blue-400 mb-2">📝 例句格式示例：</h4>
              <div className="bg-gray-800 p-3 rounded text-xs">
                <div className="text-white mb-1">
                  <span className="text-gray-400">1.</span> I eat an apple every day.
                </div>
                <div className="text-gray-300 ml-4">
                  我每天吃一个苹果。
                </div>
              </div>
              <div className="mt-3 p-2 bg-blue-800 rounded text-xs">
                <p className="text-blue-200">💡 支持2-3个例句，序号自动标注</p>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-green-800 rounded">
            <p className="text-green-200">✅ 完成！统一灰色容器 + 序号标注 + 左对齐 + 无阴影</p>
          </div>
        </div>
      )}
      
      {/* 提示信息 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="text-white text-sm" />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-blue-900 text-sm font-bold mb-2">
              🎨 专业设计预览 {debugMode && '(调试模式已开启)'}
            </p>
            <div className="text-blue-800 text-xs space-y-1 leading-relaxed">
              <p>• <strong>正面设计</strong>：图片50% + 四线三格85%宽度 + 音标 + 20%透明度拼读色块</p>
              <p>• <strong>背面设计</strong>：1.5rem中文释义(含词性) + 统一灰色例句容器 + 序号标注</p>
              <p>• <strong>例句格式</strong>：左对齐，序号标注(1. 2. 3.)，无阴影设计</p>
              <p>• <strong>容器设计</strong>：浅灰色背景，灰色边框，支持多例句扩展</p>
              <p>• <strong>打印优化</strong>：2×2网格布局，A4纸张完美适配</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardPreview;