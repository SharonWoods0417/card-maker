import html2canvas from 'html2canvas';
import { WordCard } from '../types';

/**
 * 截图单个音标元素，转换为base64图片
 * @param element 音标DOM元素
 * @returns base64图片字符串
 */
export async function captureIpaImage(element: HTMLElement): Promise<string> {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 3, // 高清截图
      useCORS: true,
      allowTaint: false,
      logging: false,
      width: element.offsetWidth,
      height: element.offsetHeight,
    });
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('音标截图失败:', error);
    return '';
  }
}

/**
 * 批量生成所有单词的音标图片
 * @param wordCards 单词卡片数组
 * @returns 带有ipaImage字段的新单词卡片数组
 */
export async function generateAllIpaImages(wordCards: WordCard[]): Promise<WordCard[]> {
  console.log('🔄 开始生成音标图片...');
  
  const results = await Promise.all(
    wordCards.map(async (card, index) => {
      try {
        // 查找对应的音标DOM元素
        const ipaElement = document.getElementById(`ipa-${card.id}`);
        
        if (!ipaElement) {
          console.warn(`找不到音标元素: ipa-${card.id}`);
          return { ...card, ipaImage: undefined };
        }

        // 确保元素可见（临时显示）
        const originalOpacity = ipaElement.style.opacity;
        const originalVisibility = ipaElement.style.visibility;
        
        ipaElement.style.opacity = '1';
        ipaElement.style.visibility = 'visible';
        
        // 等待一小段时间确保渲染完成
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // 截图
        const ipaImage = await captureIpaImage(ipaElement);
        
        // 恢复原始样式
        ipaElement.style.opacity = originalOpacity;
        ipaElement.style.visibility = originalVisibility;
        
        if (ipaImage) {
          console.log(`✅ 音标图片生成成功: ${card.word} (${index + 1}/${wordCards.length})`);
          console.log(`    🖼️ ${card.word} 的音标图片地址:`, ipaImage);
          return { ...card, ipaImage };
        } else {
          console.warn(`❌ 音标图片生成失败: ${card.word}`);
          return { ...card, ipaImage: undefined };
        }
        
      } catch (error) {
        console.error(`音标图片生成异常: ${card.word}`, error);
        return { ...card, ipaImage: undefined };
      }
    })
  );
  
  const successCount = results.filter(card => card.ipaImage).length;
  console.log(`✅ 音标图片生成完成: ${successCount}/${wordCards.length} 张成功`);
  
  return results;
} 