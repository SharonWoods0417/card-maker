import React from 'react';
import { WordCard } from '../types';
import { formatWordForStorage } from '../utils/dictionary';

interface SingleCardRendererProps {
  card: WordCard;
  showBack?: boolean;
  style?: React.CSSProperties;
  className?: string;
  printMode?: boolean;
}

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

const SingleCardRenderer: React.FC<SingleCardRendererProps> = ({
  card,
  showBack = false,
  style = {},
  className = '',
  printMode = false
}) => {
  return (
    <div
      className={`word-card aspect-[85/120] ${className} ${printMode ? 'print-mode' : ''}`}
      style={style}
    >
      {!showBack ? (
        // 正面：图片50% + 文字区域50%
        <div className="h-full flex flex-col">
          {/* 图片区域 - 占卡片50% */}
          <div className="card-image-container" style={{ height: '50%' }}>
            <img
              src={card.imageUrl}
              alt={card.word}
              className="card-image"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=300&h=200';
              }}
            />
          </div>
          
          {/* 文字信息区域 - 占卡片50% */}
          <div className="card-text-area" style={{ height: '50%' }}>
            {/* 四线三格单词显示 */}
            <div className="four-line-grid">
              <div className="four-line-font four-line-font-md">
                {formatWordForStorage(card.word)}
              </div>
            </div>
            
            {/* 音标 */}
            <div className="phonetic-text">
              {card.ipa}
            </div>
            
            {/* 自然拼读彩色色块 */}
            <div className="phonics-container">
              {card.phonics?.map((syllable, index) => (
                <span 
                  key={index} 
                  className="phonics-block"
                >
                  {syllable}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // 反面：中文释义（含词性）+ 统一灰色例句容器
        <div className="card-back">
          <div className="meaning-text">
            {generateMeaningWithPartOfSpeech(card.word, card.meaningCn)}
          </div>
          
          {card.sentenceEn && (
            <div className="unified-sentence-container">
              {/* 例句1 */}
              <div className="sentence-item">
                <div className="sentence-english-line">
                  <span className="sentence-number">1.</span>
                  <span className="sentence-english">
                    {card.sentenceEn}
                  </span>
                </div>
                <div className="sentence-chinese">
                  {card.sentenceCn}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SingleCardRenderer;