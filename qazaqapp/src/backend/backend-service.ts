import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';

import { learningCatalog } from '../app/shared/content-catalog';
import {
  AchievementDefinition,
  AssessmentQuestion,
  AssessmentResponseInput,
  ContentType,
  CultureSpotlightEntry,
  LearningCatalog,
  LevelId,
  MiniGameType,
  ModuleTestQuestion,
  SkillType,
  UserRole,
  WordOfDayEntry,
} from '../app/shared/models/content';
import {
  AchievementView,
  AuthResponse,
  BadgeView,
  BotQuotaView,
  CategoryStat,
  CertificateView,
  CultureSpotlightView,
  DailyTaskView,
  FeedbackPayload,
  LeaderboardEntry,
  MiniGameProgressPayload,
  ProfileResponse,
  ResumeState,
  RoleHubResponse,
  SessionUser,
  SkillInsight,
  SkillProgressPayload,
  StudentTaskView,
  TeacherAssignmentView,
  TeacherDirectoryEntry,
  TeacherIssuedTaskView,
  TeacherSelectionPayload,
  TeacherChangeRequestPayload,
  TeacherStudentView,
  TeacherTaskPayload,
  StudySeriesDay,
  StudentTaskCompletionPayload,
  WeeklyChallengeView,
  WordOfDayView,
} from '../app/shared/models/profile';
import {
  DatabaseSchema,
  FileStore,
  StoredAchievementUnlock,
  StoredCertificate,
  StoredFeedbackMessage,
  StoredGrammarProgress,
  StoredMiniGameAttempt,
  StoredRewardClaim,
  StoredSession,
  StoredShadowingProgress,
  StoredSkillProgress,
  StoredTeacherChangeRequest,
  StoredTeacherTask,
  StoredUser,
} from './file-store';

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

interface Metrics {
  completedVideoByLevel: Record<LevelId, number>;
  completedGrammarByLevel: Record<LevelId, number>;
  completedShadowingByLevel: Record<LevelId, number>;
  completedSkillsByLevel: Record<LevelId, number>;
  completedMiniGamesByLevel: Record<LevelId, number>;
  completedModuleTestsByLevel: Record<LevelId, number>;
  completedUnits: number;
  totalUnits: number;
  completedShadowingTotal: number;
  completedMiniGamesTotal: number;
  vocabularyScore: number;
  perfectGrammarTopics: number;
  bestA1Percent: number;
  diagnosticAttempts: number;
  passedModuleTests: number;
  streak: number;
  grammarAccuracy: number;
  shadowingAverage: number;
  skillsAccuracy: number;
  miniGameAverage: number;
  activityByDate: Record<string, number>;
  completedToday: {
    video: number;
    grammar: number;
    shadowing: number;
    skills: number;
    miniGames: number;
    units: number;
  };
  xpToday: number;
  certificatesCount: number;
}

export interface RequestMeta {
  ip: string;
  userAgent: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  avatar?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface VideoProgressPayload {
  levelId: LevelId;
  lessonId: string;
  status: 'started' | 'completed';
  lastPositionSeconds?: number | null;
  watchedSeconds?: number;
}

export interface GrammarProgressPayload {
  levelId: LevelId;
  topicId: string;
  answer: string;
  isCorrect: boolean;
  completed: boolean;
}

export interface ShadowingProgressPayload {
  levelId: LevelId;
  taskId: string;
  recognizedText: string;
  isMatch: boolean;
}

export interface DiagnosticPayload {
  responses: AssessmentResponseInput[];
}

export interface ModuleTestPayload {
  levelId: LevelId;
  responses: AssessmentResponseInput[];
}

export interface CheckpointPayload {
  levelId: LevelId;
  contentType: ContentType;
  itemId: string;
}

export interface SessionResult extends AuthResponse {
  token: string;
}

export class BackendService {
  private readonly catalog: LearningCatalog;

  constructor(private readonly store = new FileStore()) {
    this.catalog = learningCatalog;
  }

  getCatalog(): LearningCatalog {
    return this.catalog;
  }

  getLeaderboard(limit = 20): LeaderboardEntry[] {
    return this.store.update((db) => this.buildLeaderboard(db, limit));
  }

  register(payload: RegisterPayload, meta: RequestMeta): SessionResult {
    const name = payload.name?.trim();
    const email = normaliseEmail(payload.email);
    const password = payload.password?.trim();
    const role = normaliseRole(payload.role);
    const avatar = normaliseAvatar(payload.avatar, role);

    if (!name || name.length < 2) {
      throw new HttpError(400, 'Имя должно содержать минимум 2 символа.');
    }
    if (!isValidEmail(email)) {
      throw new HttpError(400, 'Укажите корректный email.');
    }
    if (!password || password.length < 6) {
      throw new HttpError(400, 'Пароль должен содержать минимум 6 символов.');
    }

    return this.store.update((db) => {
      if (db.users.some((user) => user.email === email)) {
        throw new HttpError(409, 'Пользователь с таким email уже существует.');
      }

      const now = new Date().toISOString();
      const salt = randomBytes(16).toString('hex');
      const user: StoredUser = {
        id: randomUUID(),
        email,
        name,
        role,
        avatar,
        teacherId: null,
        passwordSalt: salt,
        passwordHash: hashPassword(password, salt),
        currentLevel: 'a1',
        recommendedLevel: null,
        streak: 0,
        xp: 0,
        lastActivityDate: null,
        createdAt: now,
        updatedAt: now,
        resume: null,
      };

      db.users.push(user);
      this.syncUserSystems(user.id, db);
      const session = createSessionRecord(user.id, meta, now);
      db.sessions.push(session.record);

      return {
        token: session.token,
        user: this.buildSessionUser(user, db),
      };
    });
  }

  login(payload: LoginPayload, meta: RequestMeta): SessionResult {
    const email = normaliseEmail(payload.email);
    const password = payload.password?.trim();

    if (!isValidEmail(email) || !password) {
      throw new HttpError(400, 'Введите email и пароль.');
    }

    return this.store.update((db) => {
      cleanupExpiredSessions(db);
      const user = db.users.find((item) => item.email === email);
      if (!user) {
        throw new HttpError(401, 'Неверный email или пароль.');
      }

      const expectedHash = hashPassword(password, user.passwordSalt);
      if (!safeEqual(user.passwordHash, expectedHash)) {
        throw new HttpError(401, 'Неверный email или пароль.');
      }

      this.syncUserSystems(user.id, db);
      const session = createSessionRecord(user.id, meta);
      db.sessions.push(session.record);

      return {
        token: session.token,
        user: this.buildSessionUser(user, db),
      };
    });
  }

  logout(token: string | null): void {
    if (!token) {
      return;
    }

    this.store.update((db) => {
      db.sessions = db.sessions.filter((session) => session.tokenHash !== hashToken(token));
    });
  }

  getSessionUser(token: string | null): SessionUser | null {
    if (!token) {
      return null;
    }

    return this.store.update((db) => {
      cleanupExpiredSessions(db);
      const session = db.sessions.find((item) => item.tokenHash === hashToken(token));
      if (!session) {
        return null;
      }

      session.lastSeenAt = new Date().toISOString();
      const user = db.users.find((item) => item.id === session.userId);
      if (!user) {
        return null;
      }

      this.syncUserSystems(user.id, db);
      return this.buildSessionUser(user, db);
    });
  }

  getProfile(userId: string): ProfileResponse {
    return this.store.update((db) => {
      const user = this.requireUser(userId, db);
      this.syncUserSystems(user.id, db);
      return this.buildProfile(user.id, db);
    });
  }

  selectTeacher(userId: string, payload: TeacherSelectionPayload): ProfileResponse {
    return this.store.update((db) => {
      const user = this.requireUser(userId, db);
      if (user.role !== 'student') {
        throw new HttpError(403, 'Only students can select a teacher.');
      }

      const teacher = db.users.find((item) => item.id === payload.teacherId && item.role === 'teacher');
      if (!teacher) {
        throw new HttpError(404, 'Teacher not found.');
      }

      if (user.teacherId && user.teacherId !== teacher.id) {
        throw new HttpError(409, 'Teacher is already assigned. Use the bot request to change teacher.');
      }

      user.teacherId = teacher.id;
      user.updatedAt = new Date().toISOString();
      return this.buildProfile(user.id, db);
    });
  }

  requestTeacherChange(userId: string, payload: TeacherChangeRequestPayload): ProfileResponse {
    return this.store.update((db) => {
      const user = this.requireUser(userId, db);
      if (user.role !== 'student') {
        throw new HttpError(403, 'Only students can request teacher changes.');
      }

      const teacher = db.users.find((item) => item.id === payload.teacherId && item.role === 'teacher');
      if (!teacher) {
        throw new HttpError(404, 'Teacher not found.');
      }

      if (user.teacherId === teacher.id) {
        throw new HttpError(409, 'This teacher is already assigned.');
      }

      const recentRequests = db.teacherChangeRequests.filter(
        (item) => item.studentId === user.id && isWithinLastDays(item.createdAt, 7),
      );
      if (recentRequests.length >= 2) {
        throw new HttpError(429, 'You can send only 2 teacher change requests per week.');
      }

      const request: StoredTeacherChangeRequest = {
        id: randomUUID(),
        studentId: user.id,
        currentTeacherId: user.teacherId,
        requestedTeacherId: teacher.id,
        message: payload.message.trim(),
        createdAt: new Date().toISOString(),
      };
      db.teacherChangeRequests.push(request);
      return this.buildProfile(user.id, db);
    });
  }

  submitFeedback(userId: string | null, payload: FeedbackPayload): ProfileResponse | { ok: true } {
    return this.store.update((db) => {
      const message = payload.message.trim();
      if (!message) {
        throw new HttpError(400, 'Feedback message cannot be empty.');
      }

      const user = userId ? this.requireUser(userId, db) : null;
      const record: StoredFeedbackMessage = {
        id: randomUUID(),
        userId: user?.id ?? null,
        role: user?.role ?? null,
        message,
        createdAt: new Date().toISOString(),
      };
      db.feedbackMessages.push(record);
      return user ? this.buildProfile(user.id, db) : { ok: true };
    });
  }

  createTeacherTask(userId: string, payload: TeacherTaskPayload): ProfileResponse {
    return this.store.update((db) => {
      const teacher = this.requireUser(userId, db);
      if (teacher.role !== 'teacher') {
        throw new HttpError(403, 'Only teachers can create tasks.');
      }

      const student = db.users.find((item) => item.id === payload.studentId && item.role === 'student');
      if (!student || student.teacherId !== teacher.id) {
        throw new HttpError(404, 'Student not found in your group.');
      }

        if (!payload.title.trim() || !payload.description.trim()) {
          throw new HttpError(400, 'Task title and description are required.');
        }

        const dueDate = normaliseDueDate(payload.dueDate);

        const task: StoredTeacherTask = {
          id: randomUUID(),
          teacherId: teacher.id,
          studentId: student.id,
          title: payload.title.trim(),
          description: payload.description.trim(),
          dueDate,
          createdAt: new Date().toISOString(),
          completedAt: null,
        };
      db.teacherTasks.push(task);
      return this.buildProfile(teacher.id, db);
    });
  }

  completeStudentTask(userId: string, payload: StudentTaskCompletionPayload): ProfileResponse {
    return this.store.update((db) => {
      const user = this.requireUser(userId, db);
      const task = db.teacherTasks.find((item) => item.id === payload.taskId && item.studentId === user.id);
      if (!task) {
        throw new HttpError(404, 'Task not found.');
      }

      if (!task.completedAt) {
        task.completedAt = new Date().toISOString();
        this.grantXp(user, db, 'content', `teacher-task:${task.id}`, 45);
      }

      return this.buildProfile(user.id, db);
    });
  }

  saveCheckpoint(userId: string, payload: CheckpointPayload): ProfileResponse {
    return this.store.update((db) => {
      const user = this.requireUser(userId, db);
      this.assertCheckpointExists(payload.levelId, payload.contentType, payload.itemId);

      const now = new Date().toISOString();
      touchLearningState(user, payload.levelId, payload.contentType, payload.itemId, now);
      this.syncUserSystems(user.id, db);
      return this.buildProfile(user.id, db);
    });
  }

  saveDiagnostic(userId: string, payload: DiagnosticPayload): { recommendedLevel: LevelId; profile: ProfileResponse } {
    return this.store.update((db) => {
      const user = this.requireUser(userId, db);
      const responses = Array.isArray(payload.responses) ? payload.responses : [];
      const questions = this.catalog.diagnosticTest;

      if (responses.length !== questions.length) {
        throw new HttpError(400, 'Диагностический тест отправлен не полностью.');
      }

      const score = this.scoreAssessmentAttempt(questions, responses);
      const ratio = score / questions.length;
      const recommendedLevel: LevelId = ratio >= 0.9 ? 'b1' : ratio >= 0.65 ? 'a2' : 'a1';
      const now = new Date().toISOString();

      db.diagnosticAttempts.push({
        id: randomUUID(),
        userId,
        responses,
        score,
        totalQuestions: questions.length,
        recommendedLevel,
        createdAt: now,
      });

      user.recommendedLevel = recommendedLevel;
      touchLearningState(user, recommendedLevel, 'video', '1', now);
      this.grantXp(user, db, 'content', 'diagnostic:first', 40);
      this.syncUserSystems(user.id, db);

      return {
        recommendedLevel,
        profile: this.buildProfile(user.id, db),
      };
    });
  }

  saveVideoProgress(userId: string, payload: VideoProgressPayload): ProfileResponse {
    return this.store.update((db) => {
      const user = this.requireUser(userId, db);
      this.assertVideoExists(payload.levelId, payload.lessonId);
      const now = new Date().toISOString();
      const current = db.videoProgress.find(
        (item) => item.userId === userId && item.levelId === payload.levelId && item.lessonId === payload.lessonId,
      );

      let newlyCompleted = false;

      if (current) {
        current.status = payload.status;
        current.lastPositionSeconds = payload.lastPositionSeconds ?? current.lastPositionSeconds;
        current.watchedSeconds = Math.max(current.watchedSeconds, payload.watchedSeconds ?? current.watchedSeconds);
        current.lastViewedAt = now;
        if (payload.status === 'completed' && !current.completedAt) {
          current.completedAt = now;
          newlyCompleted = true;
        }
      } else {
        db.videoProgress.push({
          userId,
          levelId: payload.levelId,
          lessonId: payload.lessonId,
          status: payload.status,
          lastPositionSeconds: payload.lastPositionSeconds ?? null,
          watchedSeconds: payload.watchedSeconds ?? 0,
          lastViewedAt: now,
          completedAt: payload.status === 'completed' ? now : null,
        });
        newlyCompleted = payload.status === 'completed';
      }

      touchLearningState(user, payload.levelId, 'video', payload.lessonId, now);
      if (newlyCompleted) {
        this.grantXp(user, db, 'content', `video:${payload.levelId}:${payload.lessonId}`, 70);
      }
      this.syncUserSystems(user.id, db);
      return this.buildProfile(user.id, db);
    });
  }

  saveGrammarProgress(userId: string, payload: GrammarProgressPayload): ProfileResponse {
    return this.store.update((db) => {
      const user = this.requireUser(userId, db);
      this.assertGrammarExists(payload.levelId, payload.topicId);
      const now = new Date().toISOString();
      const current = db.grammarProgress.find(
        (item) => item.userId === userId && item.levelId === payload.levelId && item.topicId === payload.topicId,
      );

      let newlyCompleted = false;

      if (current) {
        current.attempts += 1;
        if (payload.isCorrect) {
          current.correctAnswers += 1;
        } else {
          current.firstAttemptCorrect = false;
        }
        current.lastAnswer = payload.answer.trim();
        current.lastViewedAt = now;
        if (payload.completed && payload.isCorrect && !current.completedAt) {
          current.completedAt = now;
          newlyCompleted = true;
        }
      } else {
        const record: StoredGrammarProgress = {
          userId,
          levelId: payload.levelId,
          topicId: payload.topicId,
          attempts: 1,
          correctAnswers: payload.isCorrect ? 1 : 0,
          firstAttemptCorrect: payload.isCorrect,
          lastAnswer: payload.answer.trim(),
          lastViewedAt: now,
          completedAt: payload.completed && payload.isCorrect ? now : null,
        };
        db.grammarProgress.push(record);
        newlyCompleted = Boolean(record.completedAt);
      }

      touchLearningState(user, payload.levelId, 'grammar', payload.topicId, now);
      if (newlyCompleted) {
        this.grantXp(user, db, 'content', `grammar:${payload.levelId}:${payload.topicId}`, 60);
      }
      this.syncUserSystems(user.id, db);
      return this.buildProfile(user.id, db);
    });
  }

