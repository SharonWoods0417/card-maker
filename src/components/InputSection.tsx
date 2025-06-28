import React, { useState, useRef } from 'react';
import { Upload, Plus, Trash2, FileText, Sparkles } from 'lucide-react';
import { WordCard } from '../types';
import { getWordEntry, formatWordForStorage } from '../utils/dictionary';

interface InputSectionProps {
  words: WordCard[];
  onWordsChange: (words: WordCard[]) => void;
  onGenerateSample: () => void;
}

const InputSection: React.FC<InputSectionProps> = ({ words, onWordsChange, onGenerateSample }) => {
  const [manualWords, setManualWords] = useState<string[]>(['', '', '']);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const newWords: WordCard[] = [];
        
        for (let index = 0; index < lines.length; index++) {
          const line = lines[index];
          if (index === 0 && line.toLowerCase().includes('word')) continue; // Skip header
          
          const [word, ipa, meaningCn, sentenceEn, sentenceCn, imageUrl] = line.split(',').map(s => s.trim());
          if (word) {
            const formattedWord = formatWordForStorage(word);
            
                         // 使用新的词典工具自动补全
             const completedEntry = await getWordEntry(formattedWord);
             
             if (completedEntry) {
               newWords.push({
                 id: `csv-${index}`,
                 word: completedEntry.word,
                 ipa: completedEntry.ipa || ipa,
                 meaningCn: completedEntry.meaningCn || meaningCn || formattedWord,
                 sentenceEn: completedEntry.sentenceEn || sentenceEn,
                 sentenceCn: completedEntry.sentenceCn || sentenceCn,
                 imageUrl: completedEntry.imageUrl || imageUrl || `https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=300&h=200`,
                 phonics: completedEntry.phonics
               });
             } else {
               // 降级方案：如果无法获取数据，使用CSV中的数据或默认值
               newWords.push({
                 id: `csv-${index}`,
                 word: formattedWord,
                 ipa: ipa || `/${formattedWord}/`,
                 meaningCn: meaningCn || formattedWord,
                 sentenceEn: sentenceEn || `This is ${formattedWord}.`,
                 sentenceCn: sentenceCn || `这是 ${formattedWord}。`,
                 imageUrl: imageUrl || generateImageUrl(formattedWord),
                 phonics: [] // 如果无法获取，设为空数组
               });
             }
          }
        }
        
        onWordsChange(newWords);
      };
      reader.readAsText(file);
    }
  };

  // 生成默认图片URL
  const generateImageUrl = (word: string): string => {
    const imageMap: { [key: string]: string } = {
      'apple': 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      'book': 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      'cat': 'https://images.pexels.com/photos/104827/cat-pet-animal-domestic-104827.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      'dog': 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      'elephant': 'https://images.pexels.com/photos/66898/elephant-cub-tsavo-kenya-66898.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      'flower': 'https://images.pexels.com/photos/56866/garden-rose-red-pink-56866.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      'house': 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      'sun': 'https://images.pexels.com/photos/301599/pexels-photo-301599.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      'beautiful': 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      'happy': 'https://images.pexels.com/photos/1557843/pexels-photo-1557843.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      'big': 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      'small': 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      'run': 'https://images.pexels.com/photos/2402777/pexels-photo-2402777.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      'play': 'https://images.pexels.com/photos/296301/pexels-photo-296301.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
    };
    
    return imageMap[word.toLowerCase()] || 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=300&h=200';
  };

  const addManualWord = () => {
    setManualWords([...manualWords, '']);
  };

  const removeManualWord = (index: number) => {
    if (manualWords.length > 3) {
      const updated = manualWords.filter((_, i) => i !== index);
      setManualWords(updated);
    }
  };

  const updateManualWord = (index: number, value: string) => {
    const updated = [...manualWords];
    updated[index] = value;
    setManualWords(updated);
  };

  const applyManualWords = async () => {
    const validWords = await Promise.all(
      manualWords
        .filter(w => w.trim())
        .map(async (word, index) => {
          const formattedWord = formatWordForStorage(word.trim());
          
                     // 使用新的词典工具自动补全所有字段
           const completedEntry = await getWordEntry(formattedWord);
           
           if (completedEntry) {
             return {
               id: `manual-${index}`,
               word: completedEntry.word,
               ipa: completedEntry.ipa,
               meaningCn: completedEntry.meaningCn,
               sentenceEn: completedEntry.sentenceEn,
               sentenceCn: completedEntry.sentenceCn,
               imageUrl: completedEntry.imageUrl || generateImageUrl(formattedWord),
               phonics: completedEntry.phonics
             };
           } else {
             // 降级方案：如果无法获取数据，返回基本信息
             return {
               id: `manual-${index}`,
               word: formattedWord,
               ipa: `/${formattedWord}/`,
               meaningCn: formattedWord,
               sentenceEn: `This is ${formattedWord}.`,
               sentenceCn: `这是 ${formattedWord}。`,
               imageUrl: generateImageUrl(formattedWord),
               phonics: []
             };
           }
        })
    );
    
    onWordsChange(validWords);
  };

  return (
    <div className="space-y-6">
      {/* CSV上传区域 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <FileText className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">方式一：上传CSV文件</h3>
        </div>
        
        <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-blue-50/50 hover:bg-blue-50 transition-colors">
          <Upload className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <div className="space-y-2">
            <p className="text-gray-700 font-medium">
              点击上传或拖拽CSV文件到此处
            </p>
            <p className="text-sm text-gray-500">
              格式：word, ipa, meaningCn, sentenceEn, sentenceCn, imageUrl（除word外都可选）
            </p>
            <p className="text-xs text-blue-600 bg-blue-100 inline-block px-3 py-1 rounded-full">
              支持Excel另存为CSV格式 | 自动补全缺失字段
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            选择CSV文件
          </button>
        </div>
      </div>

      {/* 手动输入区域 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Plus className="h-6 w-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">方式二：手动输入单词</h3>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onGenerateSample}
              className="flex items-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              生成示例数据
            </button>
            <button
              onClick={addManualWord}
              className="flex items-center text-green-600 hover:text-green-700 border border-green-600 hover:border-green-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4 mr-1" />
              添加行
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* 说明文字 */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-green-800 text-sm font-medium mb-1">
              💡 智能输入模式 - 基于Oxford Phonics规则
            </p>
            <p className="text-green-700 text-xs">
              只需输入英文单词，系统将自动生成音标、中文释义（含词性标注）、例句和配图。拼读拆分采用专业Oxford Phonics规则，适合小学生学习。
            </p>
          </div>
          
          {/* 输入区域 */}
          <div className="space-y-3">
            {manualWords.map((word, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-bold">
                  {index + 1}
                </div>
                <input
                  type="text"
                  placeholder="输入英文单词，如：apple, beautiful, run"
                  value={word}
                  onChange={(e) => updateManualWord(index, e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                />
                {manualWords.length > 3 && (
                  <button
                    onClick={() => removeManualWord(index)}
                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-6">
          <button
            onClick={applyManualWords}
            className="w-full bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg"
          >
            智能生成单词卡片
          </button>
        </div>
      </div>

      {/* 状态提示 */}
      {words.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">{words.length}</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-green-800 font-medium">
                已成功生成 {words.length} 张单词卡片
              </p>
              <p className="text-green-600 text-sm">
                请在右侧预览区查看卡片效果，确认无误后可导出PDF
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputSection;