export type LevelId = 'a1' | 'a2' | 'b1' | 'b2';

export type SkillType = 'reading' | 'listening';

export type UserRole = 'student' | 'teacher';

export type AppLanguage = 'ru' | 'en' | 'kz';

export type MiniGameType = 'match-words' | 'drag-and-drop' | 'listening-sprint';

export type ContentType =
  | 'video'
  | 'grammar'
  | 'shadowing'
  | 'skills'
  | 'module-test'
  | 'mini-games';

export type AssessmentQuestionType = 'grammar' | 'translation' | 'listening' | 'speaking';

export interface LocalizedText {
  ru: string;
  en: string;
  kz: string;
}

export interface LevelSummary {
  id: LevelId;
  order: number;
  name: string | LocalizedText;
  desc: string | LocalizedText;
  goal: string | LocalizedText;
}

export interface VideoLesson {
  id: string;
  title: string;
  duration: string;
  youtubeId: string;
  summary: string;
}

export interface GrammarExercise {
  prompt: string;
  correct: string;
}

export interface GrammarTopic {
  id: string;
  title: string;
  rule: string;
  examples: string[];
  exercise: GrammarExercise;
}

export interface ShadowingTask {
  id: string;
  title: string;
  kazakh: string;
  russian: string;
  audioLength: string;
}

export interface SkillQuestion {
  id: string;
  q: string;
  options: string[];
  correct: number;
}

export interface ReadingLesson {
  type: 'reading';
  title: string;
  text: string;
  questions: SkillQuestion[];
}

export interface ListeningLesson {
  type: 'listening';
  title: string;
  transcript: string;
  questions: SkillQuestion[];
}

export interface SkillsContent {
  reading: ReadingLesson;
  listening: ListeningLesson;
}

export interface AssessmentQuestion {
  id: string;
  type?: AssessmentQuestionType;
  prompt?: string | LocalizedText;
  helper?: string | LocalizedText;
  options?: Array<string | LocalizedText>;
  correctOption?: number;
  acceptableAnswers?: string[];
  placeholder?: string | LocalizedText;
  audioText?: string;
  maxAudioPlays?: number;
  maxSpeakingAttempts?: number;
  text?: string;
  q?: string;
  correct?: number;
}

export type DiagnosticQuestion = AssessmentQuestion;

export type ModuleTestQuestion = AssessmentQuestion;

export interface AssessmentResponseInput {
  questionId: string;
  answer: string | number;
  listeningPlays?: number;
  speakingAttempts?: number;
}

export interface MatchWordPair {
  id: string;
  kazakh: string;
  translation: string | LocalizedText;
}

export interface MatchWordsGame {
  type: 'match-words';
  id: string;
  title: string | LocalizedText;
  instructions: string | LocalizedText;
  pairs: MatchWordPair[];
}

export interface DragDropGame {
  type: 'drag-and-drop';
  id: string;
  title: string | LocalizedText;
  instructions: string | LocalizedText;
  tokens: string[];
  correctOrder: string[];
}

export interface ListeningSprintRound {
  id: string;
  audioText: string;
  prompt: string;
  options: string[];
  correct: number;
}

export interface ListeningSprintGame {
  type: 'listening-sprint';
  id: string;
  title: string | LocalizedText;
  instructions: string | LocalizedText;
  rounds: ListeningSprintRound[];
}

export type MiniGame = MatchWordsGame | DragDropGame | ListeningSprintGame;

export interface LevelGameCollection {
  intro: string | LocalizedText;
  games: MiniGame[];
}

export interface WordOfDayEntry {
  id: string;
  word: string | LocalizedText;
  translation: string | LocalizedText;
  example: string | LocalizedText;
  tip: string | LocalizedText;
}

export interface CultureSpotlightEntry {
  id: string;
  title: string | LocalizedText;
  summary: string | LocalizedText;
  tradition: string | LocalizedText;
  phrase: string | LocalizedText;
  practiceTip: string | LocalizedText;
}

export interface LevelContent {
  level: LevelSummary;
  videos: VideoLesson[];
  grammar: GrammarTopic[];
  shadowing: ShadowingTask[];
  skills: SkillsContent;
  moduleTest: ModuleTestQuestion[];
}

export interface AchievementDefinition {
  id: string;
  icon: string;
  title: string | LocalizedText;
  desc: string | LocalizedText;
  target: number;
}

export interface LearningCatalog {
  levels: LevelSummary[];
  achievements: AchievementDefinition[];
  diagnosticTest: DiagnosticQuestion[];
  byLevel: Record<LevelId, LevelContent>;
  gamesByLevel: Record<LevelId, LevelGameCollection>;
  wordBank: WordOfDayEntry[];
  cultureBank: CultureSpotlightEntry[];
}