  saveShadowingProgress(userId: string, payload: ShadowingProgressPayload): ProfileResponse {
    return this.store.update((db) => {
      const user = this.requireUser(userId, db);
      this.assertShadowingExists(payload.levelId, payload.taskId);
      const now = new Date().toISOString();
      const score = payload.isMatch ? 100 : estimateSpeechScore(payload.recognizedText);
      const current = db.shadowingProgress.find(
        (item) => item.userId === userId && item.levelId === payload.levelId && item.taskId === payload.taskId,
      );

      let newlyCompleted = false;

      if (current) {
        current.attempts += 1;
        if (payload.isMatch) {
          current.successfulAttempts += 1;
        }
        current.lastRecognizedText = payload.recognizedText.trim();
        current.lastScore = score;
        current.lastPracticedAt = now;
        if (payload.isMatch && !current.completedAt) {
          current.completedAt = now;
          newlyCompleted = true;
        }
      } else {
        const record: StoredShadowingProgress = {
          userId,
          levelId: payload.levelId,
          taskId: payload.taskId,
          attempts: 1,
          successfulAttempts: payload.isMatch ? 1 : 0,
          lastRecognizedText: payload.recognizedText.trim(),
          lastScore: score,
          lastPracticedAt: now,
          completedAt: payload.isMatch ? now : null,
        };
        db.shadowingProgress.push(record);
        newlyCompleted = Boolean(record.completedAt);
      }

      touchLearningState(user, payload.levelId, 'shadowing', payload.taskId, now);
      if (newlyCompleted) {
        this.grantXp(user, db, 'content', `shadowing:${payload.levelId}:${payload.taskId}`, 65);
      }
      this.syncUserSystems(user.id, db);
      return this.buildProfile(user.id, db);
    });
  }

  saveSkillProgress(userId: string, payload: SkillProgressPayload): ProfileResponse {
    return this.store.update((db) => {
      const user = this.requireUser(userId, db);
      const questions = this.getSkillQuestions(payload.levelId, payload.skillType);
      const normalizedAnswers = Array.isArray(payload.selectedAnswers)
        ? payload.selectedAnswers.map((value) => (typeof value === 'number' ? value : -1))
        : [];

      if (normalizedAnswers.length !== questions.length) {
        throw new HttpError(400, 'Нужно ответить на все вопросы раздела.');
      }

      const correctAnswers = questions.reduce((sum, question, index) => {
        return sum + (question.correct === normalizedAnswers[index] ? 1 : 0);
      }, 0);
      const completed = normalizedAnswers.every((value) => value >= 0);
      const now = new Date().toISOString();
      const current = db.skillProgress.find(
        (item) => item.userId === userId && item.levelId === payload.levelId && item.skillType === payload.skillType,
      );

      let newlyCompleted = false;

      if (current) {
        const wasCompleted = Boolean(current.completedAt);
        current.selectedAnswers = [...normalizedAnswers];
        current.correctAnswers = correctAnswers;
        current.totalQuestions = questions.length;
        current.lastPracticedAt = now;
        if (completed) {
          current.completedAt = now;
        }
        newlyCompleted = !wasCompleted && completed;
      } else {
        const record: StoredSkillProgress = {
          userId,
          levelId: payload.levelId,
          skillType: payload.skillType,
          selectedAnswers: [...normalizedAnswers],
          correctAnswers,
          totalQuestions: questions.length,
          lastPracticedAt: now,
          completedAt: completed ? now : null,
        };
        db.skillProgress.push(record);
        newlyCompleted = Boolean(record.completedAt);
      }

      touchLearningState(user, payload.levelId, 'skills', payload.skillType, now);
      if (newlyCompleted) {
        this.grantXp(user, db, 'content', `skills:${payload.levelId}:${payload.skillType}`, 80);
      }
      this.syncUserSystems(user.id, db);
      return this.buildProfile(user.id, db);
    });
  }

  saveMiniGameProgress(userId: string, payload: MiniGameProgressPayload): ProfileResponse {
    return this.store.update((db) => {
      const user = this.requireUser(userId, db);
      this.assertMiniGameExists(payload.levelId, payload.gameType, payload.gameId);

      const total = Math.max(1, payload.total);
      const percent = Math.round((payload.score / total) * 100);
      const now = new Date().toISOString();

      const attempt: StoredMiniGameAttempt = {
        id: randomUUID(),
        userId,
        levelId: payload.levelId,
        gameType: payload.gameType,
        gameId: payload.gameId,
        score: payload.score,
        total,
        percent,
        completed: payload.completed,
        createdAt: now,
      };

      db.miniGameAttempts.push(attempt);
      touchLearningState(user, payload.levelId, 'mini-games', payload.gameId, now);

      if (payload.completed) {
        this.grantXp(user, db, 'content', `mini-game:${payload.levelId}:${payload.gameId}`, 50);
      }
      this.syncUserSystems(user.id, db);
      return this.buildProfile(user.id, db);
    });
  }

  saveModuleTest(userId: string, payload: ModuleTestPayload): ProfileResponse {
    return this.store.update((db) => {
      const user = this.requireUser(userId, db);
      const questions = this.getModuleQuestions(payload.levelId);

      if (payload.responses.length !== questions.length) {
        throw new HttpError(400, 'Итоговый тест отправлен не полностью.');
      }

      const score = this.scoreAssessmentAttempt(questions, payload.responses);
      const percent = Math.round((score / questions.length) * 100);
      const passed = percent >= 60;
      const now = new Date().toISOString();

      db.moduleTestAttempts.push({
        id: randomUUID(),
        userId,
        levelId: payload.levelId,
        responses: [...payload.responses],
        score,
        totalQuestions: questions.length,
        passed,
        percent,
        createdAt: now,
      });

      if (passed) {
        this.grantXp(user, db, 'content', `module-test:${payload.levelId}`, 140);
      }

      const nextLevel = passed ? getNextLevel(payload.levelId) : null;
      if (nextLevel) {
        touchLearningState(user, nextLevel, 'video', '1', now);
      } else {
        touchLearningState(user, payload.levelId, 'module-test', 'test', now);
      }

      this.syncUserSystems(user.id, db);
      return this.buildProfile(user.id, db);
    });
  }

  private buildSessionUser(user: StoredUser, db: DatabaseSchema): SessionUser {
    const metrics = this.collectMetrics(user.id, user, db);
    const unlocks = db.achievementUnlocks.filter((item) => item.userId === user.id).length;
    const totalPoints = calculateTotalPoints(user.xp, metrics, unlocks);
    const xpLevel = calculateXpLevel(user.xp);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      teacherId: user.teacherId,
      currentLevel: user.currentLevel,
      streak: user.streak,
      totalPoints,
      xp: user.xp,
      xpLevel,
      rankTitle: getRankTitle(user.role, xpLevel),
      crown: getCrownLabel(totalPoints),
      recommendedLevel: user.recommendedLevel,
      createdAt: user.createdAt,
    };
  }

  private buildProfile(userId: string, db: DatabaseSchema): ProfileResponse {
    const user = this.requireUser(userId, db);
    const metrics = this.collectMetrics(user.id, user, db);
    const currentLevelContent = this.catalog.byLevel[user.currentLevel];
    const sessionUser = this.buildSessionUser(user, db);
    const dailyTasks = this.buildDailyTasks(user, metrics);
    const studySeries = buildStudySeries(metrics.activityByDate);
    const weeklyChallenge = buildWeeklyChallenge(studySeries);

    const currentLevelProgress: CategoryStat[] = [
      stat('video', 'Видеоуроки', metrics.completedVideoByLevel[user.currentLevel], currentLevelContent.videos.length, '#2f80ed'),
      stat('grammar', 'Грамматика', metrics.completedGrammarByLevel[user.currentLevel], currentLevelContent.grammar.length, '#f2994a'),
      stat('shadowing', 'Shadowing', metrics.completedShadowingByLevel[user.currentLevel], currentLevelContent.shadowing.length, '#eb5757'),
      stat('skills', 'Reading & Listening', metrics.completedSkillsByLevel[user.currentLevel], 2, '#27ae60'),
      stat('mini-games', 'Mini-games', metrics.completedMiniGamesByLevel[user.currentLevel], this.catalog.gamesByLevel[user.currentLevel].games.length, '#14b8a6'),
    ];

    const achievements: AchievementView[] = this.catalog.achievements.map((achievement) => {
      const unlock = db.achievementUnlocks.find(
        (item) => item.userId === user.id && item.achievementId === achievement.id,
      );
      return {
        ...achievement,
        unlocked: Boolean(unlock),
        unlockedAt: unlock?.unlockedAt ?? null,
        progress: Math.min(getAchievementProgress(achievement.id, metrics), achievement.target),
      };
    });

    const levelSummaries = this.catalog.levels.map((level) => {
      const content = this.catalog.byLevel[level.id];
      const totalItems =
        content.videos.length +
        content.grammar.length +
        content.shadowing.length +
        2 +
        this.catalog.gamesByLevel[level.id].games.length +
        1;
      const completedItems =
        metrics.completedVideoByLevel[level.id] +
        metrics.completedGrammarByLevel[level.id] +
        metrics.completedShadowingByLevel[level.id] +
        metrics.completedSkillsByLevel[level.id] +
        metrics.completedMiniGamesByLevel[level.id] +
        metrics.completedModuleTestsByLevel[level.id];

      return {
        levelId: level.id,
        completedItems,
        totalItems,
        percent: makePercent(completedItems, totalItems),
      };
    });

    const insights = this.buildSkillInsights(user, metrics);
    const certificates = db.certificates
      .filter((item) => item.userId === user.id)
      .sort((left, right) => right.issuedAt.localeCompare(left.issuedAt))
      .map((item) => toCertificateView(item));
    const teacherDirectory = this.buildTeacherDirectory(db);
    const teacherAssignment = this.buildTeacherAssignment(user, teacherDirectory);
    const studentTasks = this.buildStudentTasks(user, db);
    const teacherStudents = this.buildTeacherStudents(user, db);
      const teacherIssuedTasks = this.buildTeacherIssuedTasks(user, db);
      const botQuota = this.buildBotQuota(user, db);
      const cultureSpotlight = buildCultureSpotlight(this.catalog.cultureBank, new Date());

      return {
        user: sessionUser,
      currentLevelProgress,
      achievements,
      badges: this.buildBadges(user, sessionUser, metrics, certificates.length),
      resume: buildResume(user.resume, this.catalog),
      overallProgress: makePercent(metrics.completedUnits, metrics.totalUnits),
      levelSummaries,
      strongSkills: insights.strong,
      weakSkills: insights.weak,
        dailyTasks,
        weeklyChallenge,
        leaderboard: this.buildLeaderboard(db, 8),
        wordOfDay: buildWordOfDay(this.catalog.wordBank, new Date()),
        cultureSpotlight,
        certificates,
      studySeries,
      nextLevelXp: nextLevelThreshold(user.xp),
      roleHub: this.buildRoleHub(user, db, sessionUser, metrics, certificates.length),
      teacherDirectory,
      teacherAssignment,
      studentTasks,
      teacherStudents,
      teacherIssuedTasks,
      botQuota,
    };
  }

  private buildDailyTasks(user: StoredUser, metrics: Metrics): DailyTaskView[] {
    return [
      {
        id: 'video-spark',
        icon: '🎬',
        title: 'Видео дня',
        description: 'Завершите хотя бы один видеоурок.',
        target: 1,
        progress: metrics.completedToday.video,
        completed: metrics.completedToday.video >= 1,
        rewardXp: 35,
        route: `/levels/${user.currentLevel}/video/1`,
      },
      {
        id: 'practice-loop',
        icon: '🧠',
        title: 'Практика дня',
        description: 'Завершите грамматику или shadowing-сессию.',
        target: 1,
        progress: metrics.completedToday.grammar + metrics.completedToday.shadowing,
        completed: metrics.completedToday.grammar + metrics.completedToday.shadowing >= 1,
        rewardXp: 45,
        route: `/levels/${user.currentLevel}/grammar/1`,
      },
      {
        id: 'arcade-boost',
        icon: '🎮',
        title: 'Arcade Boost',
        description: 'Пройдите мини-игру или раздел навыков.',
        target: 1,
        progress: metrics.completedToday.miniGames + metrics.completedToday.skills,
        completed: metrics.completedToday.miniGames + metrics.completedToday.skills >= 1,
        rewardXp: 55,
        route: `/levels/${user.currentLevel}/arcade`,
      },
    ];
  }

  private buildSkillInsights(user: StoredUser, metrics: Metrics): { strong: SkillInsight[]; weak: SkillInsight[] } {
    const currentLevel = user.currentLevel;
    const currentContent = this.catalog.byLevel[currentLevel];
    const miniGameTotal = this.catalog.gamesByLevel[currentLevel].games.length;

    const pool: SkillInsight[] = [
      {
        id: 'video',
        label: 'Видео',
        icon: '🎬',
        score: Math.round(ratio(metrics.completedVideoByLevel[currentLevel], currentContent.videos.length)),
        description: 'Показывает, как системно вы проходите лекционный материал.',
      },
      {
        id: 'grammar',
        label: 'Грамматика',
        icon: '📚',
        score: Math.round(ratio(metrics.completedGrammarByLevel[currentLevel], currentContent.grammar.length) * 0.7 + metrics.grammarAccuracy * 0.3),
        description: 'Оценивает качество выполнения грамматических тем.',
      },
      {
        id: 'shadowing',
        label: 'Speaking',
        icon: '🎙️',
        score: Math.round(ratio(metrics.completedShadowingByLevel[currentLevel], currentContent.shadowing.length) * 0.6 + metrics.shadowingAverage * 0.4),
        description: 'Отражает вашу устную практику и точность произношения.',
      },
      {
        id: 'skills',
        label: 'Reading & Listening',
        icon: '📖',
        score: Math.round(ratio(metrics.completedSkillsByLevel[currentLevel], 2) * 0.6 + metrics.skillsAccuracy * 0.4),
        description: 'Показывает понимание текста и аудио.',
      },
      {
        id: 'mini-games',
        label: 'Mini-games',
        icon: '🕹️',
        score: Math.round(ratio(metrics.completedMiniGamesByLevel[currentLevel], miniGameTotal) * 0.5 + metrics.miniGameAverage * 0.5),
        description: 'Оценивает скорость закрепления словаря и паттернов.',
      },
    ].sort((left, right) => right.score - left.score);

    return {
      strong: pool.slice(0, 2),
      weak: [...pool].reverse().slice(0, 2),
    };
  }

  private buildBadges(user: StoredUser, sessionUser: SessionUser, metrics: Metrics, certificateCount: number): BadgeView[] {
    const badges: BadgeView[] = [
      {
        id: `role-${user.role}`,
        icon: user.role === 'teacher' ? '🧑‍🏫' : '🧑‍🎓',
        label: user.role === 'teacher' ? 'Teacher' : 'Student',
        tone: 'ink',
      },
      { id: 'rank-title', icon: '🏵️', label: sessionUser.rankTitle, tone: 'gold' },
      { id: 'crown', icon: '👑', label: sessionUser.crown, tone: 'gold' },
    ];

    if (user.streak >= 7) {
      badges.push({ id: 'streak-7', icon: '🔥', label: '7-Day Streak', tone: 'coral' });
    }
    if (user.streak >= 14) {
      badges.push({ id: 'streak-14', icon: '⚡', label: '14-Day Focus', tone: 'coral' });
    }
    if (certificateCount > 0) {
      badges.push({ id: 'certificate', icon: '📜', label: 'Certified Learner', tone: 'teal' });
    }
    if (metrics.completedMiniGamesTotal >= 4) {
      badges.push({ id: 'arcade', icon: '🎮', label: 'Arcade Explorer', tone: 'teal' });
    }

    return badges.slice(0, 6);
  }

