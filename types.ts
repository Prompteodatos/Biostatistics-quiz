
export enum AppState {
  Home = 'home',
  Quiz = 'quiz',
  Results = 'results',
}

export enum QuizMode {
  Random = 'random',
  Topic = 'topic',
  Hashtag = 'hashtag',
}

export interface Explanation {
  correct: string;
  incorrect: {
    [key: string]: string;
  };
}

export interface Question {
  id: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  answer: keyof Question['options'];
  explanation: Explanation;
  topic: string;
  type: 'cálculo sencillo' | 'conceptual/razonamiento';
}

export interface UserAnswer {
  questionId: string;
  answer: keyof Question['options'] | null;
  isCorrect: boolean | null;
}
