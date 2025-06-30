import React from 'react';
import { Download, FileText, Printer, AlertCircle } from 'lucide-react';
import { WordCard } from '../types';
// 引入PDF导出核心组件
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
// 引入音标图片生成工具
import { generateAllIpaImages } from '../utils/captureIpaImages';
// 引入字体样式类型
import type { FontStyle, FontWeight } from '@react-pdf/types';

interface ExportSectionProps {
  words: WordCard[];
}

// 简化的字体管理系统
let fontsRegistered = false;
let fontsInitializing = false; // 防止并发初始化
const fontFamilies = {
  handwriting: 'AU School Handwriting Fonts', // 更新默认值
  ipa: 'Doulos SIL',                          // 更新默认值  
  regular: 'Charis SIL Regular',              // 更新默认值
  bold: 'Charis SIL Bold',                    // 更新默认值
  chinese: 'Source Han Sans CN'               // 更新默认值
};

// 安全地注册字体，失败时使用降级字体
const initializeFonts = async (): Promise<void> => {
  if (fontsRegistered || fontsInitializing) return;
  
  fontsInitializing = true;
  console.log('🔄 开始注册PDF字体...');
  let hasError = false;

  const registerFont = (config: { family: string; src: string; fontWeight?: FontWeight; fontStyle?: FontStyle; }, familyKey: keyof typeof fontFamilies) => {
    try {
      Font.register(config);
      fontFamilies[familyKey] = config.family;
      console.log(`  ✅ 字体 '${config.family}' 注册成功`);
    } catch (e) {
      console.warn(`  ⚠️ 字体 '${config.family}' (${config.src}) 注册失败:`, e);
      hasError = true;
      // 保持降级字体名称不变
    }
  };

  registerFont({
    family: 'AU School Handwriting Fonts',
    src: '/fonts/AU-School-Handwriting-Fonts.ttf',
    fontWeight: 'bold',
  }, 'handwriting');

  registerFont({ family: 'Doulos SIL', src: '/fonts/DoulosSIL-Regular.ttf' }, 'ipa');
  
  registerFont({ family: 'Source Han Sans CN', src: '/fonts/Source Han Sans CN Regular.otf' }, 'chinese');
  
  registerFont({ family: 'Charis SIL Regular', src: '/fonts/CharisSIL-Regular.ttf' }, 'regular');

  registerFont({ family: 'Charis SIL Bold', src: '/fonts/CharisSIL-Bold.ttf' }, 'bold');

  fontsRegistered = true;
  fontsInitializing = false;
  
  if (hasError) {
    console.warn('⚠️ 字体初始化过程中部分字体注册失败，将使用降级字体。');
  } else {
    console.log('✅ 所有字体初始化完成:', fontFamilies);
  }
};

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
                  <span className="font-bold text-lg">{totalPages * 2}</span>
                  <span className="font-medium">页PDF(正反面)</span>
                </div>
              </div>
            </div>
            
            {/* 智能PDF导出按钮 */}
            <SmartPDFDownloadLink words={words} />
            
            {/* 使用说明 */}
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h4 className="font-medium text-gray-900 mb-2 text-sm">📐 标准卡片规格：</h4>
              <ul className="text-xs text-gray-600 space-y-1 mb-3">
                <li>• 卡片尺寸：85×135毫米（标准名片大小）</li>
                <li>• 每页4张卡片，A4纸张2×2布局</li>
                <li>• 卡片比例：0.63（网页预览已同步此比例）</li>
                <li>• 正面：图片+单词+音标+拼读</li>
                <li>• 背面：中文释义+例句</li>
              </ul>
              <h4 className="font-medium text-gray-900 mb-2 text-sm">🖨️ 打印说明：</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• 使用A4纸张，选择"实际大小"打印</li>
                <li>• 建议使用较厚的纸张（160g以上）</li>
                <li>• 先打印正面，翻面后打印背面</li>
                <li>• 打印后沿边框裁剪即可使用</li>
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

// 智能PDF下载组件
const SmartPDFDownloadLink: React.FC<{ words: WordCard[] }> = ({ words }) => {
  const [isReady, setIsReady] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [wordsWithImages, setWordsWithImages] = React.useState<WordCard[]>(() => words);
  const [isGeneratingImages, setIsGeneratingImages] = React.useState(false);

  React.useEffect(() => {
    const init = async () => {
      try {
        await initializeFonts();
        setIsReady(true);
      } catch (error) {
        console.error('字体初始化失败:', error);
        setHasError(true);
        setIsReady(true); // 仍然允许下载，使用降级字体
      }
    };

    init();
  }, []);

  // 同步words变化，使用浅比较避免不必要更新
  React.useEffect(() => {
    setWordsWithImages(prevWords => {
      // 如果数组长度或内容没有实际变化，保持原引用
      if (prevWords.length === words.length && 
          words.every((word, index) => prevWords[index] === word)) {
        return prevWords;
      }
      return words;
    });
  }, [words]);
  
  // 🔧 修复无限重新渲染：使用useMemo缓存PDF文档和文件名
  const pdfDocument = React.useMemo(() => {
    return <WordCardsPDFDocument words={wordsWithImages} />;
  }, [wordsWithImages]);
  
  const fileName = React.useMemo(() => {
    return `英语单词卡片_${words.length}张.pdf`;
  }, [words.length]); // 移除时间戳，避免无限变化

  // 优化音标图片统计，避免重复计算
  const imageStats = React.useMemo(() => {
    const generatedCount = wordsWithImages.filter(w => w.ipaImage).length;
    const hasAnyImages = generatedCount > 0;
    return { generatedCount, hasAnyImages };
  }, [wordsWithImages]);

  // 生成音标图片的处理函数
  const handleGenerateIpaImages = async () => {
    setIsGeneratingImages(true);
    try {
      console.log('🔄 开始生成音标图片...');
      // 等待页面渲染稳定
      await new Promise(resolve => setTimeout(resolve, 500));
      const wordsWithIpaImages = await generateAllIpaImages(words);
      setWordsWithImages(wordsWithIpaImages);
      console.log('✅ 音标图片生成完成');
    } catch (error) {
      console.error('❌ 音标图片生成失败:', error);
      setWordsWithImages(words); // 降级到原始数据
    } finally {
      setIsGeneratingImages(false);
    }
  };

  if (!isReady) {
    return (
      <button
        disabled
        className="w-full bg-gray-400 text-white px-8 py-4 rounded-xl text-lg font-bold cursor-not-allowed"
      >
        正在准备字体... 请稍候
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {hasError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">
            ⚠️ 部分字体加载失败，将使用默认字体确保PDF正常生成
          </p>
        </div>
      )}
      
      {/* 音标图片生成按钮 */}
      <div className="space-y-2">
        <button
          onClick={handleGenerateIpaImages}
          disabled={isGeneratingImages}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
        >
          <span>
            {isGeneratingImages ? '🔄 正在生成音标图片...' : '📷 生成音标图片（推荐）'}
          </span>
        </button>
        
        {imageStats.hasAnyImages && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2">
            <p className="text-green-800 text-sm text-center">
              ✅ 已生成 {imageStats.generatedCount}/{words.length} 个音标图片
            </p>
          </div>
        )}
      </div>
      
      {/* PDF下载按钮 */}
      <PDFDownloadLink
        document={pdfDocument}
        fileName={fileName}
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
    </div>
  );
};

// 调试模式开关
const DEBUG = false;

// PDF样式定义 - 使用稳定的字体系统
const pdfStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: '15mm',
    backgroundColor: '#f8fafc',
    height: '267mm',
    width: '180mm',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    width: '175mm',
    height: '245mm',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '5mm',
    border: DEBUG ? '1pt dashed #888' : undefined,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '5mm',
    border: DEBUG ? '1pt dashed #00bcd4' : undefined,
  },
  card: {
    width: '85mm',
    height: '120mm',
    border: DEBUG ? '1.5pt dashed #e53935' : '2pt solid #e2e8f0',
    borderRadius: '2mm',
    backgroundColor: '#fff',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',    // 添加卡片内容居中对齐
    position: 'relative',
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: '50%',  // 改为50%，与网页版一致
    backgroundColor: '#f1f5f9',
    borderRadius: undefined,
    border: DEBUG ? '1pt dashed #1976d2' : undefined,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',    // 添加自身居中对齐
    overflow: 'hidden',
    margin: 0,
    padding: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  textContainer: {
    height: '50%',
    padding: '1mm 5mm 5mm 5mm',  // 调整内边距，顶部1mm
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',    // 添加水平居中对齐
    textAlign: 'center',
    border: DEBUG ? '1pt dashed #43a047' : undefined,
  },
  fourLineGrid: {
    position: 'relative',
    width: '85%',           // 与网页版一致
    height: '22mm',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',    // 添加自身居中对齐
    marginBottom: '1mm',    // 添加下边距
  },
  fourLineBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fourLineLine1: {
    position: 'absolute',
    top: '20%',
    left: 0,
    right: 0,
    height: '0.3mm',
    backgroundColor: '#9ca3af',
  },
  fourLineLine2: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    height: '0.3mm',
    backgroundColor: '#9ca3af',
  },
  fourLineRedLine: {
    position: 'absolute',
    top: '60%',
    left: 0,
    right: 0,
    height: '0.4mm',
    backgroundColor: '#dc2626',
  },
  fourLineLine4: {
    position: 'absolute',
    top: '80%',
    left: 0,
    right: 0,
    height: '0.3mm',
    backgroundColor: '#9ca3af',
  },
  word: {
    fontSize: 36,                         // 增大字体，接近网页版2.5rem(40px)
    fontWeight: 'bold',
    fontFamily: fontFamilies.handwriting,
    color: '#1f2937',
    textAlign: 'center',
    position: 'relative',
    zIndex: 2,
    transform: 'translateY(-19%)',        // 保持网页版的垂直偏移
  },
  ipa: {
    fontSize: 18,
    fontFamily: fontFamilies.ipa,
    fontWeight: 'normal',
    color: '#3b82f6',
    marginBottom: '4mm',
    textAlign: 'center',
    alignSelf: 'center',    // 添加自身居中对齐
    border: DEBUG ? '1pt dashed #8e24aa' : undefined,
  },
  ipaImage: {
    width: '60mm',
    height: '8mm',
    objectFit: 'contain',
    marginBottom: '4mm',
    alignSelf: 'center',
    border: DEBUG ? '1pt dashed #8e24aa' : undefined,
  },
  phonicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignSelf: 'center',    // 添加自身居中对齐
    marginBottom: '2mm',
    gap: '1mm',
    border: DEBUG ? '1pt dashed #00acc1' : undefined,
  },
  phonicsBlock: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: '2mm',
    paddingHorizontal: '2.5mm',
    paddingVertical: '1.5mm',
    fontSize: 14,                        // 调整字体大小
    fontFamily: fontFamilies.bold,       // 使用粗体字体
    fontWeight: 'bold',
    minWidth: '7mm',
    textAlign: 'center',
    border: DEBUG ? '1pt dashed #f06292' : undefined,
  },
  // 背面样式
  backTextContainer: {
    height: '100%',
    padding: '5mm 5mm 5mm 5mm',         // 顶部5mm，与网页版20px相近
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',       // 改为顶部对齐，与网页版一致
    alignItems: 'center',
    textAlign: 'center',
    gap: '4mm',                        // 减小间距
    border: DEBUG ? '1pt dashed #43a047' : undefined,
  },
  meaning: {
    fontSize: 24,
    fontFamily: fontFamilies.chinese,      // 统一使用变量引用
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 1.4,
    marginBottom: '5mm',
    border: DEBUG ? '1pt dashed #fb8c00' : undefined,
  },
  sentenceContainer: {
    marginTop: 'auto', // 将例句推到底部
    padding: 8,
    backgroundColor: '#F3F4F6', // bg-gray-100
    borderRadius: 6,
    width: '100%',
  },
  sentenceEnglish: {
    fontSize: 10,
    color: '#374151', // text-gray-700
    marginBottom: 2,
    fontFamily: fontFamilies.bold,
  },
  sentenceChinese: {
    fontSize: 9,
    color: '#4B5563', // text-gray-600
    fontFamily: fontFamilies.chinese,
  },
  meaningText: {
    fontSize: 14,
    color: '#111827', // text-gray-900
    textAlign: 'center',
    fontFamily: fontFamilies.chinese,
  },
});

