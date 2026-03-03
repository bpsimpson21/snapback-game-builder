export interface CropData {
  scale: number;
  posX: number;
  posY: number;
}

export interface GameQuestion {
  answer: string;
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
}

export interface GameMeta {
  id: string;
  title: string;
  questionCount: number;
  createdAt: number;
  playCount: number;
}

export interface PlayResult {
  answer: string;
  correct: boolean;
  timeTaken: number; // seconds
}
