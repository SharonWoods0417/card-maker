import html2canvas from 'html2canvas';
import JSZip from 'jszip';

/**
 * 导出选项配置
 */
export interface ExportOptions {
  /** 输出图片质量 (0-1) */
  quality?: number;
  /** DPI缩放比例 */
  scale?: number;
  /** 背景色 */
  backgroundColor?: string;
  /** 文件名前缀 */
  fileNamePrefix?: string;
  /** 是否包含日期时间戳 */
  includeTimestamp?: boolean;
}

/**
 * 导出进度回调
 */
export interface ExportProgress {
  /** 当前页面 */
  currentPage: number;
  /** 总页面数 */
  totalPages: number;
  /** 当前步骤 */
  step: 'capturing' | 'packaging' | 'downloading';
  /** 步骤描述 */
  message: string;
}

/**
 * 捕获单个A4页面为图片 - 确保完全渲染后截图
 */
export async function captureA4Page(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<Blob> {
  console.log('🎯 === 开始图片导出流程 ===');
  
  const {
    quality = 1.0,
    scale = 2, // 使用2倍缩放获得清晰图片
    backgroundColor = '#ffffff'
  } = options;

  // 立即检查页面中的图片
  const allImagesInPage = element.querySelectorAll('img');
  console.log(`🖼️ 页面中发现 ${allImagesInPage.length} 张图片`);
  
  allImagesInPage.forEach((img, index) => {
    const htmlImg = img as HTMLImageElement;
    console.log(`📸 图片 ${index + 1}:`, {
      src: htmlImg.src.slice(0, 80) + '...',
      loaded: htmlImg.complete,
      size: `${htmlImg.naturalWidth}x${htmlImg.naturalHeight}`,
      visible: htmlImg.offsetWidth > 0 && htmlImg.offsetHeight > 0
    });
  });

  // 暂时移除父容器的缩放变换以获得正确尺寸
  const scaleWrapper = document.getElementById('a4-scale-wrapper');
  const originalTransform = scaleWrapper?.style.transform;
  
  try {
    // 确保元素应用了print-mode样式
    element.classList.add('print-mode');
    
    if (scaleWrapper) {
      scaleWrapper.style.transform = 'none';
      console.log('已暂时移除缩放变换');
    }
    
    // 1. 等待DOM和资源完全加载
    console.log('开始等待DOM和资源加载...');
    await waitForDOMReady(element);
    
    // 2. 确保元素完全可见且不被裁剪
    const originalStyles = {
      position: element.style.position,
      visibility: element.style.visibility,
      zIndex: element.style.zIndex,
      top: element.style.top,
      left: element.style.left
    };
    
    // 临时设置样式确保截图区域可见
    element.style.position = 'fixed';
    element.style.top = '0';
    element.style.left = '0';
    element.style.visibility = 'visible';
    element.style.zIndex = '9999';
    
    // 再次等待一小段时间确保样式应用
    await new Promise(resolve => setTimeout(resolve, 100));

    // 获取元素的实际尺寸
    const rect = element.getBoundingClientRect();
    const actualWidth = rect.width;
    const actualHeight = rect.height;

    // 检查元素是否存在内容
    const hasContent = element.children.length > 0;
    const computedStyle = window.getComputedStyle(element);
    
    console.log('开始截图，元素信息:', {
      elementWidth: actualWidth,
      elementHeight: actualHeight,
      scale: scale,
      outputWidth: actualWidth * scale,
      outputHeight: actualHeight * scale,
      hasContent,
      visibility: computedStyle.visibility,
      display: computedStyle.display,
      opacity: computedStyle.opacity,
      backgroundColor: computedStyle.backgroundColor,
      childrenCount: element.children.length
    });
    
    // 如果元素没有内容，抛出错误
    if (!hasContent) {
      throw new Error('要截图的元素没有任何内容！请检查页面是否正确加载。');
    }

    // 最终检查：再次验证图片状态
    const finalImages = element.querySelectorAll('img');
    console.log(`=== html2canvas前最终图片检查 ===`);
    console.log(`截图元素中找到 ${finalImages.length} 张图片`);
    finalImages.forEach((img, index) => {
      const htmlImg = img as HTMLImageElement;
      console.log(`最终图片 ${index + 1}:`, {
        src: htmlImg.src.slice(0, 60) + '...',
        complete: htmlImg.complete,
        naturalWidth: htmlImg.naturalWidth,
        naturalHeight: htmlImg.naturalHeight,
        visible: htmlImg.offsetWidth > 0 && htmlImg.offsetHeight > 0,
        display: getComputedStyle(htmlImg).display,
        opacity: getComputedStyle(htmlImg).opacity,
        visibility: getComputedStyle(htmlImg).visibility
      });
    });
    console.log(`=== 最终图片检查结束 ===`);

    console.log('开始执行html2canvas截图...');
    const canvas = await html2canvas(element, {
      scale,
      backgroundColor,
      useCORS: false, // 改为false，避免CORS问题影响字体
      allowTaint: false, // 改为false，使用更安全的渲染模式
      // 使用元素的实际尺寸，按比例缩放输出
      width: actualWidth,
      height: actualHeight,
      // 确保完全捕获元素内容
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      // 导出优化设置 - 禁用外部渲染，使用内部渲染引擎
      logging: true, // 启用日志调试
      removeContainer: false, // 保持容器，避免结构变化
      // 忽略导出时不需要的元素
      ignoreElements: (element) => {
        // 忽略辅助线和调试元素，但不忽略四线三格
        return element.classList.contains('guide-line') ||
               element.classList.contains('debug-element') ||
               element.tagName === 'NOSCRIPT';
      },
      // 关闭外部渲染模式，使用内部Canvas渲染
      foreignObjectRendering: false,
      // 图片相关设置
      imageTimeout: 15000,
      // 确保HTML资源完全加载
      onclone: async (clonedDoc) => {
        console.log('开始克隆DOM，应用样式修复...');
        
        // 确保克隆的文档也有print-mode样式
        const clonedElement = clonedDoc.querySelector('[data-page-number]');
        if (clonedElement) {
          clonedElement.classList.add('print-mode');
          console.log('已应用print-mode样式');
        }
        
        // 特别处理：确保嵌入的字体样式被正确复制到克隆文档
        const embeddedFontStyle = document.getElementById('embedded-handwriting-font-style');
        if (embeddedFontStyle) {
          const clonedFontStyle = clonedDoc.createElement('style');
          clonedFontStyle.id = 'embedded-handwriting-font-style';
          clonedFontStyle.textContent = embeddedFontStyle.textContent;
          clonedDoc.head.appendChild(clonedFontStyle);
          console.log('✅ 已明确复制嵌入字体样式到克隆文档');
          console.log('📝 复制的字体CSS:', clonedFontStyle.textContent?.slice(0, 200) + '...');
        } else {
          console.warn('⚠️ 未找到嵌入的字体样式元素');
        }
        
        // 复制所有CSS样式表
        const styleSheets = Array.from(document.styleSheets);
        styleSheets.forEach((sheet, index) => {
          try {
            const rules = Array.from(sheet.cssRules || sheet.rules);
            const style = clonedDoc.createElement('style');
            style.textContent = rules.map(rule => rule.cssText).join('\n');
            clonedDoc.head.appendChild(style);
            console.log(`已复制样式表 ${index + 1}/${styleSheets.length}`);
          } catch (e) {
            console.warn(`无法复制样式表 ${index + 1}:`, e);
          }
        });
        
        // 强制确保所有图片在克隆文档中正确加载
        const clonedImages = Array.from(clonedDoc.querySelectorAll('img'));
        console.log(`克隆文档中找到 ${clonedImages.length} 张图片`);
        
        await Promise.all(clonedImages.map((img, index) => {
          return new Promise<void>((resolve) => {
            const htmlImg = img as HTMLImageElement;
            if (htmlImg.complete && htmlImg.naturalWidth > 0) {
              console.log(`克隆图片 ${index + 1} 已加载`);
              resolve();
              return;
            }
            
            console.log(`等待克隆图片 ${index + 1} 加载: ${htmlImg.src.slice(0, 50)}...`);
            
            const onLoad = () => {
              console.log(`克隆图片 ${index + 1} 加载完成`);
              htmlImg.removeEventListener('load', onLoad);
              htmlImg.removeEventListener('error', onError);
              resolve();
            };
            
            const onError = () => {
              console.warn(`克隆图片 ${index + 1} 加载失败`);
              htmlImg.removeEventListener('load', onLoad);
              htmlImg.removeEventListener('error', onError);
              resolve();
            };
            
            htmlImg.addEventListener('load', onLoad);
            htmlImg.addEventListener('error', onError);
            
            // 超时保护
            setTimeout(() => {
              console.warn(`克隆图片 ${index + 1} 加载超时`);
              onError();
            }, 5000);
          });
        }));
        
        // 特别处理四线三格元素，确保渲染效果
        const fourLineGrids = clonedDoc.querySelectorAll('.four-line-grid');
        fourLineGrids.forEach((grid, index) => {
          const htmlElement = grid as HTMLElement;
          
          // 强制确保四线三格的伪元素样式正确应用
          const computedStyle = clonedDoc.defaultView?.getComputedStyle(htmlElement, '::before');
          if (computedStyle) {
            // 确保伪元素样式正确
            htmlElement.style.setProperty('--grid-enhanced', 'true');
          }
          
          // 强制触发重新渲染
          htmlElement.style.display = 'none';
          // 触发重排
          void htmlElement.offsetHeight;
          htmlElement.style.display = '';
          console.log(`已处理四线三格元素 ${index + 1}/${fourLineGrids.length}，增强显示效果`);
        });
        
        // 等待字体和样式完全加载
        await new Promise<void>((resolve) => {
          // 强制等待字体在克隆文档中加载
          clonedDoc.fonts.load('1em "AU School Handwriting Fonts"').then(() => {
            console.log('✅ 克隆文档中字体加载成功');
            // 额外等待时间确保渲染完成
            setTimeout(() => {
              console.log('DOM克隆和样式应用完成');
              resolve();
            }, 1000); // 增加到1秒等待时间
          }).catch(() => {
            console.warn('⚠️ 克隆文档中字体加载失败，但继续执行');
            setTimeout(() => {
              console.log('DOM克隆和样式应用完成');
              resolve();
            }, 1000);
          });
        });
       }
    });
    
    // 恢复原始样式
    element.style.position = originalStyles.position;
    element.style.visibility = originalStyles.visibility;
    element.style.zIndex = originalStyles.zIndex;
    element.style.top = originalStyles.top;
    element.style.left = originalStyles.left;
    
    // 恢复缩放变换
    if (scaleWrapper && originalTransform) {
      scaleWrapper.style.transform = originalTransform;
      console.log('已恢复缩放变换');
    }

    // 验证输出尺寸
    console.log('截图完成，结果:', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      expectedWidth: actualWidth * scale,
      expectedHeight: actualHeight * scale
    });

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log('🎉 图片导出成功！文件大小:', Math.round(blob.size / 1024), 'KB');
            resolve(blob);
          } else {
            console.error('❌ Canvas转换为Blob失败');
            reject(new Error('Canvas转换为Blob失败'));
          }
        },
        'image/png',
        quality
      );
    });
  } catch (error) {
    console.error('页面截图失败:', error);
    throw new Error(`页面截图失败: ${error instanceof Error ? error.message : '未知错误'}`);
  } finally {
    // 清理：移除print-mode样式和恢复缩放
    element.classList.remove('print-mode');
    
    // 确保恢复缩放变换（防止错误时没有恢复）
    const scaleWrapper = document.getElementById('a4-scale-wrapper');
    if (scaleWrapper && originalTransform) {
      scaleWrapper.style.transform = originalTransform;
    }
  }
}

