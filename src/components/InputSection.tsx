import React, { useState, useRef } from 'react';
import { Upload, Trash2, Sparkles } from 'lucide-react';
import Papa from 'papaparse';
import { WordCard } from '../types';
import { getWordEntry, formatWordForStorage } from '../utils/dictionary';

// 异步创建单个卡片的辅助函数
const createWordCard = async (word: string, index: number, idPrefix: string): Promise<WordCard> => {
  const formattedWord = formatWordForStorage(word);
  // 调用核心函数获取单词数据
  const entry = await getWordEntry(formattedWord);
  
  // 确保返回的卡片对象包含所有必要的字段和回退值
  return {
    id: `${idPrefix}-${index}-${Date.now()}`,
    word: formattedWord,
    ipa: entry?.ipa || `/${formattedWord}/`,
    meaningCn: entry?.meaningCn || 'AI获取中...',
    sentenceEn: entry?.sentenceEn || '...',
    sentenceCn: entry?.sentenceCn || '...',
    phonics: entry?.phonics || '',
    imageUrl: entry?.imageUrl,
    source: entry?.source || 'user',
  };
};

// CSV 文件行数据结构
interface CsvData {
  word: string;
  [key: string]: string;
}

interface InputSectionProps {
  onAddCards: (cards: WordCard[]) => void;
  onClearCards: () => void;
}

export const InputSection: React.FC<InputSectionProps> = ({ onAddCards, onClearCards }) => {
  const [activeTab, setActiveTab] = useState('single'); // 'single', 'batch', 'csv'
  const [singleWord, setSingleWord] = useState('');
  const [batchWords, setBatchWords] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    let wordsToProcess: string[] = [];

    try {
      if (activeTab === 'single') {
        wordsToProcess = [singleWord.trim()].filter(Boolean);
      } else if (activeTab === 'batch') {
        wordsToProcess = batchWords.split(/[\n,]+/).map(w => w.trim()).filter(Boolean);
      } else if (activeTab === 'csv' && csvFile) {
        const csvText = await csvFile.text();
        const parsed = Papa.parse<CsvData>(csvText, { header: true, skipEmptyLines: true });
        if (parsed.errors.length) {
          throw new Error(parsed.errors.map(e => e.message).join(', '));
        }
        wordsToProcess = parsed.data.map(row => row.word?.trim()).filter(Boolean);
      }

      if (wordsToProcess.length === 0) {
        alert("请输入至少一个单词或选择一个有效的文件。");
        setIsGenerating(false);
        return;
      }

      const newCards = await Promise.all(
        wordsToProcess.map((word, index) => createWordCard(word, index, activeTab))
      );
      onAddCards(newCards);

      // 成功后清空输入
      setSingleWord('');
      setBatchWords('');
      setCsvFile(null);
      if (csvFileInputRef.current) {
        csvFileInputRef.current.value = '';
      }

    } catch (error) {
      console.error("生成卡片时出错:", error);
      alert(`生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 使用Canvas生成本地图片，避免跨域问题
  const generateWordImage = (word: string): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    canvas.width = 300;
    canvas.height = 200;

    // 生成基于单词的颜色
    const colors = [
      '#E3F2FD', '#F3E5F5', '#E8F5E8', '#FFF3E0', '#FCE4EC', 
      '#E0F2F1', '#F1F8E9', '#FFF8E1', '#FFEBEE', '#E8EAF6'
    ];
    
    const colorIndex = word.charCodeAt(0) % colors.length;
    const bgColor = colors[colorIndex];
    
    // 绘制背景
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 300, 200);

    // 绘制单词
    ctx.fillStyle = '#424242';
    ctx.font = 'bold 24px "Comic Sans MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(word.toUpperCase(), 150, 100);
    
    // 绘制装饰边框
    ctx.strokeStyle = '#9E9E9E';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 300, 200);
    
    return canvas.toDataURL('image/png');
  };

  // 生成默认图片URL - 优先使用Canvas生成的本地图片
  const generateImageUrl = (word: string): string => {
    // 先尝试使用Canvas生成的单色图片，避免跨域问题
    return generateWordImage(word);
    
    // 备用方案：外部图片（可能有跨域问题）
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex border-b border-gray-200 mb-4">
        <button onClick={() => setActiveTab('single')} className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'single' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-indigo-600'}`}>单个输入</button>
        <button onClick={() => setActiveTab('batch')} className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'batch' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-indigo-600'}`}>批量输入</button>
        <button onClick={() => setActiveTab('csv')} className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'csv' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-indigo-600'}`}>CSV导入</button>
      </div>

      <div className="min-h-[100px]">
        {activeTab === 'single' && (
          <input
            type="text"
            placeholder="输入单个单词，如: apple"
            value={singleWord}
            onChange={e => setSingleWord(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        )}
        {activeTab === 'batch' && (
          <textarea
            placeholder={"每行一个单词，或用逗号分隔:\napple\nbanana, orange"}
            value={batchWords}
            onChange={e => setBatchWords(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        )}
        {activeTab === 'csv' && (
          <div>
            <p className="text-sm text-gray-600 mb-2">请上传一个CSV文件，必须包含一个名为 "word" 的列。</p>
            <button onClick={() => csvFileInputRef.current?.click()} className="w-full text-center p-4 border-2 border-dashed rounded-lg hover:bg-gray-50 transition-colors">
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              {csvFile ? `已选择: ${csvFile.name}` : '点击选择CSV文件'}
            </button>
            <input type="file" accept=".csv" ref={csvFileInputRef} onChange={e => setCsvFile(e.target.files?.[0] || null)} className="hidden"/>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2 pt-4 mt-4 border-t border-gray-200">
        <button onClick={handleGenerate} disabled={isGenerating} className="flex-1 bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors flex items-center justify-center">
          {isGenerating ? (
            <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> 生成中...</>
          ) : (
            <><Sparkles className="mr-2 h-5 w-5" /> 生成卡片</>
          )}
        </button>
        <button onClick={onClearCards} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors" title="清空所有卡片">
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
};

export default InputSection;