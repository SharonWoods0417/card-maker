import React, { useState } from 'react';
import { Download, FileText, Printer, AlertCircle } from 'lucide-react';
import { WordCard } from '../types';

interface ExportSectionProps {
  words: WordCard[];
}

const ExportSection: React.FC<ExportSectionProps> = ({ words }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (words.length === 0) {
      alert('请先输入单词数据再导出PDF');
      return;
    }

    setIsExporting(true);
    
    try {
      // 模拟PDF生成过程
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 实际应用中这里会调用PDF生成库
      const blob = new Blob(['PDF content would be here'], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `英语单词卡片_${words.length}张_${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert(`PDF导出成功！共生成${words.length}张双面卡片`);
    } catch {
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const totalPages = Math.ceil(words.length / 4);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-green-600" />
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-4">导出PDF文件</h2>
        
        {words.length > 0 ? (
          <div className="space-y-6">
            {/* 文件信息 */}
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-center space-x-2 text-green-800">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">A4页面</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-green-800">
                  <Printer className="h-4 w-4" />
                  <span className="font-medium">2×2布局</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-green-800">
                  <span className="font-bold text-lg">{words.length}</span>
                  <span className="font-medium">张卡片</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-green-800">
                  <span className="font-bold text-lg">{totalPages}</span>
                  <span className="font-medium">页PDF</span>
                </div>
              </div>
            </div>
            
            {/* 导出按钮 */}
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-green-800 disabled:from-green-400 disabled:to-green-500 transition-all duration-200 text-lg font-bold flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl"
            >
              <Download className="h-6 w-6" />
              <span>
                {isExporting ? '正在生成PDF文件...' : '下载PDF文件'}
              </span>
            </button>
            
            {/* 进度指示 */}
            {isExporting && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                  <div className="text-blue-800 text-sm">
                    <p className="font-medium">正在生成PDF文件...</p>
                    <p className="text-xs mt-1">包含{words.length}张双面卡片，请稍候</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* 使用说明 */}
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h4 className="font-medium text-gray-900 mb-2 text-sm">打印使用说明：</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• 使用A4纸张，选择"实际大小"打印</li>
                <li>• 建议使用较厚的纸张（160g以上）</li>
                <li>• 打印后沿虚线裁剪即可使用</li>
                <li>• 每页包含4张卡片的正面和反面</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
              <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-3" />
              <p className="text-orange-800 font-medium mb-2">
                请先输入并生成卡片再下载
              </p>
              <p className="text-orange-600 text-sm">
                在左侧输入单词数据，右侧预览确认后即可导出PDF
              </p>
            </div>
            
            <button
              disabled
              className="w-full bg-gray-300 text-gray-500 px-8 py-4 rounded-xl text-lg font-bold cursor-not-allowed"
            >
              下载PDF文件
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportSection;