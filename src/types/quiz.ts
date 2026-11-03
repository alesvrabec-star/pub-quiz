export type CategoryType = 
  | 'cesko' 
  | 'film' 
  | 'prehled' 
  | 'sport' 
  | 'pivo' 
  | 'veda'
  | 'hudba'
  | 'svet'
  | 'vlastni';

export type DifficultyLevel = 'lehka' | 'stredni' | 'hospodska_vyzva';

export interface QuizQuestion {
  id: string;
  category: CategoryType;
  categoryLabel: string;
  question: string;
  options: string[]; // 4 options for table play
  correctIndex: number; // 0..3
  correctAnswer: string;
  explanation: string; // Fun fact / explanation for the Quizmaster
  difficulty: DifficultyLevel;
  points: number;
}

export interface QuizRound {
  id: string;
  roundNumber: number;
  title: string;
  description: string;
  category: CategoryType;
  questions: QuizQuestion[];
}

export interface TeamScore {
  id: string;
  name: string;
  tableNumber: number;
  totalScore: number;
  roundScores: Record<string, number>;
  jokerRoundId?: string; // Double points for chosen round
  members?: string[]; // Seznam členů týmu (1 až 10)
}

export interface MultiplayerTeam {
  id: string;
  name: string;
  members: string[]; // 1 až 10 členů týmu
  tableNumber: number;
  score: number;
  hasAnswered: boolean;
  selectedOption: number | null;
  responseTimeMs?: number | null;
  earnedBonusPoint?: boolean;
  pointsEarnedThisQuestion?: number;
  isWinner?: boolean;
  connected?: boolean;
}

export type RoomStatus = 'LOBBY' | 'STARTING' | 'QUESTION' | 'REVEAL' | 'FINAL_RESULTS';

export interface FastestCorrectTeamInfo {
  id: string;
  name: string;
  tableNumber: number;
  responseTimeMs: number;
}

export interface MultiplayerRoomState {
  code: string;
  status: RoomStatus;
  teams: MultiplayerTeam[];
  currentRoundIndex: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestion: QuizQuestion | null;
  timerSeconds: number; // 20s na odpověď
  startCountdown: number; // 3, 2, 1...
  fastestCorrectTeam?: FastestCorrectTeamInfo | null;
  waitingForTeamsCount?: number;
  allAnswered?: boolean;
}

export type AppView = 
  | 'home' 
  | 'multiplayer' // Společná hra více týmů na vlastních zařízeních
  | 'host' 
  | 'player' 
  | 'rounds' 
  | 'generator';

export interface GameSettings {
  roundTimerSeconds: number;
  soundEnabled: boolean;
  allowJokers: boolean;
  showHints: boolean;
}
