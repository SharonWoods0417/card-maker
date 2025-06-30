import React from 'react';
import { Download, FileText, Printer, AlertCircle } from 'lucide-react';
import { WordCard } from '../types';
// 引入PDF导出核心组件
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
// 引入音标图片生成工具
import { generateAllIpaImages } from '../utils/captureIpaImages';

interface ExportSectionProps {
  words: WordCard[];
}

// 简化的字体管理系统
let fontsRegistered = false;
let fontsInitializing = false; // 防止并发初始化
const fontFamilies = {
  handwriting: 'Helvetica-Bold', // 默认降级字体
  ipa: 'Times-Roman',           // 默认降级字体
  regular: 'Helvetica',         // 默认降级字体
  bold: 'Helvetica-Bold',       // 默认降级字体
  chinese: 'Helvetica'          // 中文字体，默认降级
};

// 检查字体文件是否可用
const checkFontAvailable = async (src: string): Promise<boolean> => {
  try {
    const response = await fetch(src, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

// 安全注册字体的函数
const safeRegisterFont = async (family: string, src: string): Promise<boolean> => {
  try {
    // 检查字体是否已经注册
    const testDoc = document.createElement('span');
    testDoc.style.fontFamily = family;
    testDoc.style.position = 'absolute';
    testDoc.style.left = '-9999px';
    testDoc.textContent = 'test';
    document.body.appendChild(testDoc);
    
    // 清理测试元素
    document.body.removeChild(testDoc);
    
    // 注册字体
    Font.register({
      family: family,
      src: src,
    });
    
    return true;
  } catch (error) {
    console.warn(`字体注册失败 ${family}:`, error);
    return false;
  }
};

// 尝试注册字体，失败时使用降级字体
const initializeFonts = async (): Promise<void> => {
  if (fontsRegistered || fontsInitializing) return;
  
  fontsInitializing = true;
  console.log('🔄 开始注册PDF字体...');

  try {
    // 尝试注册手写体字体
    const handwritingAvailable = await checkFontAvailable('/fonts/AU-School-Handwriting-Fonts.ttf');
    if (handwritingAvailable) {
      const success = await safeRegisterFont('AU School Handwriting Fonts', '/fonts/AU-School-Handwriting-Fonts.ttf');
      if (success) {
        fontFamilies.handwriting = 'AU School Handwriting Fonts';
        console.log('✅ 手写体字体注册成功');
      }
    } else {
      console.warn('❌ 手写体字体文件不可用，使用降级字体');
    }

    // 尝试注册IPA音标字体
    const ipaAvailable = await checkFontAvailable('/fonts/DoulosSIL-Regular.ttf');
    if (ipaAvailable) {
      const success = await safeRegisterFont('Doulos SIL', '/fonts/DoulosSIL-Regular.ttf');
      if (success) {
        fontFamilies.ipa = 'Doulos SIL';
        console.log('✅ IPA字体注册成功');
      }
    } else {
      console.warn('❌ IPA字体文件不可用，使用降级字体');
    }

    // 尝试注册中文字体 - 使用Nunito作为中文字体（已验证支持中文）
    const chineseAvailable = await checkFontAvailable('/fonts/Nunito-Bold.ttf');
    if (chineseAvailable) {
      const success = await safeRegisterFont('Nunito Chinese', '/fonts/Nunito-Bold.ttf');
      if (success) {
        fontFamilies.chinese = 'Nunito Chinese';
        console.log('✅ 中文字体注册成功');
      }
    } else {
      console.warn('❌ 中文字体文件不可用，使用降级字体');
      fontFamilies.chinese = fontFamilies.regular;
    }

    // 尝试注册常规字体
    const regularAvailable = await checkFontAvailable('/fonts/CharisSIL-Regular.ttf');
    if (regularAvailable) {
      const success = await safeRegisterFont('Charis SIL Regular', '/fonts/CharisSIL-Regular.ttf');
      if (success) {
        fontFamilies.regular = 'Charis SIL Regular';
        console.log('✅ 常规字体注册成功');
      }
    } else {
      console.warn('❌ 常规字体文件不可用，使用降级字体');
    }

    // 尝试注册粗体字体  
    const boldAvailable = await checkFontAvailable('/fonts/CharisSIL-Bold.ttf');
    if (boldAvailable) {
      const success = await safeRegisterFont('Charis SIL Bold', '/fonts/CharisSIL-Bold.ttf');
      if (success) {
        fontFamilies.bold = 'Charis SIL Bold';
        console.log('✅ 粗体字体注册成功');
      }
    } else {
      console.warn('❌ 粗体字体文件不可用，使用降级字体');
    }

    fontsRegistered = true;
    console.log('✅ 字体初始化完成:', fontFamilies);
  } catch (error) {
    console.warn('⚠️ 字体注册过程中出现错误:', error);
    // 保持默认降级字体
    fontsRegistered = true;
  } finally {
    fontsInitializing = false;
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
  const [wordsWithImages, setWordsWithImages] = React.useState<WordCard[]>(words);
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

  // 同步words变化
  React.useEffect(() => {
    setWordsWithImages(words);
  }, [words]);

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
        
        {wordsWithImages.some(w => w.ipaImage) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2">
            <p className="text-green-800 text-sm text-center">
              ✅ 已生成 {wordsWithImages.filter(w => w.ipaImage).length}/{words.length} 个音标图片
            </p>
          </div>
        )}
      </div>
      
      {/* PDF下载按钮 */}
      <PDFDownloadLink
        document={<WordCardsPDFDocument words={wordsWithImages} />}
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
    textAlign: 'center',
    border: DEBUG ? '1pt dashed #43a047' : undefined,
  },
  fourLineGrid: {
    position: 'relative',
    width: '85%',           // 与网页版一致
    height: '22mm',
    alignItems: 'center',
    justifyContent: 'center',
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
    border: DEBUG ? '1pt dashed #ffb300' : undefined,
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
    fontFamily: fontFamilies.chinese,      // 使用中文字体
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 1.4,
    marginBottom: '5mm',
    border: DEBUG ? '1pt dashed #fb8c00' : undefined,
  },
  sentenceContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: '3mm',
    padding: '4mm',
    width: '100%',
    textAlign: 'center',
    border: DEBUG ? '1pt dashed #616161' : '1pt solid #d1d5db',
  },
  sentence: {
    fontSize: 16,
    fontFamily: fontFamilies.regular,
    fontWeight: 'normal',
    color: '#374151',
    lineHeight: 1.5,
    textAlign: 'left',                     // 改为左对齐
    border: DEBUG ? '1pt dashed #3949ab' : undefined,
  },
  sentenceChinese: {
    fontSize: 14,
    fontFamily: fontFamilies.chinese,      // 使用中文字体
    fontWeight: 'normal',
    color: '#6b7280',
    lineHeight: 1.5,
    textAlign: 'left',
    marginTop: '2mm',
    border: DEBUG ? '1pt dashed #9c27b0' : undefined,
  },
});

// PDF文档组件 - 稳定的字体系统
const WordCardsPDFDocument: React.FC<{ words: WordCard[] }> = ({ words }) => {
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
                              <Text style={pdfStyles.sentence}>{word.sentenceEn}</Text>
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
};

export default ExportSection;