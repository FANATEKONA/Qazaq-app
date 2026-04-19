import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import {
  AssessmentResponseInput,
  ContentType,
  LevelId,
  MiniGameType,
  SkillType,
  UserRole,
} from '../app/shared/models/content';

export interface StoredResumeState {
  levelId: LevelId;
  contentType: ContentType;
  itemId: string;
  updatedAt: string;
}

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string;
  teacherId: string | null;
  passwordSalt: string;
  passwordHash: string;
  currentLevel: LevelId;
  recommendedLevel: LevelId | null;
  streak: number;
  xp: number;
  lastActivityDate: string | null;
  createdAt: string;
  updatedAt: string;
  resume: StoredResumeState | null;
}

export interface StoredSession {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  lastSeenAt: string;
  userAgent: string;
  ip: string;
}

export interface StoredDiagnosticAttempt {
  id: string;
  userId: string;
  responses: AssessmentResponseInput[];
  score: number;
  totalQuestions: number;
  recommendedLevel: LevelId;
  createdAt: string;
}

export interface StoredVideoProgress {
  userId: string;
  levelId: LevelId;
  lessonId: string;
  status: 'started' | 'completed';
  lastPositionSeconds: number | null;
  watchedSeconds: number;
  lastViewedAt: string;
  completedAt: string | null;
}

export interface StoredGrammarProgress {
  userId: string;
  levelId: LevelId;
  topicId: string;
  attempts: number;
  correctAnswers: number;
  firstAttemptCorrect: boolean;
  lastAnswer: string;
  lastViewedAt: string;
  completedAt: string | null;
}

export interface StoredShadowingProgress {
  userId: string;
  levelId: LevelId;
  taskId: string;
  attempts: number;
  successfulAttempts: number;
  lastRecognizedText: string;
  lastScore: number;
  lastPracticedAt: string;
  completedAt: string | null;
}

export interface StoredSkillProgress {
  userId: string;
  levelId: LevelId;
  skillType: SkillType;
  selectedAnswers: number[];
  correctAnswers: number;
  totalQuestions: number;
  lastPracticedAt: string;
  completedAt: string | null;
}

export interface StoredMiniGameAttempt {
  id: string;
  userId: string;
  levelId: LevelId;
  gameType: MiniGameType;
  gameId: string;
  score: number;
  total: number;
  percent: number;
  completed: boolean;
  createdAt: string;
}

export interface StoredModuleTestAttempt {
  id: string;
  userId: string;
  levelId: LevelId;
  responses: AssessmentResponseInput[];
  score: number;
  totalQuestions: number;
  passed: boolean;
  percent: number;
  createdAt: string;
}

export interface StoredTeacherTask {
  id: string;
  teacherId: string;
  studentId: string;
  title: string;
  description: string;
  dueDate: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface StoredTeacherChangeRequest {
  id: string;
  studentId: string;
  currentTeacherId: string | null;
  requestedTeacherId: string;
  message: string;
  createdAt: string;
}

export interface StoredFeedbackMessage {
  id: string;
  userId: string | null;
  role: UserRole | null;
  message: string;
  createdAt: string;
}

export interface StoredAchievementUnlock {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
}

export interface StoredRewardClaim {
  id: string;
  userId: string;
  kind: 'content' | 'daily-task' | 'weekly-challenge' | 'streak-reward' | 'certificate';
  refId: string;
  xpAwarded: number;
  claimedAt: string;
}

export interface StoredCertificate {
  id: string;
  userId: string;
  levelId: LevelId;
  grade: string;
  issuedAt: string;
}

export interface DatabaseSchema {
  meta: {
    version: number;
    createdAt: string;
    updatedAt: string;
  };
  users: StoredUser[];
  sessions: StoredSession[];
  diagnosticAttempts: StoredDiagnosticAttempt[];
  videoProgress: StoredVideoProgress[];
  grammarProgress: StoredGrammarProgress[];
  shadowingProgress: StoredShadowingProgress[];
  skillProgress: StoredSkillProgress[];
  miniGameAttempts: StoredMiniGameAttempt[];
  moduleTestAttempts: StoredModuleTestAttempt[];
  teacherTasks: StoredTeacherTask[];
  teacherChangeRequests: StoredTeacherChangeRequest[];
  feedbackMessages: StoredFeedbackMessage[];
  achievementUnlocks: StoredAchievementUnlock[];
  rewardClaims: StoredRewardClaim[];
  certificates: StoredCertificate[];
}

export function createEmptyDatabase(): DatabaseSchema {
  const now = new Date().toISOString();
  return {
    meta: {
      version: 3,
      createdAt: now,
      updatedAt: now,
    },
    users: [],
    sessions: [],
    diagnosticAttempts: [],
    videoProgress: [],
    grammarProgress: [],
    shadowingProgress: [],
    skillProgress: [],
    miniGameAttempts: [],
    moduleTestAttempts: [],
    teacherTasks: [],
    teacherChangeRequests: [],
    feedbackMessages: [],
    achievementUnlocks: [],
    rewardClaims: [],
    certificates: [],
  };
}

export class FileStore {
  private readonly filePath: string;

