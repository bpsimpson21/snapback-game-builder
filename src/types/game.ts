export interface GameQuestion {
  answer: string;
  imageOptions: string[];
  selectedImage: string;
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
