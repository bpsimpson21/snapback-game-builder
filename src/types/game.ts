export interface CropData {
  scale: number;
  posX: number;
  posY: number;
}

export interface GameQuestion {
  id?: string;
  answer: string;
  approved?: boolean;
  imageOptions: string[];
  selectedImage: string;
  originalImageUrl?: string;
  cropData?: CropData;
}

export interface Game {
  id: string;
  title: string;
  questions: GameQuestion[];
  createdAt: number;
  playCount: number;
  categories?: string[];
  explainerText?: string;
  samePromptAndResult?: boolean;
  requireExactMatches?: boolean;
  isDraft?: boolean;
}

export interface GameMeta {
  id: string;
  title: string;
  questionCount: number;
  createdAt: number;
  playCount: number;
  categories?: string[];
  isDraft?: boolean;
}

export interface BuilderDraft {
  step: number;
  title: string;
  questions: GameQuestion[];
  categories: string[];
  explainerText: string;
  samePromptAndResult: boolean;
  requireExactMatches: boolean;
  savedAt: number;
}

export const GAME_CATEGORIES = [
  "Baseball",
  "Basketball",
  "College",
  "Football",
  "General Sports",
  "Hockey",
  "Racing",
  "Soccer",
] as const;

export type GameCategory = (typeof GAME_CATEGORIES)[number];

export interface PlayResult {
  answer: string;
  correct: boolean;
  timeTaken: number; // seconds
}