  constructor(filePath = process.env['QAZAQ_DATA_FILE'] || resolve(process.cwd(), 'data', 'qazaq-db.json')) {
    this.filePath = resolve(filePath);
    this.ensureStorage();
  }

  read(): DatabaseSchema {
    this.ensureStorage();
    const parsed = JSON.parse(readFileSync(this.filePath, 'utf-8')) as Partial<DatabaseSchema>;
    return migrateDatabase(parsed);
  }

  write(data: DatabaseSchema): void {
    const dir = dirname(this.filePath);
    mkdirSync(dir, { recursive: true });

    data.meta.updatedAt = new Date().toISOString();
    const tempPath = `${this.filePath}.tmp`;
    writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    renameSync(tempPath, this.filePath);
  }

  update<T>(updater: (data: DatabaseSchema) => T): T {
    const data = this.read();
    const result = updater(data);
    this.write(data);
    return result;
  }

  private ensureStorage(): void {
    const dir = dirname(this.filePath);
    mkdirSync(dir, { recursive: true });

    if (!existsSync(this.filePath)) {
      this.write(createEmptyDatabase());
      return;
    }

    try {
      JSON.parse(readFileSync(this.filePath, 'utf-8'));
    } catch {
      if (existsSync(this.filePath)) {
        unlinkSync(this.filePath);
      }
      this.write(createEmptyDatabase());
    }
  }
}

function migrateDatabase(parsed: Partial<DatabaseSchema>): DatabaseSchema {
  const empty = createEmptyDatabase();
  const data: DatabaseSchema = {
    meta: {
      version: 3,
      createdAt: parsed.meta?.createdAt || empty.meta.createdAt,
      updatedAt: parsed.meta?.updatedAt || empty.meta.updatedAt,
    },
    users: (parsed.users ?? []).map((user) => {
      const role = normaliseStoredRole(user.role);
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role,
        avatar: normaliseStoredAvatar(user.avatar),
        teacherId: user.teacherId ?? null,
        passwordSalt: user.passwordSalt,
        passwordHash: user.passwordHash,
        currentLevel: user.currentLevel,
        recommendedLevel: user.recommendedLevel ?? null,
        streak: user.streak ?? 0,
        xp: user.xp ?? 0,
        lastActivityDate: user.lastActivityDate ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        resume: user.resume ?? null,
      };
    }),
    sessions: parsed.sessions ?? [],
    diagnosticAttempts: (parsed.diagnosticAttempts ?? []).map((attempt) => ({
      id: attempt.id,
      userId: attempt.userId,
      responses: attempt.responses ?? legacyAnswersToResponses((attempt as { answers?: number[] }).answers),
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      recommendedLevel: attempt.recommendedLevel,
      createdAt: attempt.createdAt,
    })),
    videoProgress: parsed.videoProgress ?? [],
    grammarProgress: parsed.grammarProgress ?? [],
    shadowingProgress: parsed.shadowingProgress ?? [],
    skillProgress: parsed.skillProgress ?? [],
    miniGameAttempts: (parsed.miniGameAttempts ?? []).map((attempt) => ({
      ...attempt,
      completed: attempt.completed ?? true,
    })),
    moduleTestAttempts: (parsed.moduleTestAttempts ?? []).map((attempt) => ({
      id: attempt.id,
      userId: attempt.userId,
      levelId: attempt.levelId,
      responses: attempt.responses ?? legacyAnswersToResponses((attempt as { answers?: number[] }).answers),
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      passed: attempt.passed,
      percent: attempt.percent,
      createdAt: attempt.createdAt,
    })),
    teacherTasks: parsed.teacherTasks ?? [],
    teacherChangeRequests: parsed.teacherChangeRequests ?? [],
    feedbackMessages: parsed.feedbackMessages ?? [],
    achievementUnlocks: parsed.achievementUnlocks ?? [],
    rewardClaims: parsed.rewardClaims ?? [],
    certificates: parsed.certificates ?? [],
  };

  return data;
}

function legacyAnswersToResponses(answers?: number[]): AssessmentResponseInput[] {
  return (answers ?? []).map((answer, index) => ({
    questionId: `legacy-${index + 1}`,
    answer,
  }));
}

function normaliseStoredRole(role: UserRole | 'admin' | null | undefined): UserRole {
  return role === 'teacher' ? 'teacher' : 'student';
}

function normaliseStoredAvatar(avatar: string | null | undefined): string {
  return avatar === '👩' || avatar === '👨' ? avatar : '👨';
}