/**
 * 批量捕获多个A4页面并打包为ZIP
 */
export async function exportA4PagesToZip(
  pageElements: HTMLElement[],
  options: ExportOptions = {},
  onProgress?: (progress: ExportProgress) => void
): Promise<void> {
  const {
    fileNamePrefix = 'word-cards',
    includeTimestamp = true
  } = options;

  const zip = new JSZip();
  const totalPages = pageElements.length;

  try {
    // 步骤1：批量截图
    for (let i = 0; i < totalPages; i++) {
      const pageNumber = i + 1;
      
      onProgress?.({
        currentPage: pageNumber,
        totalPages,
        step: 'capturing',
        message: `正在加载字体 (第 ${pageNumber}/${totalPages} 页)...`
      });

      const pageElement = pageElements[i];
      
      // 在截图前确保字体已加载
      await ensureFontsLoaded(pageElement);

      onProgress?.({
        currentPage: pageNumber,
        totalPages,
        step: 'capturing',
        message: `正在截图 (第 ${pageNumber}/${totalPages} 页)...`
      });

      try {
        const imageBlob = await captureA4Page(pageElement, options);
        
        // 添加到ZIP，文件名格式：page-1.png, page-2.png
        zip.file(`page-${pageNumber}.png`, imageBlob);
      } catch (error) {
        console.error(`页面 ${pageNumber} 截图失败:`, error);
        throw new Error(`页面 ${pageNumber} 截图失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    // 步骤2：打包ZIP
    onProgress?.({
      currentPage: totalPages,
      totalPages,
      step: 'packaging',
      message: '正在打包图片文件...'
    });

    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6 // 平衡压缩率和速度
      }
    });

    // 步骤3：下载文件
    onProgress?.({
      currentPage: totalPages,
      totalPages,
      step: 'downloading',
      message: '正在下载ZIP文件...'
    });

    const timestamp = includeTimestamp 
      ? new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      : '';
    
    const fileName = timestamp 
      ? `${fileNamePrefix}_${timestamp}.zip`
      : `${fileNamePrefix}.zip`;

    downloadBlob(zipBlob, fileName);

  } catch (error) {
    console.error('A4页面导出失败:', error);
    throw new Error(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 下载Blob文件
 */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // 释放URL对象
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * 获取A4页面元素的辅助函数
 */
export function getA4PageElements(containerSelector: string): HTMLElement[] {
  const container = document.querySelector(containerSelector);
  if (!container) {
    throw new Error(`未找到容器元素: ${containerSelector}`);
  }

  const pageElements = container.querySelectorAll('[data-page-number]');
  if (pageElements.length === 0) {
    throw new Error('未找到A4页面元素，请确保已渲染页面');
  }

  return Array.from(pageElements) as HTMLElement[];
}

/**
 * 预设导出配置 - 更新为2倍缩放以获得清晰图片
 */
export const EXPORT_PRESETS = {
  /** 高质量导出（适合打印） - 2倍缩放获得清晰度 */
  highQuality: {
    quality: 1.0,
    scale: 2,
    backgroundColor: '#ffffff',
    fileNamePrefix: 'word-cards-hq',
    includeTimestamp: true
  } as ExportOptions,

  /** 标准质量导出（平衡大小和质量） - 2倍缩放获得清晰度 */
  standard: {
    quality: 0.9,
    scale: 2,
    backgroundColor: '#ffffff',
    fileNamePrefix: 'word-cards',
    includeTimestamp: true
  } as ExportOptions,

  /** 快速导出（较小文件大小） - 2倍缩放获得清晰度 */
  quick: {
    quality: 0.8,
    scale: 2,
    backgroundColor: '#ffffff',
    fileNamePrefix: 'word-cards-quick',
    includeTimestamp: false
  } as ExportOptions
} as const;

/**
 * 强制预加载所有图片 - 确保html2canvas能正确捕获
 */
function preloadAllImages(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  console.log(`开始预加载 ${images.length} 张图片`);
  
  if (images.length === 0) {
    return Promise.resolve();
  }
  
  const preloadPromises = images.map((img, index) => {
    return new Promise<void>((resolve) => {
      const newImg = new Image();
      newImg.crossOrigin = 'anonymous'; // 处理跨域图片
      
      newImg.onload = () => {
        console.log(`预加载成功 ${index + 1}/${images.length}: ${img.src.slice(0, 50)}...`);
        // 确保原始图片也更新
        if (img.src === newImg.src) {
          img.style.opacity = '1'; // 确保可见
        }
        resolve();
      };
      
      newImg.onerror = () => {
        console.warn(`预加载失败 ${index + 1}/${images.length}: ${img.src}`);
        resolve(); // 即使失败也继续
      };
      
      newImg.src = img.src;
      
      // 超时保护
      setTimeout(() => {
        console.warn(`预加载超时 ${index + 1}/${images.length}: ${img.src}`);
        resolve();
      }, 8000);
    });
  });
  
  return Promise.all(preloadPromises).then(() => {
    console.log('所有图片预加载完成');
  });
}

/**
 * 等待容器内所有图片加载完成 - 增强版
 */
function waitForAllImagesLoaded(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  console.log(`找到 ${images.length} 张图片需要等待加载`);
  
  if (images.length === 0) {
    console.log('没有图片需要加载');
    return Promise.resolve();
  }
  
  const promises = images.map((img, index) => {
    const imgSrc = img.src;
    console.log(`检查图片 ${index + 1}: ${imgSrc.slice(0, 50)}...`);
    
    if (img.complete && img.naturalWidth > 0) {
      console.log(`图片 ${index + 1} 已加载完成 (${img.naturalWidth}x${img.naturalHeight})`);
      return Promise.resolve();
    }
    
    console.log(`等待图片 ${index + 1} 加载...`);
    return new Promise<void>((resolve) => {
      const onLoad = () => {
        console.log(`图片 ${index + 1} 加载完成 (${img.naturalWidth}x${img.naturalHeight})`);
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onLoad);
        resolve();
      };
      
      const onError = () => {
        console.warn(`图片 ${index + 1} 加载失败: ${imgSrc}`);
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onError);
        resolve(); // 即使失败也继续
      };
      
      img.addEventListener('load', onLoad);
      img.addEventListener('error', onError);
      
      // 超时保护
      setTimeout(() => {
        console.warn(`图片 ${index + 1} 加载超时: ${imgSrc}`);
        onError();
      }, 10000); // 增加到10秒超时
    });
  });
  
  return Promise.all(promises).then(() => {
    console.log('所有图片加载检查完成');
  });
}

/**
 * 等待DOM完全渲染和资源加载 - 增强版稳定性
 */
async function waitForDOMReady(container: HTMLElement): Promise<void> {
  console.log('开始等待DOM和资源加载...');
  
  // 0. 首先检查容器中的图片元素
  const allImages = container.querySelectorAll('img');
  console.log(`=== 图片检查开始 ===`);
  console.log(`容器中找到 ${allImages.length} 个img元素`);
  allImages.forEach((img, index) => {
    const htmlImg = img as HTMLImageElement;
    console.log(`图片 ${index + 1}:`, {
      src: htmlImg.src,
      complete: htmlImg.complete,
      naturalWidth: htmlImg.naturalWidth,
      naturalHeight: htmlImg.naturalHeight,
      width: htmlImg.width,
      height: htmlImg.height
    });
  });
  console.log(`=== 图片检查结束 ===`);
  
  // 1. 等待字体加载完成
  await document.fonts.ready;
  console.log('字体加载完成');
  
  // 2. 强制预加载所有图片
  await preloadAllImages(container);
  console.log('图片预加载完成');
  
  // 3. 再次检查图片加载状态
  await waitForAllImagesLoaded(container);
  console.log('图片加载完成');
  
  // 3. 等待2个动画帧，确保布局完全稳定
  await new Promise((resolve) => 
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );
  console.log('等待动画帧完成');
  
  // 4. 额外等待时间确保所有动效和CSS变换完成
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log('额外等待完成');
  
  // 5. 验证关键元素是否存在且有尺寸
  const cards = container.querySelectorAll('.word-card');
  const hasValidCards = Array.from(cards).every(card => {
    const rect = card.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
  
  if (!hasValidCards) {
    console.warn('警告：检测到卡片可能还未完全渲染');
    // 再等待一段时间
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('DOM和资源加载完成，可以开始截图');
}

/**
 * 确保所有在用的字体已加载完成
 * @returns Promise<void>
 */
async function ensureFontsLoaded(element: HTMLElement): Promise<void> {
  // 查找所有应用了特殊字体的元素
  const fontFamilies = new Set<string>();
  const elementsWithFont = element.querySelectorAll('[style*="font-family"], [class*="font-"]');
  
  elementsWithFont.forEach(el => {
    const style = window.getComputedStyle(el);
    const family = style.fontFamily;
    // 简单的解析，提取字体名称
    family.split(',').forEach(f => {
      const fontName = f.trim().replace(/['"]/g, '');
      if (fontName && fontName !== 'sans-serif' && fontName !== 'serif' && fontName !== 'monospace') {
        fontFamilies.add(fontName);
      }
    });
  });

  // 等待所有字体加载
  const fontPromises = Array.from(fontFamilies).map(family => document.fonts.load(`1em ${family}`));
  
  try {
    await Promise.all(fontPromises);
    console.log('字体加载成功:', Array.from(fontFamilies).join(', '));
    // 短暂延迟以确保渲染
    await new Promise(resolve => setTimeout(resolve, 100)); 
  } catch (error) {
    console.warn('部分字体加载失败，但仍将继续导出:', error);
  }
} 