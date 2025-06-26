import React, { useState, useRef } from 'react';
import { Upload, Plus, Trash2, FileText, Sparkles } from 'lucide-react';
import { WordCard } from '../types';

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
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const newWords: WordCard[] = [];
        
        lines.forEach((line, index) => {
          if (index === 0 && line.toLowerCase().includes('word')) return; // Skip header
          const [word, ipa, meaningCn, sentenceEn, sentenceCn, imageUrl] = line.split(',').map(s => s.trim());
          if (word && ipa && meaningCn) {
            newWords.push({
              id: `csv-${index}`,
              word: formatWordForStorage(word),
              ipa,
              meaningCn,
              sentenceEn: sentenceEn || '',
              sentenceCn: sentenceCn || '',
              imageUrl: imageUrl || `https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=300&h=200`,
              phonics: generatePhonics(word)
            });
          }
        });
        
        onWordsChange(newWords);
      };
      reader.readAsText(file);
    }
  };

  // 格式化单词存储（除专有名词外都用小写）
  const formatWordForStorage = (word: string): string => {
    const properNouns = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
                        'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 
                        'September', 'October', 'November', 'December', 'China', 'America', 'English'];
    
    const capitalizedWord = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    
    if (properNouns.includes(capitalizedWord)) {
      return capitalizedWord;
    }
    
    return word.toLowerCase();
  };

  const generatePhonics = (word: string): string => {
    // 简单的拼读分块逻辑，实际应用中可以更复杂
    return word.split('').map((char, index) => 
      index % 2 === 0 ? `<span class="text-red-500">${char}</span>` : `<span class="text-blue-500">${char}</span>`
    ).join('');
  };

  // 生成默认的音标（简化版）
  const generateIPA = (word: string): string => {
    // 这里可以集成真实的音标生成逻辑，现在使用简化版
    const ipaMap: { [key: string]: string } = {
      'apple': '/ˈæpəl/',
      'book': '/bʊk/',
      'cat': '/kæt/',
      'dog': '/dɔːɡ/',
      'elephant': '/ˈeləfənt/',
      'flower': '/ˈflaʊər/',
      'house': '/haʊs/',
      'sun': '/sʌn/',
      'tree': '/triː/',
      'water': '/ˈwɔːtər/',
      'bird': '/bɜːrd/',
      'fish': '/fɪʃ/',
      'car': '/kɑːr/',
      'ball': '/bɔːl/',
      'pen': '/pen/',
      'monday': '/ˈmʌndeɪ/',
      'tuesday': '/ˈtuːzdeɪ/',
      'wednesday': '/ˈwenzdeɪ/',
      'thursday': '/ˈθɜːrzdeɪ/',
      'friday': '/ˈfraɪdeɪ/',
      'saturday': '/ˈsætərdeɪ/',
      'sunday': '/ˈsʌndeɪ/',
      'beautiful': '/ˈbjuːtɪfəl/',
      'happy': '/ˈhæpi/',
      'big': '/bɪɡ/',
      'small': '/smɔːl/',
      'good': '/ɡʊd/',
      'bad': '/bæd/',
      'run': '/rʌn/',
      'walk': '/wɔːk/',
      'eat': '/iːt/',
      'drink': '/drɪŋk/',
      'play': '/pleɪ/',
      'study': '/ˈstʌdi/',
    };
    
    return ipaMap[word.toLowerCase()] || `/${word}/`;
  };

  // 生成默认的中文释义（简化版）
  const generateMeaning = (word: string): string => {
    const meaningMap: { [key: string]: string } = {
      'apple': '苹果',
      'book': '书本',
      'cat': '猫',
      'dog': '狗',
      'elephant': '大象',
      'flower': '花朵',
      'house': '房子',
      'sun': '太阳',
      'tree': '树',
      'water': '水',
      'bird': '鸟',
      'fish': '鱼',
      'car': '汽车',
      'ball': '球',
      'pen': '钢笔',
      'monday': '星期一',
      'tuesday': '星期二',
      'wednesday': '星期三',
      'thursday': '星期四',
      'friday': '星期五',
      'saturday': '星期六',
      'sunday': '星期日',
      'beautiful': '漂亮的',
      'happy': '快乐的',
      'big': '大的',
      'small': '小的',
      'good': '好的',
      'bad': '坏的',
      'run': '跑步',
      'walk': '走路',
      'eat': '吃',
      'drink': '喝',
      'play': '玩耍',
      'study': '学习',
    };
    
    return meaningMap[word.toLowerCase()] || word;
  };

  // 生成默认的例句
  const generateSentence = (word: string): { en: string; cn: string } => {
    const sentenceMap: { [key: string]: { en: string; cn: string } } = {
      'apple': { en: 'I eat an apple every day.', cn: '我每天吃一个苹果。' },
      'book': { en: 'This is a very interesting book.', cn: '这是一本非常有趣的书。' },
      'cat': { en: 'The cat is sleeping on the sofa.', cn: '猫正在沙发上睡觉。' },
      'dog': { en: 'My dog likes to play in the park.', cn: '我的狗喜欢在公园里玩耍。' },
      'elephant': { en: 'The elephant is the largest land animal.', cn: '大象是最大的陆地动物。' },
      'flower': { en: 'She gave me a beautiful flower.', cn: '她给了我一朵美丽的花。' },
      'house': { en: 'We live in a big house.', cn: '我们住在一个大房子里。' },
      'sun': { en: 'The sun is shining brightly today.', cn: '今天阳光明媚。' },
      'monday': { en: 'Today is Monday.', cn: '今天是星期一。' },
      'tuesday': { en: 'I have English class on Tuesday.', cn: '我星期二有英语课。' },
      'beautiful': { en: 'She is a beautiful girl.', cn: '她是一个漂亮的女孩。' },
      'happy': { en: 'I am very happy today.', cn: '我今天很快乐。' },
      'big': { en: 'This is a big house.', cn: '这是一个大房子。' },
      'small': { en: 'The mouse is very small.', cn: '老鼠很小。' },
      'run': { en: 'I like to run in the morning.', cn: '我喜欢早上跑步。' },
      'play': { en: 'Children love to play games.', cn: '孩子们喜欢玩游戏。' },
    };
    
    const defaultSentence = sentenceMap[word.toLowerCase()];
    return defaultSentence || { 
      en: `This is a ${word}.`, 
      cn: `这是一个${generateMeaning(word)}。` 
    };
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

  const applyManualWords = () => {
    const validWords = manualWords
      .filter(w => w.trim())
      .map((word, index) => {
        const formattedWord = formatWordForStorage(word.trim());
        const sentence = generateSentence(formattedWord);
        
        return {
          id: `manual-${index}`,
          word: formattedWord,
          ipa: generateIPA(formattedWord),
          meaningCn: generateMeaning(formattedWord),
          sentenceEn: sentence.en,
          sentenceCn: sentence.cn,
          imageUrl: generateImageUrl(formattedWord),
          phonics: generatePhonics(formattedWord)
        };
      });
    
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
              格式：word, ipa, meaningCn, sentenceEn, sentenceCn, imageUrl
            </p>
            <p className="text-xs text-blue-600 bg-blue-100 inline-block px-3 py-1 rounded-full">
              支持Excel另存为CSV格式
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
              💡 简化输入模式
            </p>
            <p className="text-green-700 text-xs">
              只需输入英文单词，系统将自动生成音标、中文释义（含词性标注）、例句和配图。单词将显示在专业的四线三格中，专有名词首字母大写，其他单词全小写。
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
            生成单词卡片
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