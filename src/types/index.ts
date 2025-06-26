export interface WordCard {
  id: string;
  word: string;
  ipa: string;
  meaningCn: string;
  sentenceEn: string;
  sentenceCn: string;
  imageUrl: string;
  phonics?: string; // 拼读分块
}

export interface CardGeneratorState {
  words: WordCard[];
  isPreviewMode: boolean;
  isLoading: boolean;
  showCardBack: boolean;
}