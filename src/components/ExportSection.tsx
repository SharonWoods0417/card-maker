import React, { useState } from 'react';
import { FileText, Printer, AlertCircle, ChevronLeft, ChevronRight, Eye, Image } from 'lucide-react';
import { WordCard } from '../types';
import A4PageRenderer from './A4PageRenderer';
import { exportA4PagesToZip, EXPORT_PRESETS, ExportProgress } from '../api/imageExport';

interface ExportSectionProps {
  words: WordCard[];
}

const ExportSection: React.FC<ExportSectionProps> = ({ words = [] }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  
  const FONT_STYLE_ID = 'embedded-handwriting-font-style';

  const embedFont = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      console.log('🔤 开始嵌入AU School Handwriting字体...');
      
      if (document.getElementById(FONT_STYLE_ID)) {
        console.log('✅ 字体样式已存在，跳过嵌入');
        return resolve();
      }
      
      console.log('📥 开始下载字体文件: /fonts/AU-School-Handwriting-Fonts.ttf');
      fetch('/fonts/AU-School-Handwriting-Fonts.ttf')
        .then(response => {
          console.log('📥 字体文件响应状态:', response.status, response.statusText);
          if (!response.ok) throw new Error(`Font fetch failed: ${response.statusText}`);
          return response.blob();
        })
        .then(blob => {
          console.log('📦 字体文件下载完成，大小:', Math.round(blob.size / 1024), 'KB');
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result;
            console.log('🔄 字体文件转换为Base64完成，长度:', typeof base64data === 'string' ? base64data.length : 'unknown');
            
            const style = document.createElement('style');
            style.id = FONT_STYLE_ID;
            style.textContent = `
              @font-face {
                font-family: "AU School Handwriting Fonts";
                font-display: swap;
                src: url(${base64data}) format("truetype");
              }
            `;
            document.head.appendChild(style);
            console.log('✅ 字体样式已注入到文档头部');
            console.log('📝 注入的CSS:', style.textContent.slice(0, 200) + '...');
            
            // 验证字体是否可用
            document.fonts.load('1em "AU School Handwriting Fonts"').then(() => {
              console.log('🎯 字体加载验证成功');
              
              // 额外验证：创建测试元素检查字体是否真的被使用
              const testElement = document.createElement('div');
              testElement.style.fontFamily = '"AU School Handwriting Fonts"';
              testElement.style.fontSize = '20px';
              testElement.textContent = 'test';
              testElement.style.position = 'absolute';
              testElement.style.left = '-9999px';
              document.body.appendChild(testElement);
              
              const computedStyle = window.getComputedStyle(testElement);
              const usedFont = computedStyle.fontFamily;
              console.log('🔍 实际使用的字体:', usedFont);
              
              document.body.removeChild(testElement);
              
              setTimeout(resolve, 100);
            }).catch((error) => {
              console.warn('⚠️ 字体加载验证失败:', error);
              setTimeout(resolve, 100); // 仍然继续，但记录警告
            });
          };
          reader.onerror = (error) => {
            console.error('❌ FileReader转换字体失败:', error);
            reject(error);
          };
          reader.readAsDataURL(blob);
        })
        .catch(error => {
          console.error('❌ 字体嵌入失败:', error);
          reject(error);
        });
    });
  };

  const totalPages = Math.ceil(words.length / 4);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  const handleExportCurrentPage = async () => {
    if (words.length === 0 || !showPreview) return;
    
    setIsExporting(true);
    setExportProgress({
      currentPage: 1,
      totalPages: 1,
      step: 'capturing',
      message: '正在截图当前页面...'
    });
    
    try {
      // 强制嵌入字体
      await embedFont();

      const pageElement = document.querySelector('[data-page-number]') as HTMLElement;
      if (!pageElement) {
        throw new Error('请先显示A4预览再导出');
      }
      
      // 调试：检查元素内容
      console.log('找到页面元素:', {
        element: pageElement,
        children: pageElement.children.length,
        innerText: pageElement.innerText.slice(0, 100),
        innerHTML: pageElement.innerHTML.slice(0, 200),
        classList: Array.from(pageElement.classList),
        offsetWidth: pageElement.offsetWidth,
        offsetHeight: pageElement.offsetHeight,
        scrollWidth: pageElement.scrollWidth,
        scrollHeight: pageElement.scrollHeight
      });
      
      await exportA4PagesToZip(
        [pageElement],
        {
          ...EXPORT_PRESETS.standard,
          fileNamePrefix: `word-cards-page-${currentPage + 1}`,
          includeTimestamp: true
        },
        (progress) => setExportProgress(progress)
      );
      
    } catch (error) {
      console.error('导出失败:', error);
      alert(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const handleExportAllPages = async () => {
    if (words.length === 0 || !showPreview) return;

    setIsExporting(true);
    setExportProgress(null);
    
    try {
      // 强制嵌入字体
      await embedFont();

      const pageElements: HTMLElement[] = [];
      const originalPage = currentPage;
      
      // 遍历所有页面并截图
      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        setExportProgress({
          currentPage: pageIndex + 1,
          totalPages,
          step: 'capturing',
          message: `正在准备第 ${pageIndex + 1} 页...`
        });
        
        // 切换到指定页面
        setCurrentPage(pageIndex);
        
        // 等待页面渲染
        await new Promise(resolve => setTimeout(resolve, 500));
      
        // 获取当前页面元素
        const pageElement = document.querySelector('[data-page-number]') as HTMLElement;
        if (pageElement) {
          // 克隆元素以避免DOM变化影响
          const clonedElement = pageElement.cloneNode(true) as HTMLElement;
          clonedElement.style.transform = 'none'; // 移除缩放
          clonedElement.style.margin = '0'; // 移除边距
          pageElements.push(clonedElement);
        }
      }
      
      // 恢复原始页面
      setCurrentPage(originalPage);
      
      if (pageElements.length === 0) {
        throw new Error('未能获取到页面元素');
      }
      
      // 导出为ZIP
      await exportA4PagesToZip(
        pageElements,
        EXPORT_PRESETS.standard,
        (progress) => setExportProgress(progress)
      );
      
    } catch (error) {
      console.error('导出失败:', error);
      alert(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-green-600" />
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-4">A4图片导出</h2>
        
        {words.length > 0 ? (
          <div className="space-y-6">
            {/* 切换预览模式按钮 */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center space-x-2 ${
                  showPreview 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Eye className="h-5 w-5" />
                <span>{showPreview ? '隐藏A4预览' : '显示A4预览'}</span>
              </button>
            </div>

            {/* A4页面预览区域 */}
            {showPreview && (
              <div className="bg-gray-100 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">A4页面预览</h3>
                  
                  {/* 正反面切换 */}
                  <div className="flex items-center bg-white rounded-lg p-1 shadow-sm">
                    <button
                      onClick={() => setShowBack(false)}
                      className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                        !showBack 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      正面
                    </button>
                    <button
                      onClick={() => setShowBack(true)}
                      className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                        showBack 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      反面
                    </button>
                  </div>
                </div>
                
                {/* A4导出说明 - 修正尺寸描述 */}
                <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-200">
                  <div className="flex items-center space-x-2 text-blue-800">
                    <Image className="h-4 w-4" />
                    <span className="text-sm font-medium">导出说明</span>
                  </div>
                  <p className="text-blue-700 text-xs mt-1">
                    ✅ 4张卡片将精确布局在A4页面上，保持标准间距<br/>
                    ✅ 导出的图片尺寸：1588×2246像素（A4分辨率×2倍清晰度）<br/>
                    ✅ 每张卡片尺寸：321×453像素（85×120mm标准卡片尺寸）
                  </p>
                  </div>

                  {/* 页面切换控制 */}
                  {totalPages > 1 && (
                  <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 0}
                        className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>上一页</span>
                      </button>
                      
                    <div className="text-sm text-gray-600" style={{ marginTop: '-8px' }}>
                        第 {currentPage + 1} 页，共 {totalPages} 页
                      </div>
                      
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages - 1}
                        className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>下一页</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                {/* A4页面渲染 - 100%显示 */}
                <div 
                  id="a4-preview-container" 
                  className="flex justify-center"
                  style={{
                    /* 100%显示，容器高度固定 */
                    height: '1173px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    paddingTop: '10px'
                  }}
                >
                  <div
                    id="a4-scale-wrapper"
                    style={{
                      /* 100%显示，无缩放 */
                      transform: 'scale(1.0)',
                      transformOrigin: 'top center',
                      /* 确保包装器不影响子元素的实际尺寸 */
                      width: '794px',
                      height: '1123px'
                    }}
                  >
                    <A4PageRenderer
                      cards={words}
                      pageIndex={currentPage}
                      showBack={showBack}
                      showGuideLines={false}
                      enablePrintMode={false}
                      className="preview-mode"
                      /* A4页面保持794x1123px原始尺寸用于截图 */
                    />
                  </div>
                </div>
              </div>
            )}
            
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
                  <span className="font-medium">页A4</span>
                </div>
              </div>
            </div>
            
            {/* 导出进度显示 */}
            {exportProgress && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-800 font-medium">{exportProgress.message}</span>
                  <span className="text-blue-600 text-sm">
                    {exportProgress.currentPage}/{exportProgress.totalPages}
              </span>
                  </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(exportProgress.currentPage / exportProgress.totalPages) * 100}%` 
                    }}
                  />
                </div>
              </div>
            )}

            {/* A4图片导出按钮组 */}
            <div className="space-y-3">
              {/* 调试按钮 */}
              <button
                onClick={() => {
                  const pageElement = document.querySelector('[data-page-number]') as HTMLElement;
                  if (pageElement) {
                    console.log('=== 调试信息 ===');
                    console.log('页面元素:', pageElement);
                    console.log('子元素数量:', pageElement.children.length);
                    console.log('内容预览:', pageElement.innerText.slice(0, 200));
                    console.log('样式类:', Array.from(pageElement.classList));
                    console.log('尺寸:', {
                      offsetWidth: pageElement.offsetWidth,
                      offsetHeight: pageElement.offsetHeight,
                      scrollWidth: pageElement.scrollWidth,
                      scrollHeight: pageElement.scrollHeight
                    });
                    alert('调试信息已输出到控制台，请按F12查看');
                  } else {
                    alert('未找到页面元素！请先显示A4预览。');
                  }
                }}
                className="w-full bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 text-sm"
              >
                🔍 调试页面元素
              </button>
              
              {/* 导出当前页面 */}
              <button
                onClick={handleExportCurrentPage}
                disabled={isExporting || !showPreview}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 text-base font-bold flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl"
              >
                <Image className="h-5 w-5" />
                <span>
                  {isExporting ? '正在导出...' : `下载当前页面 (第${currentPage + 1}页)`}
                </span>
              </button>
              
              {/* 导出所有页面 */}
              {totalPages > 1 && (
                <button
                  onClick={handleExportAllPages}
                  disabled={isExporting || !showPreview}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 text-base font-bold flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl"
                >
                  <FileText className="h-5 w-5" />
                  <span>
                    {isExporting ? '正在导出...' : `下载全部页面 (共${totalPages}页)`}
                  </span>
                </button>
              )}
            </div>
            
            {!showPreview && (
              <p className="text-gray-500 text-sm text-center">
                请先显示A4预览再导出图片
              </p>
            )}
            
            {/* 使用说明 */}
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h4 className="font-medium text-gray-900 mb-2 text-sm">📐 标准卡片规格：</h4>
              <ul className="text-xs text-gray-600 space-y-1 mb-3">
                <li>• 卡片尺寸：85×120毫米（标准名片大小）</li>
                <li>• 每页4张卡片，A4纸张2×2布局</li>
                                  <li>• 卡片比例：0.71（网页预览已同步此比例）</li>
              </ul>
              <h4 className="font-medium text-gray-900 mb-2 text-sm">🖨️ 打印说明：</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• 使用A4纸张，选择"实际大小"打印</li>
                <li>• 建议使用较厚的纸张（160g以上）</li>
                <li>• 打印后沿边框裁剪即可使用</li>
                <li>• 正反面内容都在同一页，单面打印即可</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
              <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-3" />
              <p className="text-orange-800 font-medium mb-2">
                请先输入并生成卡片再预览
              </p>
              <p className="text-orange-600 text-sm">
                在左侧输入单词数据，右侧预览确认后即可导出
              </p>
            </div>
            
            <button
              disabled
              className="w-full bg-gray-300 text-gray-500 px-8 py-4 rounded-xl text-lg font-bold cursor-not-allowed"
            >
              显示A4预览
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportSection;