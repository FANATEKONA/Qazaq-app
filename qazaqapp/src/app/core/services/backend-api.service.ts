import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';

import { AssessmentResponseInput, ContentType, LearningCatalog, LevelId, UserRole } from '../../shared/models/content';
import {
  AuthResponse,
  FeedbackPayload,
  LeaderboardEntry,
  MiniGameProgressPayload,
  ProfileResponse,
  SkillProgressPayload,
  StudentTaskCompletionPayload,
  TeacherChangeRequestPayload,
  TeacherSelectionPayload,
  TeacherTaskPayload,
} from '../../shared/models/profile';

@Injectable({ providedIn: 'root' })
export class BackendApiService {
  private readonly http = inject(HttpClient);

  getCatalog(): Promise<LearningCatalog> {
    return this.request(this.http.get<LearningCatalog>('/api/catalog', { withCredentials: true }));
  }

  getSession(): Promise<AuthResponse> {
    return this.request(this.http.get<AuthResponse>('/api/auth/me', { withCredentials: true }));
  }

  login(payload: { email: string; password: string }): Promise<AuthResponse> {
    return this.request(this.http.post<AuthResponse>('/api/auth/login', payload, { withCredentials: true }));
  }

  register(payload: { name: string; email: string; password: string; role?: UserRole; avatar?: string }): Promise<AuthResponse> {
    return this.request(this.http.post<AuthResponse>('/api/auth/register', payload, { withCredentials: true }));
  }

  logout(): Promise<void> {
    return this.request(this.http.post<void>('/api/auth/logout', {}, { withCredentials: true }));
  }

  getProfile(): Promise<ProfileResponse> {
    return this.request(this.http.get<ProfileResponse>('/api/profile', { withCredentials: true }));
  }

  getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
    return this.request(
      this.http.get<{ entries: LeaderboardEntry[] }>(`/api/leaderboard?limit=${limit}`, { withCredentials: true }),
    ).then((response) => response.entries);
  }

  saveCheckpoint(payload: { levelId: LevelId; contentType: ContentType; itemId: string }): Promise<ProfileResponse> {
    return this.request(
      this.http.post<ProfileResponse>('/api/progress/checkpoint', payload, { withCredentials: true }),
    );
  }

  saveDiagnostic(responses: AssessmentResponseInput[]): Promise<{ recommendedLevel: LevelId; profile: ProfileResponse }> {
    return this.request(
      this.http.post<{ recommendedLevel: LevelId; profile: ProfileResponse }>(
        '/api/progress/diagnostic',
        { responses },
        { withCredentials: true },
      ),
    );
  }

  saveVideoProgress(payload: {
    levelId: LevelId;
    lessonId: string;
    status: 'started' | 'completed';
    lastPositionSeconds?: number | null;
    watchedSeconds?: number;
  }): Promise<ProfileResponse> {
    return this.request(
      this.http.post<ProfileResponse>('/api/progress/video', payload, { withCredentials: true }),
    );
  }

  saveGrammarProgress(payload: {
    levelId: LevelId;
    topicId: string;
    answer: string;
    isCorrect: boolean;
    completed: boolean;
  }): Promise<ProfileResponse> {
    return this.request(
      this.http.post<ProfileResponse>('/api/progress/grammar', payload, { withCredentials: true }),
    );
  }

  saveShadowingProgress(payload: {
    levelId: LevelId;
    taskId: string;
    recognizedText: string;
    isMatch: boolean;
  }): Promise<ProfileResponse> {
    return this.request(
      this.http.post<ProfileResponse>('/api/progress/shadowing', payload, { withCredentials: true }),
    );
  }

  saveSkillProgress(payload: SkillProgressPayload): Promise<ProfileResponse> {
    return this.request(
      this.http.post<ProfileResponse>('/api/progress/skills', payload, { withCredentials: true }),
    );
  }

  saveMiniGameProgress(payload: MiniGameProgressPayload): Promise<ProfileResponse> {
    return this.request(
      this.http.post<ProfileResponse>('/api/progress/mini-game', payload, { withCredentials: true }),
    );
  }

  saveModuleTest(payload: { levelId: LevelId; responses: AssessmentResponseInput[] }): Promise<ProfileResponse> {
    return this.request(
      this.http.post<ProfileResponse>('/api/progress/module-test', payload, { withCredentials: true }),
    );
  }

  selectTeacher(payload: TeacherSelectionPayload): Promise<ProfileResponse> {
    return this.request(this.http.post<ProfileResponse>('/api/teacher/select', payload, { withCredentials: true }));
  }

  requestTeacherChange(payload: TeacherChangeRequestPayload): Promise<ProfileResponse> {
    return this.request(
      this.http.post<ProfileResponse>('/api/teacher/change-request', payload, { withCredentials: true }),
    );
  }

  submitFeedback(payload: FeedbackPayload): Promise<ProfileResponse | { ok: true }> {
    return this.request(this.http.post<ProfileResponse | { ok: true }>('/api/feedback', payload, { withCredentials: true }));
  }

  createTeacherTask(payload: TeacherTaskPayload): Promise<ProfileResponse> {
    return this.request(this.http.post<ProfileResponse>('/api/teacher/tasks', payload, { withCredentials: true }));
  }

  completeStudentTask(payload: StudentTaskCompletionPayload): Promise<ProfileResponse> {
    return this.request(
      this.http.post<ProfileResponse>('/api/teacher/tasks/complete', payload, { withCredentials: true }),
    );
  }

  private async request<T>(request: Observable<T>): Promise<T> {
    try {
      return await firstValueFrom(request);
    } catch (error) {
      throw new Error(this.extractErrorMessage(error));
    }
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const apiMessage = typeof error.error?.error === 'string' ? error.error.error : null;
      return apiMessage || error.message || 'Ошибка запроса к серверу.';
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Не удалось выполнить запрос.';
  }
}
