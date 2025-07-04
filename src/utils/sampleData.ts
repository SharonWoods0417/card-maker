import { WordCard } from '../types';
import { splitSyllables, formatWordForStorage } from './dictionary';

const createSampleCard = (
  word: string,
  ipa: string,
  meaning: string,
  sentence: string,
  sentenceCn: string,
  imageUrl: string
): WordCard => ({
  id: `sample-${word}`,
  word: formatWordForStorage(word),
  ipa,
  meaningCn: meaning,
  sentenceEn: sentence,
  sentenceCn: sentenceCn,
  imageUrl,
  phonics: splitSyllables(word) || '',
});

export const sampleWords: WordCard[] = [
  createSampleCard(
    'apple',
    '/ˈæpəl/',
    'n. 苹果',
    'An apple a day keeps the doctor away.',
    '一天一苹果，医生远离我。',
    'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=300&h=200'
  ),
  createSampleCard(
    'book',
    '/bʊk/',
    'n. 书',
    'I am reading a book.',
    '我正在读一本书。',
    'https://images.pexels.com/photos/34592/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=300&h=200'
  ),
  createSampleCard(
    'cat',
    '/kæt/',
    'n. 猫',
    'The cat is sleeping on the mat.',
    '猫正在垫子上睡觉。',
    'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=300&h=200'
  ),
  createSampleCard(
    'dog',
    '/dɒɡ/',
    'n. 狗',
    'The dog is barking.',
    '狗在叫。',
    'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300&h=200'
  ),
  createSampleCard(
    'elephant',
    '/ˈelɪfənt/',
    'n. 大象',
    'The elephant is a large animal.',
    '大象是一种大型动物。',
    'https://images.pexels.com/photos/66898/elephant-cub-tsavo-kenya-66898.jpeg?auto=compress&cs=tinysrgb&w=300&h=200'
  ),
  createSampleCard(
    'flower',
    '/ˈflaʊər/',
    'n. 花',
    'This flower is beautiful.',
    '这朵花很美。',
    'https://images.pexels.com/photos/736230/pexels-photo-736230.jpeg?auto=compress&cs=tinysrgb&w=300&h=200'
  ),
  createSampleCard(
    'house',
    '/haʊs/',
    'n. 房子',
    'I live in a big house.',
    '我住在一个大房子里。',
    'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=300&h=200'
  ),
  createSampleCard(
    'Monday',
    '/ˈmʌndeɪ/',
    'n. 星期一',
    'I go to school on Monday.',
    '我周一去上学。',
    'https://images.pexels.com/photos/59124/pexels-photo-59124.jpeg?auto=compress&cs=tinysrgb&w=300&h=200'
  )
];