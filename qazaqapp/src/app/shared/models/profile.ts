import {
  AchievementDefinition,
  AssessmentResponseInput,
  ContentType,
  LevelId,
  LocalizedText,
  MiniGameType,
  SkillType,
  UserRole,
} from './content';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string;
  teacherId: string | null;
  currentLevel: LevelId;
  streak: number;
  totalPoints: number;
  xp: number;
  xpLevel: number;
  rankTitle: string;
  crown: string;
  recommendedLevel: LevelId | null;
  createdAt: string;
}

export interface ResumeState {
  levelId: LevelId;
  contentType: ContentType;
  itemId: string;
  title: string;
  route: string;
  updatedAt: string;
}

export interface CategoryStat {
  key: 'video' | 'grammar' | 'shadowing' | 'skills' | 'mini-games';
  label: string;
  value: number;
  total: number;
  color: string;
  percent: number;
}

export interface AchievementView extends AchievementDefinition {
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
}

export interface LevelProgressSummary {
  levelId: LevelId;
  completedItems: number;
  totalItems: number;
  percent: number;
}

export interface SkillInsight {
  id: string;
  label: string;
  icon: string;
  score: number;
  description: string;
}

export interface BadgeView {
  id: string;
  icon: string;
  label: string;
  tone: 'teal' | 'gold' | 'coral' | 'ink';
}

export interface StudySeriesDay {
  date: string;
  label: string;
  active: boolean;
  completedUnits: number;
}

export interface DailyTaskView {
  id: string;
  icon: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  rewardXp: number;
  route: string;
}

export interface WeeklyChallengeView {
  id: string;
  title: string;
  description: string;
  daysCompleted: number;
  totalDays: number;
  completed: boolean;
  rewardXp: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string;
  role: UserRole;
  xp: number;
  totalPoints: number;
  streak: number;
  crown: string;
}

export interface WordOfDayView {
  date: string;
  word: string | LocalizedText;
  translation: string | LocalizedText;
  example: string | LocalizedText;
  tip: string | LocalizedText;
}

export interface CultureSpotlightView {
  date: string;
  title: string | LocalizedText;
  summary: string | LocalizedText;
  tradition: string | LocalizedText;
  phrase: string | LocalizedText;
  practiceTip: string | LocalizedText;
}

export interface CertificateView {
  id: string;
  levelId: LevelId;
  title: string;
  issuedAt: string;
  grade: string;
  route: string;
}

export interface TeacherDirectoryEntry {
  id: string;
  name: string;
  avatar: string;
  studentCount: number;
}

export interface TeacherAssignmentView {
  teacher: TeacherDirectoryEntry;
  canRequestChange: boolean;
}

export interface StudentTaskView {
  id: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description: string;
  dueDate: string | null;
  createdAt: string;
  completed: boolean;
  completedAt: string | null;
}

export interface TeacherStudentView {
  id: string;
  name: string;
  avatar: string;
  currentLevel: LevelId;
  streak: number;
}

export interface TeacherIssuedTaskView {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  description: string;
  dueDate: string | null;
  createdAt: string;
  completed: boolean;
  completedAt: string | null;
}

export interface BotQuotaView {
  teacherChangeRequestsUsed: number;
  teacherChangeRequestsRemaining: number;
  weeklyLimit: number;
}

export interface RoleHubCard {
  id: string;
  title: string;
  value: string;
  subtitle: string;
}

export interface RoleHubResponse {
  role: UserRole;
  title: string;
  cards: RoleHubCard[];
  highlights: string[];
}

export interface ProfileResponse {
  user: SessionUser;
  currentLevelProgress: CategoryStat[];
  achievements: AchievementView[];
  badges: BadgeView[];
  resume: ResumeState | null;
  overallProgress: number;
  levelSummaries: LevelProgressSummary[];
  strongSkills: SkillInsight[];
  weakSkills: SkillInsight[];
  dailyTasks: DailyTaskView[];
  weeklyChallenge: WeeklyChallengeView;
  leaderboard: LeaderboardEntry[];
  wordOfDay: WordOfDayView;
  cultureSpotlight: CultureSpotlightView;
  certificates: CertificateView[];
  studySeries: StudySeriesDay[];
  nextLevelXp: number;
  roleHub: RoleHubResponse;
  teacherDirectory: TeacherDirectoryEntry[];
  teacherAssignment: TeacherAssignmentView | null;
  studentTasks: StudentTaskView[];
  teacherStudents: TeacherStudentView[];
  teacherIssuedTasks: TeacherIssuedTaskView[];
  botQuota: BotQuotaView;
}

export interface AuthResponse {
  user: SessionUser;
}

export interface ApiErrorResponse {
  error: string;
}

export interface SkillProgressPayload {
  levelId: LevelId;
  skillType: SkillType;
  selectedAnswers: number[];
  correctAnswers: number;
  totalQuestions: number;
  completed: boolean;
}

export interface MiniGameProgressPayload {
  levelId: LevelId;
  gameType: MiniGameType;
  gameId: string;
  score: number;
  total: number;
  completed: boolean;
}

export interface TeacherSelectionPayload {
  teacherId: string;
}

export interface TeacherChangeRequestPayload {
  teacherId: string;
  message: string;
}

export interface FeedbackPayload {
  message: string;
}

export interface TeacherTaskPayload {
  studentId: string;
  title: string;
  description: string;
  dueDate: string | null;
}

export interface StudentTaskCompletionPayload {
  taskId: string;
}

export interface AssessmentSubmitPayload {
  levelId?: LevelId;
  responses: AssessmentResponseInput[];
}