  private buildRoleHub(
    user: StoredUser,
    db: DatabaseSchema,
    sessionUser: SessionUser,
    metrics: Metrics,
    certificateCount: number,
  ): RoleHubResponse {
    const leaderboard = this.buildLeaderboard(db, 3);
    const studentCount = db.users.filter((item) => item.role === 'student').length;
    const teacherCount = db.users.filter((item) => item.role === 'teacher').length;
    const averageStudentStreak = studentCount
      ? Math.round(db.users.filter((item) => item.role === 'student').reduce((sum, item) => sum + item.streak, 0) / studentCount)
      : 0;
    const weeklyChallenge = buildWeeklyChallenge(buildStudySeries(metrics.activityByDate));

    if (user.role === 'teacher') {
      return {
        role: user.role,
        title: 'Teacher Studio',
        cards: [
          { id: 'students', title: 'Learners', value: `${studentCount}`, subtitle: 'Студентов в системе' },
          { id: 'avg-streak', title: 'Average streak', value: `${averageStudentStreak} d`, subtitle: 'Средняя регулярность' },
          { id: 'certificates', title: 'Certificates', value: `${db.certificates.length}`, subtitle: 'Выдано сертификатов' },
        ],
        highlights: leaderboard.length
          ? [`Топ-ученик недели: ${leaderboard[0].name}`, `Учителей в системе: ${teacherCount}`, 'Следите за слабым навыком студентов: Speaking']
          : ['Пока нет данных для teacher-аналитики.'],
      };
    }

    const completedDaily = this.buildDailyTasks(user, metrics).filter((item) => item.completed).length;
    return {
      role: user.role,
      title: 'Student Cockpit',
      cards: [
        { id: 'daily', title: 'Daily tasks', value: `${completedDaily}/3`, subtitle: 'Миссии на сегодня' },
        { id: 'weekly', title: '7-Day challenge', value: `${weeklyChallenge.daysCompleted}/7`, subtitle: 'Прогресс недели' },
        { id: 'certs', title: 'Certificates', value: `${certificateCount}`, subtitle: 'Подтвержденные уровни' },
      ],
      highlights: [
        `Следующий rank: ${getRankTitle(user.role, sessionUser.xpLevel + 1)}`,
        `Сегодня получено XP: ${metrics.xpToday}`,
        `Лучший навык сейчас: ${this.buildSkillInsights(user, metrics).strong[0]?.label ?? 'в развитии'}`,
      ],
    };
  }

