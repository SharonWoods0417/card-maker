import { WordCard } from '../types';
import { splitPhonics, formatWordForStorage } from './dictionary';

// 使用Canvas生成本地图片，避免跨域问题
const generateWordImage = (word: string): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  canvas.width = 300;
  canvas.height = 200;
  
  // 生成基于单词的颜色
  const colors = [
    '#E3F2FD', '#F3E5F5', '#E8F5E8', '#FFF3E0', '#FCE4EC', 
    '#E0F2F1', '#F1F8E9', '#FFF8E1', '#FFEBEE', '#E8EAF6'
  ];
  
  const colorIndex = word.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];
  
  // 绘制背景
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 300, 200);
  
  // 绘制单词
  ctx.fillStyle = '#424242';
  ctx.font = 'bold 24px "Comic Sans MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(word.toUpperCase(), 150, 100);
  
  // 绘制装饰边框
  ctx.strokeStyle = '#9E9E9E';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 300, 200);
  
  return canvas.toDataURL('image/png');
};

export const generateSampleWords = (): WordCard[] => {
  return [
    {
      id: 'sample-1',
      word: formatWordForStorage('apple'),
      ipa: '/ˈæpəl/',
      meaningCn: '苹果',
      sentenceEn: 'I eat an apple every day.',
      sentenceCn: '我每天吃一个苹果。',
      imageUrl: generateWordImage('apple'),
      phonics: splitPhonics('apple')
    },
    {
      id: 'sample-2',
      word: formatWordForStorage('book'),
      ipa: '/bʊk/',
      meaningCn: '书本',
      sentenceEn: 'This is a very interesting book.',
      sentenceCn: '这是一本非常有趣的书。',
      imageUrl: generateWordImage('book'),
      phonics: splitPhonics('book')
    },
    {
      id: 'sample-3',
      word: formatWordForStorage('cat'),
      ipa: '/kæt/',
      meaningCn: '猫',
      sentenceEn: 'The cat is sleeping on the sofa.',
      sentenceCn: '猫正在沙发上睡觉。',
      imageUrl: generateWordImage('cat'),
      phonics: splitPhonics('cat')
    },
    {
      id: 'sample-4',
      word: formatWordForStorage('dog'),
      ipa: '/dɔːɡ/',
      meaningCn: '狗',
      sentenceEn: 'My dog likes to play in the park.',
      sentenceCn: '我的狗喜欢在公园里玩耍。',
      imageUrl: generateWordImage('dog'),
      phonics: splitPhonics('dog')
    },
    {
      id: 'sample-5',
      word: formatWordForStorage('elephant'),
      ipa: '/ˈeləfənt/',
      meaningCn: '大象',
      sentenceEn: 'The elephant is the largest land animal.',
      sentenceCn: '大象是最大的陆地动物。',
      imageUrl: generateWordImage('elephant'),
      phonics: splitPhonics('elephant')
    },
    {
      id: 'sample-6',
      word: formatWordForStorage('flower'),
      ipa: '/ˈflaʊər/',
      meaningCn: '花朵',
      sentenceEn: 'She gave me a beautiful flower.',
      sentenceCn: '她给了我一朵美丽的花。',
      imageUrl: generateWordImage('flower'),
      phonics: splitPhonics('flower')
    },
    {
      id: 'sample-7',
      word: formatWordForStorage('house'),
      ipa: '/haʊs/',
      meaningCn: '房子',
      sentenceEn: 'We live in a big house.',
      sentenceCn: '我们住在一个大房子里。',
      imageUrl: generateWordImage('house'),
      phonics: splitPhonics('house')
    },
    {
      id: 'sample-8',
      word: formatWordForStorage('Monday'),
      ipa: '/ˈmʌndeɪ/',
      meaningCn: '星期一',
      sentenceEn: 'Today is Monday.',
      sentenceCn: '今天是星期一。',
      imageUrl: generateWordImage('Monday'),
      phonics: splitPhonics('Monday')
    }
  ];
};