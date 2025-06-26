import React from 'react';
import { BookOpen, Upload, Eye, Download } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-10 w-10 mr-3" />
            <h1 className="text-4xl font-bold">
              英语单词卡片生成器
            </h1>
          </div>
          <p className="text-blue-100 text-lg">
            为中国小学生定制的学习工具 - 快速生成可打印的双面单词卡片
          </p>
        </div>
        
        {/* 操作流程指示 */}
        <div className="flex items-center justify-center space-x-8 bg-white/10 rounded-xl py-6 px-8 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-white text-blue-600 rounded-full font-bold text-lg mr-4">
              1
            </div>
            <div className="text-left">
              <div className="flex items-center mb-1">
                <Upload className="h-5 w-5 mr-2" />
                <span className="font-semibold">上传数据</span>
              </div>
              <p className="text-sm text-blue-100">CSV文件或手动输入</p>
            </div>
          </div>
          
          <div className="h-8 w-px bg-white/30"></div>
          
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-white text-blue-600 rounded-full font-bold text-lg mr-4">
              2
            </div>
            <div className="text-left">
              <div className="flex items-center mb-1">
                <Eye className="h-5 w-5 mr-2" />
                <span className="font-semibold">预览卡片</span>
              </div>
              <p className="text-sm text-blue-100">正反面效果预览</p>
            </div>
          </div>
          
          <div className="h-8 w-px bg-white/30"></div>
          
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-white text-blue-600 rounded-full font-bold text-lg mr-4">
              3
            </div>
            <div className="text-left">
              <div className="flex items-center mb-1">
                <Download className="h-5 w-5 mr-2" />
                <span className="font-semibold">导出PDF</span>
              </div>
              <p className="text-sm text-blue-100">A4格式可打印</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;