  private buildTeacherDirectory(db: DatabaseSchema): TeacherDirectoryEntry[] {
    return db.users
      .filter((item) => item.role === 'teacher')
      .map((teacher) => ({
        id: teacher.id,
        name: teacher.name,
        avatar: teacher.avatar,
        studentCount: db.users.filter((student) => student.teacherId === teacher.id).length,
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  private buildTeacherAssignment(
    user: StoredUser,
    teacherDirectory: TeacherDirectoryEntry[],
  ): TeacherAssignmentView | null {
    if (user.role !== 'student' || !user.teacherId) {
      return null;
    }

    const teacher = teacherDirectory.find((item) => item.id === user.teacherId);
    return teacher
      ? {
          teacher,
          canRequestChange: true,
        }
      : null;
  }

  private buildStudentTasks(user: StoredUser, db: DatabaseSchema): StudentTaskView[] {
    if (user.role !== 'student') {
      return [];
    }

    return db.teacherTasks
      .filter((task) => task.studentId === user.id)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((task) => ({
        id: task.id,
        teacherId: task.teacherId,
        teacherName: db.users.find((item) => item.id === task.teacherId)?.name ?? 'Teacher',
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        completed: Boolean(task.completedAt),
        completedAt: task.completedAt,
      }));
  }

  private buildTeacherStudents(user: StoredUser, db: DatabaseSchema): TeacherStudentView[] {
    if (user.role !== 'teacher') {
      return [];
    }

    return db.users
      .filter((item) => item.role === 'student' && item.teacherId === user.id)
      .map((student) => ({
        id: student.id,
        name: student.name,
        avatar: student.avatar,
        currentLevel: student.currentLevel,
        streak: student.streak,
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  private buildTeacherIssuedTasks(user: StoredUser, db: DatabaseSchema): TeacherIssuedTaskView[] {
    if (user.role !== 'teacher') {
      return [];
    }

    return db.teacherTasks
      .filter((task) => task.teacherId === user.id)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((task) => ({
        id: task.id,
        studentId: task.studentId,
        studentName: db.users.find((item) => item.id === task.studentId)?.name ?? 'Student',
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        completed: Boolean(task.completedAt),
        completedAt: task.completedAt,
      }));
  }

  private buildBotQuota(user: StoredUser, db: DatabaseSchema): BotQuotaView {
    const used = db.teacherChangeRequests.filter((item) => item.studentId === user.id && isWithinLastDays(item.createdAt, 7)).length;
    return {
      teacherChangeRequestsUsed: used,
      teacherChangeRequestsRemaining: Math.max(0, 2 - used),
      weeklyLimit: 2,
    };
  }

  private buildLeaderboard(db: DatabaseSchema, limit: number): LeaderboardEntry[] {
    return db.users
      .map((user) => {
        const metrics = this.collectMetrics(user.id, user, db);
        const unlocks = db.achievementUnlocks.filter((item) => item.userId === user.id).length;
        const totalPoints = calculateTotalPoints(user.xp, metrics, unlocks);
        return { user, totalPoints };
      })
      .sort((left, right) => {
        if (right.totalPoints !== left.totalPoints) {
          return right.totalPoints - left.totalPoints;
        }
        if (right.user.xp !== left.user.xp) {
          return right.user.xp - left.user.xp;
        }
        return right.user.streak - left.user.streak;
      })
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        userId: entry.user.id,
        name: entry.user.name,
        avatar: entry.user.avatar,
        role: entry.user.role,
        xp: entry.user.xp,
        totalPoints: entry.totalPoints,
        streak: entry.user.streak,
        crown: getCrownLabel(entry.totalPoints),
      }));
  }

  private collectMetrics(userId: string, user: StoredUser, db: DatabaseSchema): Metrics {
    const completedVideoByLevel = createLevelCounter();
    const completedGrammarByLevel = createLevelCounter();
    const completedShadowingByLevel = createLevelCounter();
    const completedSkillsByLevel = createLevelCounter();
    const completedMiniGamesByLevel = createLevelCounter();
    const completedModuleTestsByLevel = createLevelCounter();
    const activityByDate: Record<string, number> = {};
    const today = dateKey(new Date());

    let perfectGrammarTopics = 0;
    let grammarCorrect = 0;
    let grammarAttempts = 0;
    let shadowingScoreTotal = 0;
    let shadowingScoreCount = 0;
    let skillsCorrect = 0;
    let skillsTotal = 0;
    let bestA1Percent = 0;
    const completedToday = { video: 0, grammar: 0, shadowing: 0, skills: 0, miniGames: 0, units: 0 };

    for (const item of db.videoProgress) {
      if (item.userId !== userId) continue;
      bumpActivity(activityByDate, item.lastViewedAt);
      if (item.completedAt) {
        completedVideoByLevel[item.levelId] += 1;
        if (dateKey(item.completedAt) === today) completedToday.video += 1;
      }
    }

    for (const item of db.grammarProgress) {
      if (item.userId !== userId) continue;
      bumpActivity(activityByDate, item.lastViewedAt);
      grammarCorrect += item.correctAnswers;
      grammarAttempts += item.attempts;
      if (item.completedAt) {
        completedGrammarByLevel[item.levelId] += 1;
        if (item.firstAttemptCorrect) perfectGrammarTopics += 1;
        if (dateKey(item.completedAt) === today) completedToday.grammar += 1;
      }
    }

    for (const item of db.shadowingProgress) {
      if (item.userId !== userId) continue;
      bumpActivity(activityByDate, item.lastPracticedAt);
      shadowingScoreTotal += item.lastScore;
      shadowingScoreCount += 1;
      if (item.completedAt) {
        completedShadowingByLevel[item.levelId] += 1;
        if (dateKey(item.completedAt) === today) completedToday.shadowing += 1;
      }
    }

    for (const item of db.skillProgress) {
      if (item.userId !== userId) continue;
      bumpActivity(activityByDate, item.lastPracticedAt);
      skillsCorrect += item.correctAnswers;
      skillsTotal += item.totalQuestions;
      if (item.completedAt) {
        completedSkillsByLevel[item.levelId] += 1;
        if (dateKey(item.completedAt) === today) completedToday.skills += 1;
      }
    }

    const bestMiniGames = new Map<string, StoredMiniGameAttempt>();
    for (const attempt of db.miniGameAttempts) {
      if (attempt.userId !== userId) continue;
      bumpActivity(activityByDate, attempt.createdAt);
      const key = `${attempt.levelId}:${attempt.gameId}`;
      const current = bestMiniGames.get(key);
      if (!current || attempt.percent > current.percent) {
        bestMiniGames.set(key, attempt);
      }
    }

    let miniGameScoreTotal = 0;
    let miniGameScoreCount = 0;
    for (const attempt of bestMiniGames.values()) {
      miniGameScoreTotal += attempt.percent;
      miniGameScoreCount += 1;
      if (attempt.completed) {
        completedMiniGamesByLevel[attempt.levelId] += 1;
        if (dateKey(attempt.createdAt) === today) completedToday.miniGames += 1;
      }
    }

    for (const attempt of db.moduleTestAttempts) {
      if (attempt.userId !== userId) continue;
      bumpActivity(activityByDate, attempt.createdAt);
      if (attempt.passed) completedModuleTestsByLevel[attempt.levelId] = 1;
      if (attempt.levelId === 'a1') bestA1Percent = Math.max(bestA1Percent, attempt.percent);
    }

    for (const attempt of db.diagnosticAttempts) {
      if (attempt.userId === userId) bumpActivity(activityByDate, attempt.createdAt);
    }

    const xpToday = db.rewardClaims
      .filter((item) => item.userId === userId && dateKey(item.claimedAt) === today)
      .reduce((sum, item) => sum + item.xpAwarded, 0);

    const completedUnits =
      sumValues(completedVideoByLevel) +
      sumValues(completedGrammarByLevel) +
      sumValues(completedShadowingByLevel) +
      sumValues(completedSkillsByLevel) +
      sumValues(completedMiniGamesByLevel) +
      sumValues(completedModuleTestsByLevel);

    completedToday.units =
      completedToday.video +
      completedToday.grammar +
      completedToday.shadowing +
      completedToday.skills +
      completedToday.miniGames;

    const totalUnits = this.catalog.levels.reduce((sum, level) => {
      const content = this.catalog.byLevel[level.id];
      return sum + content.videos.length + content.grammar.length + content.shadowing.length + 2 + this.catalog.gamesByLevel[level.id].games.length + 1;
    }, 0);

    const vocabularyScore =
      sumValues(completedVideoByLevel) * 12 +
      sumValues(completedGrammarByLevel) * 10 +
      sumValues(completedShadowingByLevel) * 8 +
      sumValues(completedSkillsByLevel) * 15 +
      sumValues(completedMiniGamesByLevel) * 10;

    if (user.lastActivityDate) {
      activityByDate[user.lastActivityDate] = Math.max(activityByDate[user.lastActivityDate] ?? 0, 1);
    }

    return {
      completedVideoByLevel,
      completedGrammarByLevel,
      completedShadowingByLevel,
      completedSkillsByLevel,
      completedMiniGamesByLevel,
      completedModuleTestsByLevel,
      completedUnits,
      totalUnits,
      completedShadowingTotal: sumValues(completedShadowingByLevel),
      completedMiniGamesTotal: sumValues(completedMiniGamesByLevel),
      vocabularyScore,
      perfectGrammarTopics,
      bestA1Percent,
      diagnosticAttempts: db.diagnosticAttempts.filter((item) => item.userId === userId).length,
      passedModuleTests: sumValues(completedModuleTestsByLevel),
      streak: user.streak,
      grammarAccuracy: grammarAttempts ? Math.round((grammarCorrect / grammarAttempts) * 100) : 0,
      shadowingAverage: shadowingScoreCount ? Math.round(shadowingScoreTotal / shadowingScoreCount) : 0,
      skillsAccuracy: skillsTotal ? Math.round((skillsCorrect / skillsTotal) * 100) : 0,
      miniGameAverage: miniGameScoreCount ? Math.round(miniGameScoreTotal / miniGameScoreCount) : 0,
      activityByDate,
      completedToday,
      xpToday,
      certificatesCount: db.certificates.filter((item) => item.userId === userId).length,
    };
  }

  private syncUserSystems(userId: string, db: DatabaseSchema): void {
    const user = this.requireUser(userId, db);
    this.syncCertificates(user, db);
    const metrics = this.collectMetrics(user.id, user, db);
    this.syncAchievements(user.id, metrics, db);
    this.syncStreakRewards(user, db);
    this.syncDailyTaskRewards(user, metrics, db);
    this.syncWeeklyChallengeReward(user, metrics, db);
  }

  private syncCertificates(user: StoredUser, db: DatabaseSchema): void {
    const attemptsByLevel = new Map<LevelId, number>();
    for (const attempt of db.moduleTestAttempts) {
      if (attempt.userId !== user.id || !attempt.passed) continue;
      const currentBest = attemptsByLevel.get(attempt.levelId) ?? 0;
      attemptsByLevel.set(attempt.levelId, Math.max(currentBest, attempt.percent));
    }

    for (const [levelId, bestPercent] of attemptsByLevel.entries()) {
      const existing = db.certificates.find((item) => item.userId === user.id && item.levelId === levelId);
      if (existing) continue;

      db.certificates.push({
        id: randomUUID(),
        userId: user.id,
        levelId,
        grade: toCertificateGrade(bestPercent),
        issuedAt: new Date().toISOString(),
      });
      this.grantXp(user, db, 'certificate', `certificate:${levelId}`, 120);
    }
  }

  private syncAchievements(userId: string, metrics: Metrics, db: DatabaseSchema): void {
    const now = new Date().toISOString();
    for (const achievement of this.catalog.achievements) {
      const alreadyUnlocked = db.achievementUnlocks.some((unlock) => unlock.userId === userId && unlock.achievementId === achievement.id);
      if (!alreadyUnlocked && getAchievementProgress(achievement.id, metrics) >= achievement.target) {
        const unlock: StoredAchievementUnlock = {
          id: randomUUID(),
          userId,
          achievementId: achievement.id,
          unlockedAt: now,
        };
        db.achievementUnlocks.push(unlock);
      }
    }
  }

  private syncStreakRewards(user: StoredUser, db: DatabaseSchema): void {
    for (const reward of [{ streak: 3, xp: 30 }, { streak: 7, xp: 80 }, { streak: 14, xp: 140 }, { streak: 30, xp: 260 }]) {
      if (user.streak >= reward.streak) {
        this.grantXp(user, db, 'streak-reward', `streak:${reward.streak}`, reward.xp);
      }
    }
  }

  private syncDailyTaskRewards(user: StoredUser, metrics: Metrics, db: DatabaseSchema): void {
    const today = dateKey(new Date());
    for (const task of this.buildDailyTasks(user, metrics)) {
      if (task.completed) {
        this.grantXp(user, db, 'daily-task', `${today}:${task.id}`, task.rewardXp);
      }
    }
  }

  private syncWeeklyChallengeReward(user: StoredUser, metrics: Metrics, db: DatabaseSchema): void {
    const challenge = buildWeeklyChallenge(buildStudySeries(metrics.activityByDate));
    if (challenge.completed) {
      this.grantXp(user, db, 'weekly-challenge', `week:${weekKey(new Date())}`, challenge.rewardXp);
    }
  }

  private grantXp(user: StoredUser, db: DatabaseSchema, kind: StoredRewardClaim['kind'], refId: string, xpAwarded: number): boolean {
    const exists = db.rewardClaims.some((claim) => claim.userId === user.id && claim.kind === kind && claim.refId === refId);
    if (exists) return false;

    db.rewardClaims.push({
      id: randomUUID(),
      userId: user.id,
      kind,
      refId,
      xpAwarded,
      claimedAt: new Date().toISOString(),
    });
    user.xp += xpAwarded;
    user.updatedAt = new Date().toISOString();
    return true;
  }

  private requireUser(userId: string, db: DatabaseSchema): StoredUser {
    const user = db.users.find((item) => item.id === userId);
    if (!user) throw new HttpError(401, 'Пользователь не найден.');
    return user;
  }

  private assertCheckpointExists(levelId: LevelId, contentType: ContentType, itemId: string): void {
    if (contentType === 'mini-games') {
      const exists = this.catalog.gamesByLevel[levelId]?.games.some((item) => item.id === itemId);
      if (!exists) throw new HttpError(404, 'Мини-игра не найдена.');
      return;
    }
    if (contentType === 'video') this.assertVideoExists(levelId, itemId);
    if (contentType === 'grammar') this.assertGrammarExists(levelId, itemId);
    if (contentType === 'shadowing') this.assertShadowingExists(levelId, itemId);
    if (contentType === 'skills' && itemId !== 'reading' && itemId !== 'listening') throw new HttpError(404, 'Раздел навыка не найден.');
    if (contentType === 'module-test') this.getModuleQuestions(levelId);
  }

  private assertVideoExists(levelId: LevelId, lessonId: string): void {
    const exists = this.catalog.byLevel[levelId]?.videos.some((item) => item.id === lessonId);
    if (!exists) throw new HttpError(404, 'Урок не найден.');
  }

  private assertGrammarExists(levelId: LevelId, topicId: string): void {
    const exists = this.catalog.byLevel[levelId]?.grammar.some((item) => item.id === topicId);
    if (!exists) throw new HttpError(404, 'Тема грамматики не найдена.');
  }

  private assertShadowingExists(levelId: LevelId, taskId: string): void {
    const exists = this.catalog.byLevel[levelId]?.shadowing.some((item) => item.id === taskId);
    if (!exists) throw new HttpError(404, 'Практика shadowing не найдена.');
  }

  private assertMiniGameExists(levelId: LevelId, gameType: MiniGameType, gameId: string): void {
    const exists = this.catalog.gamesByLevel[levelId]?.games.some((item) => item.id === gameId && item.type === gameType);
    if (!exists) throw new HttpError(404, 'Мини-игра не найдена.');
  }

  private getSkillQuestions(levelId: LevelId, skillType: SkillType) {
    const lesson = this.catalog.byLevel[levelId]?.skills[skillType];
    if (!lesson) throw new HttpError(404, 'Раздел навыков не найден.');
    return lesson.questions;
  }

  private getModuleQuestions(levelId: LevelId): ModuleTestQuestion[] {
    const questions = this.catalog.byLevel[levelId]?.moduleTest;
    if (!questions?.length) throw new HttpError(404, 'Итоговый тест уровня не найден.');
    return questions;
  }

  private scoreAssessmentAttempt(questions: AssessmentQuestion[], responses: AssessmentResponseInput[]): number {
    const responseByQuestion = new Map(responses.map((response) => [response.questionId, response]));

    return questions.reduce((sum, question) => {
      const response = responseByQuestion.get(question.id);
      if (!response) {
        throw new HttpError(400, 'Assessment response is incomplete.');
      }

      if (question.type === 'listening' && (response.listeningPlays ?? 0) > (question.maxAudioPlays ?? 3)) {
        throw new HttpError(400, 'Listening playback limit exceeded.');
      }

      if (question.type === 'speaking' && (response.speakingAttempts ?? 0) > (question.maxSpeakingAttempts ?? 3)) {
        throw new HttpError(400, 'Speaking attempt limit exceeded.');
      }

      return sum + (isAssessmentAnswerCorrect(question, response) ? 1 : 0);
    }, 0);
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

function stat(
  key: CategoryStat['key'],
  label: string,
  value: number,
  total: number,
  color: string,
): CategoryStat {
  return {
    key,
    label,
    value,
    total,
    color,
    percent: makePercent(value, total),
  };
}

function touchLearningState(
  user: StoredUser,
  levelId: LevelId,
  contentType: ContentType,
  itemId: string,
  updatedAt: string,
): void {
  user.currentLevel = levelId;
  user.resume = {
    levelId,
    contentType,
    itemId,
    updatedAt,
  };
  touchUserActivity(user, updatedAt);
}

function touchUserActivity(user: StoredUser, at: string): void {
  const currentDay = dateKey(at);
  const previousDay = user.lastActivityDate;

  if (!previousDay) {
    user.streak = 1;
  } else if (previousDay === currentDay) {
    user.updatedAt = at;
    return;
  } else {
    const diff = dayNumber(currentDay) - dayNumber(previousDay);
    user.streak = diff === 1 ? user.streak + 1 : 1;
  }

  user.lastActivityDate = currentDay;
  user.updatedAt = at;
}

function createLevelCounter(): Record<LevelId, number> {
  return {
    a1: 0,
    a2: 0,
    b1: 0,
    b2: 0,
  };
}

function buildResume(resume: StoredUser['resume'], catalog: LearningCatalog): ResumeState | null {
  if (!resume) {
    return null;
  }

  const fallback = {
    title: `Continue ${resume.levelId.toUpperCase()}`,
    route: `/levels/${resume.levelId}`,
  };

  if (resume.contentType === 'video') {
    const item = catalog.byLevel[resume.levelId]?.videos.find((entry) => entry.id === resume.itemId);
    return {
      ...resume,
      title: item?.title ?? fallback.title,
      route: item ? `/levels/${resume.levelId}/video/${resume.itemId}` : fallback.route,
    };
  }

  if (resume.contentType === 'grammar') {
    const item = catalog.byLevel[resume.levelId]?.grammar.find((entry) => entry.id === resume.itemId);
    return {
      ...resume,
      title: item?.title ?? fallback.title,
      route: item ? `/levels/${resume.levelId}/grammar/${resume.itemId}` : fallback.route,
    };
  }

  if (resume.contentType === 'shadowing') {
    const item = catalog.byLevel[resume.levelId]?.shadowing.find((entry) => entry.id === resume.itemId);
    return {
      ...resume,
      title: item?.title ?? fallback.title,
      route: item ? `/levels/${resume.levelId}/shadowing/${resume.itemId}` : fallback.route,
    };
  }

  if (resume.contentType === 'skills') {
    const skillType = resume.itemId === 'listening' ? 'listening' : 'reading';
    const lesson = catalog.byLevel[resume.levelId]?.skills[skillType];
    return {
      ...resume,
      title: lesson?.title ?? fallback.title,
      route: lesson ? `/levels/${resume.levelId}/skills/${skillType}` : fallback.route,
    };
  }

  if (resume.contentType === 'mini-games') {
    const game = catalog.gamesByLevel[resume.levelId]?.games.find((entry) => entry.id === resume.itemId);
    return {
      ...resume,
      title: game ? toDefaultText(game.title) : 'Mini-game arcade',
      route: game ? `/levels/${resume.levelId}/arcade?game=${resume.itemId}` : fallback.route,
    };
  }

  if (resume.contentType === 'module-test') {
    return {
      ...resume,
      title: `${resume.levelId.toUpperCase()} module test`,
      route: `/levels/${resume.levelId}/test`,
    };
  }

  return {
    ...resume,
    title: fallback.title,
    route: fallback.route,
  };
}

function getAchievementProgress(achievementId: AchievementDefinition['id'], metrics: Metrics): number {
  switch (achievementId) {
    case 'first-steps':
      return metrics.completedUnits;
    case 'discipline':
      return metrics.streak;
    case 'orator':
      return metrics.completedShadowingTotal;
    case 'master-a1':
      return metrics.bestA1Percent;
    case 'polyglot':
      return metrics.vocabularyScore;
    case 'mistake-free':
      return metrics.perfectGrammarTopics;
    default:
      return 0;
  }
}

function calculateTotalPoints(xp: number, metrics: Metrics, unlockCount: number): number {
  return (
    xp +
    metrics.completedUnits * 12 +
    metrics.streak * 18 +
    metrics.certificatesCount * 100 +
    unlockCount * 60
  );
}

function calculateXpLevel(xp: number): number {
  let level = 1;
  while (xp >= xpThreshold(level + 1)) {
    level += 1;
  }
  return level;
}

function nextLevelThreshold(xp: number): number {
  return xpThreshold(calculateXpLevel(xp) + 1);
}

function xpThreshold(level: number): number {
  if (level <= 1) {
    return 0;
  }
  return (level - 1) * level * 60;
}

function getRankTitle(role: UserRole, xpLevel: number): string {
  const studentRanks = ['Starter', 'Explorer', 'Navigator', 'Scholar', 'Ambassador', 'Legend'];
  const teacherRanks = ['Curator', 'Mentor', 'Coach', 'Lead Mentor', 'Faculty Lead', 'Master Guide'];
  const bank = role === 'teacher' ? teacherRanks : studentRanks;
  return bank[Math.min(bank.length - 1, Math.max(0, xpLevel - 1))];
}

function getCrownLabel(totalPoints: number): string {
  if (totalPoints >= 3200) {
    return 'Diamond Crown';
  }
  if (totalPoints >= 2200) {
    return 'Golden Crown';
  }
  if (totalPoints >= 1200) {
    return 'Silver Crown';
  }
  return 'Bronze Crown';
}

function createSessionRecord(
  userId: string,
  meta: RequestMeta,
  createdAt = new Date().toISOString(),
): { token: string; record: StoredSession } {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.parse(createdAt) + 1000 * 60 * 60 * 24 * 30).toISOString();
  return {
    token,
    record: {
      id: randomUUID(),
      userId,
      tokenHash: hashToken(token),
      createdAt,
      expiresAt,
      lastSeenAt: createdAt,
      userAgent: meta.userAgent,
      ip: meta.ip,
    },
  };
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString('hex');
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function cleanupExpiredSessions(db: DatabaseSchema): void {
  const now = Date.now();
  db.sessions = db.sessions.filter((session) => Date.parse(session.expiresAt) > now);
}

function normaliseEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

function normaliseRole(role: UserRole | null | undefined): UserRole {
  return role === 'teacher' ? role : 'student';
}

function normaliseAvatar(avatar: string | null | undefined, role: UserRole): string {
  const value = (avatar ?? '').trim();
  if (value === '👨' || value === '👩') {
    return value;
  }
  return role === 'teacher' ? '👩' : '👨';
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function makePercent(value: number, total: number): number {
  if (!total) {
    return 0;
  }
  return Math.round((value / total) * 100);
}

function ratio(value: number, total: number): number {
  return makePercent(value, total);
}

function sumValues(values: Record<LevelId, number>): number {
  return Object.values(values).reduce((sum, value) => sum + value, 0);
}

function estimateSpeechScore(recognizedText: string): number {
  const normalizedLength = recognizedText.trim().length;
  if (!normalizedLength) {
    return 15;
  }
  return Math.min(92, 30 + normalizedLength * 4);
}

function getNextLevel(levelId: LevelId): LevelId | null {
  const order: LevelId[] = ['a1', 'a2', 'b1', 'b2'];
  const index = order.indexOf(levelId);
  return index >= 0 && index < order.length - 1 ? order[index + 1] : null;
}

function buildWordOfDay(wordBank: WordOfDayEntry[], date: Date): WordOfDayView {
  if (!wordBank.length) {
    return {
      date: dateKey(date),
      word: 'Soz',
      translation: 'word',
      example: 'Bugingi soz kory bos.',
      tip: 'Add more words to the catalog.',
    };
  }

  const index = Math.abs(dayNumber(date)) % wordBank.length;
  const item = wordBank[index];
  return {
    date: dateKey(date),
    word: item.word,
    translation: item.translation,
    example: item.example,
    tip: item.tip,
  };
}

function buildCultureSpotlight(cultureBank: CultureSpotlightEntry[], date: Date): CultureSpotlightView {
  if (!cultureBank.length) {
    return {
      date: dateKey(date),
      title: 'Tradition of the day',
      summary: 'Culture content is being prepared.',
      tradition: 'A daily tradition card will appear here.',
      phrase: 'Assalym aleikum',
      practiceTip: 'Read the phrase aloud and connect it with a real-life context.',
    };
  }

  const index = Math.abs(dayNumber(date) + 3) % cultureBank.length;
  const item = cultureBank[index];
  return {
    date: dateKey(date),
    title: item.title,
    summary: item.summary,
    tradition: item.tradition,
    phrase: item.phrase,
    practiceTip: item.practiceTip,
  };
}

function buildStudySeries(activityByDate: Record<string, number>): StudySeriesDay[] {
  const series: StudySeriesDay[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - offset);
    const key = dateKey(date);
    const completedUnits = activityByDate[key] ?? 0;
    series.push({
      date: key,
      label: date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
      active: completedUnits > 0,
      completedUnits,
    });
  }

  return series;
}

function buildWeeklyChallenge(studySeries: StudySeriesDay[]): WeeklyChallengeView {
  const daysCompleted = studySeries.filter((item) => item.active).length;
  return {
    id: 'seven-day-sprint',
    title: '7-Day Challenge',
    description: 'Stay active every day this week to unlock the streak reward.',
    daysCompleted,
    totalDays: studySeries.length,
    completed: daysCompleted === studySeries.length,
    rewardXp: 180,
  };
}

function normaliseDueDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const dueDate = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(dueDate.getTime())) {
    throw new HttpError(400, 'Invalid due date.');
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (dueDate.getTime() < today.getTime()) {
    throw new HttpError(400, 'Tasks cannot have a past due date.');
  }

  return normalized;
}

function toDefaultText(value: string | { ru: string; en: string; kz: string }): string {
  return typeof value === 'string' ? value : value.ru;
}

function toCertificateView(certificate: StoredCertificate): CertificateView {
  return {
    id: certificate.id,
    levelId: certificate.levelId,
    title: `${certificate.levelId.toUpperCase()} Completion Certificate`,
    issuedAt: certificate.issuedAt,
    grade: certificate.grade,
    route: `/certificates/${certificate.levelId}`,
  };
}

function toCertificateGrade(percent: number): string {
  if (percent >= 95) {
    return 'A+';
  }
  if (percent >= 85) {
    return 'A';
  }
  if (percent >= 75) {
    return 'B';
  }
  if (percent >= 60) {
    return 'C';
  }
  return 'Attempted';
}

function dateKey(value: string | Date | null | undefined): string {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  return value.toISOString().slice(0, 10);
}

function bumpActivity(activityByDate: Record<string, number>, at: string | null | undefined): void {
  const key = dateKey(at);
  if (!key) {
    return;
  }
  activityByDate[key] = (activityByDate[key] ?? 0) + 1;
}

function weekKey(date: Date): string {
  const start = new Date(date);
  const weekday = start.getUTCDay();
  const distanceToMonday = weekday === 0 ? 6 : weekday - 1;
  start.setUTCDate(start.getUTCDate() - distanceToMonday);
  return dateKey(start);
}

function dayNumber(value: string | Date): number {
  const key = dateKey(value);
  return Math.floor(Date.parse(`${key}T00:00:00.000Z`) / 86400000);
}

function isWithinLastDays(value: string | Date, days: number): boolean {
  const diff = dayNumber(new Date()) - dayNumber(value);
  return diff >= 0 && diff < days;
}

function isAssessmentAnswerCorrect(question: AssessmentQuestion, response: AssessmentResponseInput): boolean {
  const answer = typeof response.answer === 'number' ? response.answer : normaliseAnswer(response.answer);
  const correctOption = question.correctOption ?? question.correct;

  if ((question.type === 'grammar' || question.type === 'listening') && typeof correctOption === 'number') {
    return typeof response.answer === 'number' && response.answer === correctOption;
  }

  if (typeof response.answer === 'number' && typeof correctOption === 'number') {
    return response.answer === correctOption;
  }

  const acceptableAnswers = question.acceptableAnswers?.map(normaliseAnswer) ?? [];
  return typeof answer === 'string' && acceptableAnswers.includes(answer);
}

function normaliseAnswer(value: string): string {
  return value.toLowerCase().replace(/[.,!?]/g, '').replace(/\s+/g, ' ').trim();
}
