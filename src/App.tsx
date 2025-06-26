import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import InputSection from './components/InputSection';
import CardPreview from './components/CardPreview';
import ExportSection from './components/ExportSection';
import { WordCard } from './types';
import { generateSampleWords } from './utils/sampleData';

function App() {
  const [words, setWords] = useState<WordCard[]>([]);

  // 默认加载示例数据
  useEffect(() => {
    const sampleWords = generateSampleWords();
    setWords(sampleWords);
  }, []);

  const handleGenerateSample = () => {
    const sampleWords = generateSampleWords();
    setWords(sampleWords);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左栏：输入区域 */}
          <div className="space-y-6">
            <InputSection
              words={words}
              onWordsChange={setWords}
              onGenerateSample={handleGenerateSample}
            />
          </div>
          
          {/* 右栏：预览和导出区域 */}
          <div className="space-y-6">
            <CardPreview words={words} />
          </div>
        </div>
        
        {/* 底部导出区域 */}
        <div className="mt-8">
          <ExportSection words={words} />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600 font-medium mb-2">
              英语单词卡片生成器
            </p>
            <p className="text-sm text-gray-500">
              为中国小学生定制的学习工具 - 快速生成可打印的双面单词卡片
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;