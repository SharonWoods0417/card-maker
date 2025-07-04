import React, { useState, useRef } from 'react';
import { Upload, Plus, Trash2, FileText, Sparkles, Package } from 'lucide-react';
import Papa from 'papaparse';
import JSZip from 'jszip';
import { WordCard } from '../types';
import { getWordEntry, formatWordForStorage, splitPhonics } from '../utils/dictionary';

interface CsvData {
  word: string;
  ipa: string;
  meaningCn: string;
  sentenceEn: string;
  sentenceCn: string;
}

interface InputSectionProps {
  words: WordCard[];
  onWordsChange: (words: WordCard[]) => void;
  onGenerateSample: () => void;
}

const InputSection: React.FC<InputSectionProps> = ({ words, onWordsChange, onGenerateSample }) => {
  const [manualWords, setManualWords] = useState<string[]>(['', '', '']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 方案三：完整数据上传相关状态
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const zipFileInputRef = useRef<HTMLInputElement>(null);

  // 公共函数：创建WordCard条目
  const createWordCard = async (word: string, index: number, idPrefix: string, csvData?: {
    ipa?: string;
    meaningCn?: string;
    sentenceEn?: string;
    sentenceCn?: string;
    imageUrl?: string;
  }): Promise<WordCard> => {
    const formattedWord = formatWordForStorage(word);
    
    // 使用新的词典工具自动补全
    const completedEntry = await getWordEntry(formattedWord);
    
    if (completedEntry) {
      return {
        id: `${idPrefix}-${index}`,
        word: completedEntry.word,
        ipa: completedEntry.ipa || csvData?.ipa,
        meaningCn: completedEntry.meaningCn || csvData?.meaningCn || formattedWord,
        sentenceEn: completedEntry.sentenceEn || csvData?.sentenceEn,
        sentenceCn: completedEntry.sentenceCn || csvData?.sentenceCn,
        imageUrl: completedEntry.imageUrl || csvData?.imageUrl || generateImageUrl(formattedWord),
        phonics: completedEntry.phonics
      };
    } else {
      // 降级方案：如果无法获取数据，使用提供的数据或默认值
      return {
        id: `${idPrefix}-${index}`,
        word: formattedWord,
        ipa: csvData?.ipa || `/${formattedWord}/`,
        meaningCn: csvData?.meaningCn || formattedWord,
        sentenceEn: csvData?.sentenceEn || `This is ${formattedWord}.`,
        sentenceCn: csvData?.sentenceCn || `这是 ${formattedWord}。`,
        imageUrl: csvData?.imageUrl || generateImageUrl(formattedWord),
        phonics: [] // 如果无法获取，设为空数组
      };
    }
  };

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
            const wordCard = await createWordCard(word, index, 'csv', {
              ipa,
              meaningCn,
              sentenceEn,
              sentenceCn,
              imageUrl
            });
            newWords.push(wordCard);
          }
        }
        
        onWordsChange(newWords);
      };
      reader.readAsText(file);
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
        .map((word, index) => createWordCard(word.trim(), index, 'manual'))
    );
    
    onWordsChange(validWords);
  };

  // 方案三：处理完整数据上传
  const handleCompleteDataUpload = async () => {
    if (!csvFile) {
      alert('请先选择CSV文件');
      return;
    }

    try {
      // 1. 解析CSV文件
      const csvText = await readFileAsText(csvFile);
      const csvData = await parseCompleteCSV(csvText);

      // 2. 解析ZIP文件（如果有）
      let imageMap: { [key: string]: string } = {};
      if (zipFile) {
        imageMap = await parseZipFile(zipFile);
      }

      // 3. 创建WordCard数组
      const newWords: WordCard[] = csvData.map((data, index) => ({
        id: `complete-${index}`,
        word: data.word,
        ipa: data.ipa || `/${data.word}/`,
        meaningCn: data.meaningCn || data.word,
        sentenceEn: data.sentenceEn || `This is ${data.word}.`,
        sentenceCn: data.sentenceCn || `这是 ${data.word}。`,
        imageUrl: imageMap[data.word.toLowerCase()] || generateImageUrl(data.word),
        phonics: splitPhonics(data.word) // 🎯 自动生成phonics拼读拆分
      }));

      onWordsChange(newWords);
      alert(`成功导入 ${newWords.length} 个单词卡片`);
    } catch (error) {
      console.error('处理完整数据时出错:', error);
      alert('处理文件时出现错误，请检查文件格式');
    }
  };

  // 辅助函数：读取文件为文本
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // 解析完整CSV文件 - 使用 Papaparse
  const parseCompleteCSV = (csvText: string): Promise<CsvData[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse<CsvData>(csvText, {
        header: true, // 将第一行作为标题
        skipEmptyLines: true, // 跳过空行
        complete: (results) => {
          if (results.errors.length) {
            console.error("CSV parsing errors:", results.errors);
            const errorMessages = results.errors.map(e => e.message).join(', ');
            reject(new Error(`CSV文件解析失败: ${errorMessages}`));
          } else {
            resolve(results.data);
          }
        },
        error: (error: Error) => {
          console.error("Papaparse error:", error);
          reject(error);
        }
      });
    });
  };

  // 解析ZIP文件（需要JSZip库）
  const parseZipFile = async (file: File): Promise<{ [key:string]: string }> => {
    const zip = await JSZip.loadAsync(file);
    const imageMap: { [key: string]: string } = {};

    const imagePromises = Object.keys(zip.files).map(async (filename) => {
      const zipEntry = zip.files[filename];
      // 忽略文件夹和隐藏文件（如 __MACOSX）
      if (!zipEntry.dir && !filename.startsWith('__')) {
        // 假设都是图片文件，可以根据需要添加更严格的检查
        const imageBlob = await zipEntry.async('blob');
        const imageUrl = URL.createObjectURL(imageBlob);
        
        // 提取不带扩展名的文件名作为key，并转为小写以方便匹配
        const wordKey = filename.split('/').pop()?.split('.').shift()?.toLowerCase();
        
        if (wordKey) {
          imageMap[wordKey] = imageUrl;
        }
      }
    });

    await Promise.all(imagePromises);
    return imageMap;
  };

  // 下载CSV模板
  const downloadCSVTemplate = () => {
    // 创建模板数据（包含所有卡片字段，除了id和phonics）
    const templateHeader = 'word,ipa,meaningCn,sentenceEn,sentenceCn,imageUrl';
    const templateExample1 = 'apple,/ˈæp.əl/,n. 苹果,An apple a day keeps the doctor away.,一天一苹果，医生远离我。,';
    const templateExample2 = 'beautiful,/ˈbjuː.tɪ.fəl/,adj. 美丽的,She has a beautiful smile.,她有美丽的笑容。,';
    const templateExample3 = 'elephant,/ˈel.ɪ.fənt/,n. 大象,The elephant is very big.,大象非常大。,';
    const templateData = templateHeader + '\\n' + templateExample1 + '\\n' + templateExample2 + '\\n' + templateExample3;

    // 创建下载链接
    const blob = new Blob([templateData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'word_cards_template.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
      {/* CSV上传区域 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex-1">
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
          <p className="text-center text-xs text-gray-400 mt-4">已加载 {words.length} 个单词卡片</p>
      </div>

      {/* 手动输入区域 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex-1">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
              <Sparkles className="h-6 w-6 text-purple-600 mr-2" />
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
          <p className="text-center text-xs text-gray-400 mt-4">输入单词后点击"生成卡片"即可</p>
        </div>
      </div>

      {/* 方案三：完整数据上传 */}
      <div className="bg-gray-50 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-700 flex items-center">
          <Sparkles className="mr-3 text-yellow-500" />
          方法三：批量导入单词
        </h2>
        <p className="mb-4 text-gray-600">
          通过上传特定格式的CSV文件和包含图片素材的ZIP压缩包，一次性生成所有单词卡片。这是最高效的方式。
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* CSV 文件上传 */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <button
              onClick={() => csvFileInputRef.current?.click()}
              className="flex items-center justify-center w-full h-full text-blue-600 hover:text-blue-800 transition-colors"
            >
              <FileText className="mr-2" />
              <span>{csvFile ? '更换CSV文件' : '选择CSV文件'}</span>
            </button>
            <input
              type="file"
              accept=".csv"
              ref={csvFileInputRef}
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            {csvFile && (
              <div className="mt-2 text-sm text-gray-700 flex items-center justify-center">
                <span>{csvFile.name}</span>
                <Trash2 
                  className="ml-2 h-4 w-4 text-red-500 cursor-pointer hover:text-red-700"
                  onClick={() => setCsvFile(null)} 
                />
              </div>
            )}
          </div>

          {/* ZIP 文件上传 */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <button
              onClick={() => zipFileInputRef.current?.click()}
              className="flex items-center justify-center w-full h-full text-green-600 hover:text-green-800 transition-colors"
            >
              <Package className="mr-2" />
              <span>{zipFile ? '更换图片包(.zip)' : '选择图片包(.zip)'}</span>
            </button>
            <input
              type="file"
              accept=".zip"
              ref={zipFileInputRef}
              onChange={(e) => setZipFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            {zipFile && (
              <div className="mt-2 text-sm text-gray-700 flex items-center justify-center">
                <span>{zipFile.name}</span>
                <Trash2 
                  className="ml-2 h-4 w-4 text-red-500 cursor-pointer hover:text-red-700"
                  onClick={() => setZipFile(null)} 
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={downloadCSVTemplate}
            className="text-sm text-blue-600 hover:underline"
          >
            下载CSV模板文件
          </button>
          <button
            onClick={handleCompleteDataUpload}
            className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-all disabled:bg-gray-400"
            disabled={!csvFile}
          >
            开始导入
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputSection;