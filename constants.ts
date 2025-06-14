
import { Feature, Technology, Difficulty } from './types';

export const API_MODEL_TEXT = 'gemini-2.5-flash-preview-04-17';

export const FEATURE_MAP: { [key in Feature]: string } = {
  [Feature.LEARN]: 'Tìm Hiểu',
  [Feature.FLASHCARDS]: 'Flashcards',
  [Feature.EXERCISES]: 'Bài tập',
  [Feature.PROJECT_IDEAS]: 'Ý tưởng dự án',
};

export const TECHNOLOGY_MAP: { [key in Technology]: string } = {
  [Technology.JAVASCRIPT]: 'JavaScript',
  [Technology.REACT]: 'React',
  [Technology.VUE]: 'Vue', // Changed from Vite
  [Technology.ANGULAR]: 'Angular',
  [Technology.TYPESCRIPT]: 'TypeScript',
};

export const DIFFICULTY_MAP: { [key in Difficulty]: string } = {
  [Difficulty.BEGINNER]: 'Dễ',
  [Difficulty.INTERMEDIATE]: 'Trung bình',
  [Difficulty.ADVANCED]: 'Nâng cao',
  [Difficulty.EXPERT]: 'Chuyên gia',
};

export const TECHNOLOGIES_ARRAY = Object.values(Technology);
export const DIFFICULTIES_ARRAY = Object.values(Difficulty);