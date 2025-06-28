import { WordCard } from '../types';
import { splitPhonics, formatWordForStorage } from './dictionary';

export const generateSampleWords = (): WordCard[] => {
  return [
    {
      id: 'sample-1',
      word: formatWordForStorage('apple'),
      ipa: '/ˈæpəl/',
      meaningCn: '苹果',
      sentenceEn: 'I eat an apple every day.',
      sentenceCn: '我每天吃一个苹果。',
      imageUrl: 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      phonics: splitPhonics('apple')
    },
    {
      id: 'sample-2',
      word: formatWordForStorage('book'),
      ipa: '/bʊk/',
      meaningCn: '书本',
      sentenceEn: 'This is a very interesting book.',
      sentenceCn: '这是一本非常有趣的书。',
      imageUrl: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      phonics: splitPhonics('book')
    },
    {
      id: 'sample-3',
      word: formatWordForStorage('cat'),
      ipa: '/kæt/',
      meaningCn: '猫',
      sentenceEn: 'The cat is sleeping on the sofa.',
      sentenceCn: '猫正在沙发上睡觉。',
      imageUrl: 'https://images.pexels.com/photos/104827/cat-pet-animal-domestic-104827.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      phonics: splitPhonics('cat')
    },
    {
      id: 'sample-4',
      word: formatWordForStorage('dog'),
      ipa: '/dɔːɡ/',
      meaningCn: '狗',
      sentenceEn: 'My dog likes to play in the park.',
      sentenceCn: '我的狗喜欢在公园里玩耍。',
      imageUrl: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      phonics: splitPhonics('dog')
    },
    {
      id: 'sample-5',
      word: formatWordForStorage('elephant'),
      ipa: '/ˈeləfənt/',
      meaningCn: '大象',
      sentenceEn: 'The elephant is the largest land animal.',
      sentenceCn: '大象是最大的陆地动物。',
      imageUrl: 'https://images.pexels.com/photos/66898/elephant-cub-tsavo-kenya-66898.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      phonics: splitPhonics('elephant')
    },
    {
      id: 'sample-6',
      word: formatWordForStorage('flower'),
      ipa: '/ˈflaʊər/',
      meaningCn: '花朵',
      sentenceEn: 'She gave me a beautiful flower.',
      sentenceCn: '她给了我一朵美丽的花。',
      imageUrl: 'https://images.pexels.com/photos/56866/garden-rose-red-pink-56866.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      phonics: splitPhonics('flower')
    },
    {
      id: 'sample-7',
      word: formatWordForStorage('house'),
      ipa: '/haʊs/',
      meaningCn: '房子',
      sentenceEn: 'We live in a big house.',
      sentenceCn: '我们住在一个大房子里。',
      imageUrl: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      phonics: splitPhonics('house')
    },
    {
      id: 'sample-8',
      word: formatWordForStorage('Monday'),
      ipa: '/ˈmʌndeɪ/',
      meaningCn: '星期一',
      sentenceEn: 'Today is Monday.',
      sentenceCn: '今天是星期一。',
      imageUrl: 'https://images.pexels.com/photos/1020315/pexels-photo-1020315.jpeg?auto=compress&cs=tinysrgb&w=300&h=200',
      phonics: splitPhonics('Monday')
    }
  ];
};