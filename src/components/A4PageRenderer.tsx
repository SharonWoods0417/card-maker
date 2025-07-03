import React from 'react';
import { WordCard } from '../types';
import SingleCardRenderer from './SingleCardRenderer';

interface A4PageRendererProps {
  cards: WordCard[];
  pageIndex: number;
  cardsPerPage?: number;
  className?: string;
  showBack?: boolean;
  showGuideLines?: boolean;
  enablePrintMode?: boolean; // 新增：控制是否启用打印模式样式
}

// A4标准尺寸常量 (210×297mm at 96dpi) - 固定像素尺寸，避免变形
const A4_DIMENSIONS = {
  width: 794,   // px (210mm at 96dpi) - 固定值
  height: 1123, // px (297mm at 96dpi) - 固定值
  // 边距：确保卡片在A4纸上完美居中
  marginTop: 25,    // px (约6.6mm)
  marginBottom: 25, // px (约6.6mm)
  marginLeft: 22,   // px (约5.8mm)
  marginRight: 22   // px (约5.8mm)
};

// 卡片真实尺寸 (85×120mm at 96dpi) - 固定像素尺寸
const CARD_DIMENSIONS = {
  width: 321,   // px (85mm) - 固定值，避免相对单位
  height: 453   // px (120mm) - 固定值，避免相对单位
};

// 卡片间距 - 固定像素值
const CARD_SPACING = {
  horizontal: 32, // px (约8.5mm) - 固定值
  vertical: 38    // px (约10mm) - 固定值
};

const A4PageRenderer: React.FC<A4PageRendererProps> = ({
  cards,
  pageIndex,
  cardsPerPage = 4,
  className = '',
  showBack = false,
  showGuideLines = false,
  enablePrintMode = false // 默认不启用打印模式
}) => {
  // 计算当前页面要显示的卡片
  const startIndex = pageIndex * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const pageCards = cards.slice(startIndex, endIndex);

  // 填充空卡片到4张
  const filledCards: (WordCard | null)[] = [...pageCards];
  while (filledCards.length < cardsPerPage) {
    filledCards.push(null);
  }

  // 计算实际内容区域尺寸
  const contentWidth = A4_DIMENSIONS.width - A4_DIMENSIONS.marginLeft - A4_DIMENSIONS.marginRight;
  const contentHeight = A4_DIMENSIONS.height - A4_DIMENSIONS.marginTop - A4_DIMENSIONS.marginBottom;

  // 计算卡片容器的总尺寸（2张卡片宽度 + 1个间距）
  const cardsAreaWidth = CARD_DIMENSIONS.width * 2 + CARD_SPACING.horizontal;
  const cardsAreaHeight = CARD_DIMENSIONS.height * 2 + CARD_SPACING.vertical;

  // 计算居中偏移量
  const offsetX = (contentWidth - cardsAreaWidth) / 2;
  const offsetY = (contentHeight - cardsAreaHeight) / 2;

  return (
    <div 
      className={`a4-page-container ${enablePrintMode ? 'print-mode' : ''} ${className}`}
      data-page-number={pageIndex + 1}
      style={{
        // 固定尺寸，避免任何相对单位
        width: `${A4_DIMENSIONS.width}px`,
        height: `${A4_DIMENSIONS.height}px`,
        minWidth: `${A4_DIMENSIONS.width}px`,
        minHeight: `${A4_DIMENSIONS.height}px`,
        maxWidth: `${A4_DIMENSIONS.width}px`,
        maxHeight: `${A4_DIMENSIONS.height}px`,
        // 布局和外观
        backgroundColor: 'white',
        margin: '20px auto',
        position: 'relative',
        // 边框和阴影
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        borderRadius: '8px',
        overflow: 'hidden',
        // 确保不被缩放或变换
        transform: 'none',
        // 确保字体渲染
        fontFamily: '"AU School Handwriting Fonts", "Kalam", "Comic Neue", "Comic Sans MS", sans-serif'
      }}
    >
      {/* 卡片容器 - 使用绝对定位和固定尺寸 */}
      <div
        style={{
          position: 'absolute',
          left: `${A4_DIMENSIONS.marginLeft + offsetX}px`,
          top: `${A4_DIMENSIONS.marginTop + offsetY}px`,
          width: `${cardsAreaWidth}px`,
          height: `${cardsAreaHeight}px`,
          display: 'grid',
          gridTemplateColumns: `${CARD_DIMENSIONS.width}px ${CARD_DIMENSIONS.width}px`,
          gridTemplateRows: `${CARD_DIMENSIONS.height}px ${CARD_DIMENSIONS.height}px`,
          columnGap: `${CARD_SPACING.horizontal}px`,
          rowGap: `${CARD_SPACING.vertical}px`,
          justifyContent: 'start',
          alignContent: 'start',
          // 确保不被变换
          transform: 'none'
        }}
      >
        {filledCards.map((card, index) => (
          <div
            key={`${pageIndex}-${index}`}
            style={{
              width: `${CARD_DIMENSIONS.width}px`,
              height: `${CARD_DIMENSIONS.height}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              // 确保不被变换
              transform: 'none'
            }}
          >
            {card ? (
              <SingleCardRenderer
                card={card}
                showBack={showBack}
                printMode={enablePrintMode}
                style={{
                  width: '100%',
                  height: '100%',
                  // 确保不被变换
                  transform: 'none'
                }}
              />
            ) : (
              <div 
                className="empty-card-slot"
                style={{
                  width: '100%',
                  height: '100%',
                  border: showGuideLines ? '2px dashed #e2e8f0' : 'none',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  fontSize: '14px',
                  fontFamily: 'Nunito, sans-serif',
                  backgroundColor: '#fafafa',
                  // 确保不被变换
                  transform: 'none'
                }}
              >
                {showGuideLines && '空卡片位置'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 辅助线 - 仅在开启时显示 */}
      {showGuideLines && (
        <>
          {/* 垂直中心线 */}
          <div
            style={{
              position: 'absolute',
              left: `${A4_DIMENSIONS.width / 2}px`,
              top: '0',
              width: '1px',
              height: '100%',
              backgroundColor: '#ef4444',
              opacity: 0.5,
              zIndex: 10
            }}
          />
          {/* 水平中心线 */}
          <div
            style={{
              position: 'absolute',
              top: `${A4_DIMENSIONS.height / 2}px`,
              left: '0',
              height: '1px',
              width: '100%',
              backgroundColor: '#ef4444',
              opacity: 0.5,
              zIndex: 10
            }}
          />
          {/* 边距线 */}
          <div
            style={{
              position: 'absolute',
              left: `${A4_DIMENSIONS.marginLeft}px`,
              top: `${A4_DIMENSIONS.marginTop}px`,
              width: `${A4_DIMENSIONS.width - A4_DIMENSIONS.marginLeft - A4_DIMENSIONS.marginRight}px`,
              height: `${A4_DIMENSIONS.height - A4_DIMENSIONS.marginTop - A4_DIMENSIONS.marginBottom}px`,
              border: '1px dashed #3b82f6',
              opacity: 0.3,
              zIndex: 9,
              pointerEvents: 'none'
            }}
          />
        </>
      )}

      {/* 页面信息 - 仅在显示辅助线时显示 */}
      {showGuideLines && (
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '12px',
            fontSize: '10px',
            color: '#6b7280',
            fontFamily: 'Nunito, sans-serif',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}
        >
          A4页面 {pageIndex + 1} | {A4_DIMENSIONS.width}×{A4_DIMENSIONS.height}px
        </div>
      )}
    </div>
  );
};

export default A4PageRenderer; 