import React from 'react';
import { Download, FileText, Printer, AlertCircle } from 'lucide-react';
import { WordCard } from '../types';
// 引入PDF导出核心组件
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

interface ExportSectionProps {
  words: WordCard[];
}

const ExportSection: React.FC<ExportSectionProps> = ({ words }) => {
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
            
            {/* 真实PDF导出按钮 */}
            <PDFDownloadLink
              document={<WordCardsPDFDocument words={words} />}
              fileName={`英语单词卡片_${words.length}张_${new Date().getTime()}.pdf`}
              className="w-full block"
            >
              {({ loading }) => (
                <button
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-green-800 disabled:from-green-400 disabled:to-green-500 transition-all duration-200 text-lg font-bold flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl"
                >
                  <Download className="h-6 w-6" />
                  <span>
                    {loading ? '正在生成PDF文件...' : '下载PDF文件'}
                  </span>
                </button>
              )}
            </PDFDownloadLink>
            
            {/* 使用说明 */}
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h4 className="font-medium text-gray-900 mb-2 text-sm">📐 标准卡片规格：</h4>
              <ul className="text-xs text-gray-600 space-y-1 mb-3">
                <li>• 卡片尺寸：85×135毫米（标准名片大小）</li>
                <li>• 每页4张卡片，A4纸张2×2布局</li>
                <li>• 卡片比例：0.63（网页预览已同步此比例）</li>
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

// 注册AU School字体，确保PDF导出使用同一手写体
Font.register({
  family: 'AU School Handwriting Fonts',
  src: '/fonts/AU-School-Handwriting-Fonts.ttf',
});

// PDF样式定义 - 精确匹配85×135mm卡片尺寸
const pdfStyles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: '15mm', // A4纸张边距
    backgroundColor: '#ffffff',
  },
  card: {
    width: '85mm',      // 标准卡片宽度
    height: '135mm',    // 标准卡片高度
    margin: '5mm',      // 卡片间距
    border: '1pt solid #e5e7eb',
    borderRadius: '4mm',
    backgroundColor: '#fff',
    padding: '3mm',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  // 图片区域 - 占卡片高度的50%
  imageContainer: {
    width: '100%',
    height: '60mm', // 135mm的约45%
    marginBottom: '2mm',
    borderRadius: '2mm',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  // 文字区域 - 占卡片高度的50%
  textContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  word: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'AU School Handwriting Fonts',
    color: '#2563eb',
    marginBottom: '1mm',
    textAlign: 'center',
  },
  ipa: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: '1mm',
    textAlign: 'center',
  },
  phonicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: '2mm',
  },
  phonicsBlock: {
    backgroundColor: '#dbeafe',
    color: '#1e293b',
    borderRadius: '2mm',
    paddingHorizontal: '2mm',
    paddingVertical: '0.5mm',
    fontSize: 10,
    marginRight: '1mm',
    marginBottom: '0.5mm',
  },
  meaning: {
    fontSize: 14,
    color: '#334155',
    marginBottom: '2mm',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  sentenceContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: '2mm',
    padding: '2mm',
    flex: 1,
  },
  sentence: {
    fontSize: 9,
    color: '#475569',
    marginBottom: '1mm',
    lineHeight: 1.3,
  },
});

// PDF文档组件 - 标准85×135mm卡片
const WordCardsPDFDocument: React.FC<{ words: WordCard[] }> = ({ words }) => {
  // 每页4张卡片（A4纸张2×2布局）
  const cardsPerPage = 4;
  const pages = [];
  
  for (let i = 0; i < words.length; i += cardsPerPage) {
    const pageWords = words.slice(i, i + cardsPerPage);
    pages.push(
      <Page size="A4" style={pdfStyles.page} key={i}>
        {pageWords.map((word) => (
          <View style={pdfStyles.card} key={word.id}>
            {/* 图片区域 */}
            <View style={pdfStyles.imageContainer}>
              {word.imageUrl && (
                <Image src={word.imageUrl} style={pdfStyles.image} />
              )}
            </View>
            
            {/* 文字区域 */}
            <View style={pdfStyles.textContainer}>
              {/* 单词 */}
              <Text style={pdfStyles.word}>{word.word}</Text>
              
              {/* 音标 */}
              {word.ipa && <Text style={pdfStyles.ipa}>{word.ipa}</Text>}
              
              {/* 拼读色块 */}
              {word.phonics && word.phonics.length > 0 && (
                <View style={pdfStyles.phonicsContainer}>
                  {word.phonics.map((syllable, idx) => (
                    <Text style={pdfStyles.phonicsBlock} key={idx}>{syllable}</Text>
                  ))}
                </View>
              )}
              
              {/* 中文释义 */}
              <Text style={pdfStyles.meaning}>{word.meaningCn}</Text>
              
              {/* 例句区域 */}
              <View style={pdfStyles.sentenceContainer}>
                {word.sentenceEn && (
                  <Text style={pdfStyles.sentence}>{word.sentenceEn}</Text>
                )}
                {word.sentenceCn && (
                  <Text style={pdfStyles.sentence}>{word.sentenceCn}</Text>
                )}
              </View>
            </View>
          </View>
        ))}
      </Page>
    );
  }
  
  return <Document>{pages}</Document>;
};

export default ExportSection;