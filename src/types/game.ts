export interface GameQuestion {
  answer: string;
  imageOptions: string[];
  selectedImage: string;
}

export interface Game {
  id: string;
  title: string;
  questions: GameQuestion[];
}

export interface PlayResult {
  answer: string;
  correct: boolean;
  timeTaken: number; // seconds
}