// PDF文档组件 - 稳定的字体系统
const WordCardsPDFDocument: React.FC<{ words: WordCard[] }> = React.memo(({ words }) => {
  const cardsPerPage = 4;
  const pages = [];

  // 生成正面页面
  for (let i = 0; i < words.length; i += cardsPerPage) {
    const pageWords = words.slice(i, i + cardsPerPage);
    while (pageWords.length < 4) {
      pageWords.push(undefined as unknown as WordCard);
    }
    
    pages.push(
      <Page size="A4" style={pdfStyles.page} key={`front-${i}`}>
        <View style={pdfStyles.gridContainer}>
          {[0, 1].map(rowIdx => (
            <View style={pdfStyles.row} key={rowIdx}>
              {[0, 1].map(colIdx => {
                const cardIdx = rowIdx * 2 + colIdx;
                const word = pageWords[cardIdx];
                return (
                  <View key={colIdx}>
                    {word && word.word ? (
                      <View style={pdfStyles.card}>
                        {/* 正面：图片区域 */}
                        <View style={pdfStyles.imageContainer}>
                          {word.imageUrl && word.imageUrl.trim() !== '' && (
                            <Image 
                              src={word.imageUrl} 
                              style={pdfStyles.image}
                            />
                          )}
                        </View>
                        {/* 正面：文字区域 */}
                        <View style={pdfStyles.textContainer}>
                          {/* 四线三格单词 */}
                          <View style={pdfStyles.fourLineGrid}>
                            <View style={pdfStyles.fourLineBackground}>
                              <View style={pdfStyles.fourLineLine1} />
                              <View style={pdfStyles.fourLineLine2} />
                              <View style={pdfStyles.fourLineRedLine} />
                              <View style={pdfStyles.fourLineLine4} />
                            </View>
                            {word.word && <Text style={pdfStyles.word}>{word.word}</Text>}
                          </View>
                          
                          {/* 音标：优先使用图片，降级到文本 */}
                          {word.ipaImage ? (
                            <Image src={word.ipaImage} style={pdfStyles.ipaImage} />
                          ) : word.ipa && word.ipa.trim() !== '' ? (
                            <Text style={pdfStyles.ipa}>{word.ipa}</Text>
                          ) : null}
                          
                          {/* 自然拼读 */}
                          {word.phonics && word.phonics.length > 0 && (
                            <View style={pdfStyles.phonicsContainer}>
                              {word.phonics.filter(p => p && p.trim() !== '').map((syllable, index) => (
                                <Text key={index} style={pdfStyles.phonicsBlock}>
                                  {syllable}
                                </Text>
                              ))}
                            </View>
                          )}
                        </View>
                      </View>
                    ) : (
                      <View style={pdfStyles.card} />
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </Page>
    );

    // 生成背面页面
    pages.push(
      <Page size="A4" style={pdfStyles.page} key={`back-${i}`}>
        <View style={pdfStyles.gridContainer}>
          {[0, 1].map(rowIdx => (
            <View style={pdfStyles.row} key={rowIdx}>
              {[0, 1].map(colIdx => {
                const cardIdx = rowIdx * 2 + colIdx;
                const word = pageWords[cardIdx];
                return (
                  <View key={colIdx}>
                    {word && word.word ? (
                      <View style={pdfStyles.card}>
                        <View style={pdfStyles.backTextContainer}>
                          {/* 中文释义 */}
                          {word.meaningCn && word.meaningCn.trim() !== '' && (
                            <Text style={pdfStyles.meaning}>{word.meaningCn}</Text>
                          )}
                          
                          {/* 例句 */}
                          {word.sentenceEn && word.sentenceEn.trim() !== '' && (
                            <View style={pdfStyles.sentenceContainer}>
                              <Text style={pdfStyles.sentenceEnglish}>{word.sentenceEn}</Text>
                              {/* 中文例句翻译 */}
                              {word.sentenceCn && word.sentenceCn.trim() !== '' && (
                                <Text style={pdfStyles.sentenceChinese}>{word.sentenceCn}</Text>
                              )}
                            </View>
                          )}
                        </View>
                      </View>
                    ) : (
                      <View style={pdfStyles.card} />
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </Page>
    );
  }

  return <Document>{pages}</Document>;
});

export default ExportSection;