import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, FileArchive, Sparkles, AlertCircle, Download } from 'lucide-react';
import JSZip from 'jszip';
import Papa from 'papaparse';
import { WordCard } from '../types';
import { splitSyllables } from '../utils/dictionary';

interface CsvRow {
  word: string;
  ipa?: string;
  meaningCn?: string;
  sentenceEn?: string;
  sentenceCn?: string;
  image?: string; // 图片文件名
  [key: string]: string | undefined;
}

interface AdvancedImportSectionProps {
  onAddCards: (cards: WordCard[]) => void;
}

const AdvancedImportSection: React.FC<AdvancedImportSectionProps> = ({ onAddCards }) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!csvFile || !zipFile) {
      setError('请确保已同时上传CSV和ZIP文件。');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // 1. Read ZIP file and create an image map
      const zip = await JSZip.loadAsync(zipFile);
      const imageMap: { [key: string]: string } = {};
      for (const fileName in zip.files) {
        if (!zip.files[fileName].dir) {
          const fileData = await zip.files[fileName].async('blob');
          imageMap[fileName] = URL.createObjectURL(fileData);
        }
      }

      // 2. Read and parse CSV file
      const csvText = await csvFile.text();
      const parsed = await new Promise<Papa.ParseResult<CsvRow>>((resolve, reject) => {
        Papa.parse<CsvRow>(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: results => resolve(results),
          error: err => reject(err),
        });
      });
      
      if (parsed.errors.length) {
        throw new Error(`CSV解析错误: ${parsed.errors.map(e => e.message).join(', ')}`);
      }
      
      if (!parsed.meta.fields?.includes('word')) {
        throw new Error('CSV文件必须包含一个名为 "word" 的列。');
      }
      
      // 3. Create word cards by combining CSV data and images
      const newCards = parsed.data.map((row, index): WordCard => {
        const word = row.word.trim();
        const imageUrl = row.image && imageMap[row.image] ? imageMap[row.image] : undefined;

        return {
          id: `${word}-${index}-${Date.now()}`,
          word: word,
          ipa: row.ipa || `/${word}/`,
          meaningCn: row.meaningCn || '无释义',
          sentenceEn: row.sentenceEn || '无例句。',
          sentenceCn: row.sentenceCn || '无例句翻译。',
          phonics: splitSyllables(word), // 使用现有音节拆分逻辑
          imageUrl: imageUrl,
          source: 'csv',
        };
      });

      onAddCards(newCards);
      
      // Clear inputs on success
      setCsvFile(null);
      setZipFile(null);
      if(csvInputRef.current) csvInputRef.current.value = '';
      if(zipInputRef.current) zipInputRef.current.value = '';

    } catch (err: any) {
      const message = err instanceof Error ? err.message : '发生未知错误';
      console.error("高级导入失败:", message);
      setError(`生成失败: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ['word', 'ipa', 'meaningCn', 'sentenceEn', 'sentenceCn', 'image'];
    const sampleData = ['apple', '/ˈæp.əl/', '苹果', 'An apple a day keeps the doctor away.', '一天一苹果，医生远离我。', 'apple.jpg'];
    const csvContent = [headers.join(','), sampleData.join(',')].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'word_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="text-center mb-4">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <UploadCloud className="h-8 w-8 text-purple-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">高级导入 (CSV + ZIP)</h2>
        <p className="text-sm text-gray-500 mt-1">
          上传包含完整信息的CSV文件和包含所有配图的ZIP包。
        </p>
      </div>

      <div className="space-y-4">
        {/* CSV Upload */}
        <div 
          onClick={() => csvInputRef.current?.click()}
          className="w-full p-4 border-2 border-dashed rounded-lg flex items-center space-x-3 cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <FileText className="h-8 w-8 text-gray-400" />
          <div className="flex-1">
            <p className="font-semibold text-gray-700">第一步: 上传CSV文件</p>
            <p className="text-xs text-gray-500">
              {csvFile ? `已选择: ${csvFile.name}` : '必须包含 "word", "image" (可选) 等列'}
            </p>
          </div>
        </div>
        <input type="file" accept=".csv" ref={csvInputRef} onChange={e => setCsvFile(e.target.files?.[0] || null)} className="hidden" />

        {/* ZIP Upload */}
        <div 
          onClick={() => zipInputRef.current?.click()}
          className="w-full p-4 border-2 border-dashed rounded-lg flex items-center space-x-3 cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <FileArchive className="h-8 w-8 text-gray-400" />
          <div className="flex-1">
            <p className="font-semibold text-gray-700">第二步: 上传ZIP图片包</p>
            <p className="text-xs text-gray-500">
              {zipFile ? `已选择: ${zipFile.name}` : '图片文件名需与CSV中的 "image" 列对应'}
            </p>
          </div>
        </div>
        <input type="file" accept=".zip,.ZIP" ref={zipInputRef} onChange={e => setZipFile(e.target.files?.[0] || null)} className="hidden" />
      </div>

      {error && (
        <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      <div className="text-center mt-4 mb-2">
        <button onClick={handleDownloadTemplate} className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center space-x-1">
          <Download size={14} />
          <span>下载CSV模板</span>
        </button>
      </div>

      <div className="mt-6">
        <button 
          onClick={handleGenerate} 
          disabled={!csvFile || !zipFile || isGenerating}
          className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 disabled:bg-purple-300 transition-colors flex items-center justify-center"
        >
          {isGenerating ? (
            <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> 正在处理...</>
          ) : (
            <><Sparkles className="mr-2 h-5 w-5" /> 开始生成卡片</>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdvancedImportSection; 