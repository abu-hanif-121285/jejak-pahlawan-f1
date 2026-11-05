export type Screen = 'menu' | 'guide' | 'race' | 'gameover' | 'finish';

export type OutcomeType = 'correct' | 'wrong' | 'timeout';

export interface Question {
  id: number;
  question: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
}

export interface RaceStats {
  correct: number;
  wrong: number;
  missed: number;
  score: number;
  lives: number;
  rank: number;
  questionsSeen: number;
}

export interface AudioSettings {
  music: boolean;
  sfx: boolean;
}

export const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export const OPTION_COLORS = ['#ef4444', '#3b82f6', '#f5b83b', '#22c55e'] as const;

export const EMPTY_STATS: RaceStats = {
  correct: 0,
  wrong: 0,
  missed: 0,
  score: 0,
  lives: 3,
  rank: 2,
  questionsSeen: 0,
};

export const MAX_LIVES = 3;
export const QUESTION_TIME = 20;
export const MAX_SCORE = 2000;

export function predicateForScore(score: number): { title: string; note: string } {
  if (score >= 1800) return { title: 'JUARA DUNIA!', note: 'Luar biasa! Kamu menguasai jejak para pahlawan.' };
  if (score >= 1500) return { title: 'PEMBALAP HEBAT!', note: 'Hebat! Pengetahuanmu tentang pahlawan sangat kuat.' };
  if (score >= 1000) return { title: 'PEMBALAP TANGGUH!', note: 'Tangguh! Terus pertajam pemahamanmu.' };
  return { title: 'TERUS BERLATIH!', note: 'Jangan menyerah, pelajari lagi jejak para pahlawan.' };
}
