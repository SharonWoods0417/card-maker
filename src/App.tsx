import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import InputSection from './components/InputSection';
import ExportSection from './components/ExportSection';
import APIUsageDisplay from './components/APIUsageDisplay';
import APITestSection from './components/APITestSection';
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

  // ========================================
  // 🔧 调试模式控制配置
  // ========================================
  // 注意：以下代码块用于控制调试功能的显示
  // ⚠️ 请勿删除或修改，除非明确需要禁用调试功能
  
  // 检查是否开启调试模式
  const isDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true';
  
  // 在开发环境中自动开启调试模式（兜底策略）
  const isDevelopment = import.meta.env.DEV;
  const showDebugControls = isDebugMode || isDevelopment;
  
  // 调试信息输出（仅在控制台，不影响用户界面）
  if (isDevelopment) {
    console.log('🔧 调试模式状态:', {
      VITE_DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE,
      isDebugMode,
      isDevelopment,
      showDebugControls
    });
  }
  // ========================================
  // 🔧 调试模式控制配置结束
  // ========================================

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ======================================== */}
        {/* 🔧 调试功能区域 - API使用统计 */}
        {/* ⚠️ 删除此区域将移除API统计监控功能 */}
        {/* ======================================== */}
        <div className="mb-6 space-y-4">
          <APITestSection />
          <APIUsageDisplay 
            className="w-full" 
            showControls={showDebugControls}
          />
        </div>
        {/* ======================================== */}
        {/* 🔧 调试功能区域结束 */}
        {/* ======================================== */}
        
        <div className="max-w-4xl mx-auto">
          {/* 输入区域 */}
          <div className="space-y-6">
            <InputSection
              words={words}
              onWordsChange={setWords}
              onGenerateSample={handleGenerateSample}
            />
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