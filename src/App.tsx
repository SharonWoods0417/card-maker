import React, { useState } from 'react';
import Header from './components/Header';
import InputSection from './components/InputSection';
import ExportSection from './components/ExportSection';
import APIUsageDisplay from './components/APIUsageDisplay';
import APITestSection from './components/APITestSection';
import { WordCard } from './types';
import AdvancedImportSection from './components/AdvancedImportSection';

function App() {
  const [wordCards, setWordCards] = useState<WordCard[]>([]);
  const [currentPage, setCurrentPage] = useState('main');

  const handleAddCards = (newCards: WordCard[]) => {
    setWordCards(prev => [...prev, ...newCards]);
  };

  const handleClearCards = () => {
    setWordCards([]);
  }

  // 导航切换
  if (currentPage === 'api-test') {
    return <APITestSection onBack={() => setCurrentPage('main')} />
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧输入区 */}
          <div className="lg:col-span-1 space-y-6">
            <InputSection onAddCards={handleAddCards} onClearCards={handleClearCards} />
            <APIUsageDisplay />
            <AdvancedImportSection onAddCards={handleAddCards} />
          </div>

          {/* 右侧功能区 */}
          <div className="lg:col-span-2 space-y-8">
            <ExportSection words={wordCards} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;