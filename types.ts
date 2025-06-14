
export enum Feature {
  LEARN = 'LEARN',
  FLASHCARDS = 'FLASHCARDS',
  EXERCISES = 'EXERCISES',
  PROJECT_IDEAS = 'PROJECT_IDEAS',
}

export enum Technology {
  JAVASCRIPT = 'JAVASCRIPT',
  REACT = 'REACT',
  VUE = 'VUE', // Changed from VITE
  ANGULAR = 'ANGULAR',
  TYPESCRIPT = 'TYPESCRIPT',
}

export enum Difficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

export interface Identifiable {
  id: string;
}

export interface Favoriteable {
  isFavorite: boolean;
}

export interface Flashcard extends Identifiable, Favoriteable {
  cauHoi: string;
  cauTraLoi: string;
}

export interface Exercise extends Identifiable, Favoriteable {
  tieuDe: string;
  moTa: string;
  deBai: string; // Can include markdown for code
  goiYDonGian?: string; // For simple hint
  loiGiai?: string; // For generated solution
  isLoadingSolution?: boolean; // To track solution loading state
  isLoadingHint?: boolean; // To track simple hint loading state
}

export interface ProjectIdea extends Identifiable, Favoriteable {
  tenDuAn: string;
  moTaNganGon: string;
  tinhNangChinh: string[];
  congNgheGoiY?: string[];
  huongDanChiTiet?: string; // For detailed instructions
  goiYThem?: string[]; // For additional suggestions
  isLoadingDetails?: boolean;
  isLoadingSuggestions?: boolean;
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web: GroundingChunkWeb;
}