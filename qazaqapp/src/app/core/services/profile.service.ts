import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

import { AssessmentResponseInput, ContentType, LevelId } from '../../shared/models/content';
import {
  FeedbackPayload,
  MiniGameProgressPayload,
  ProfileResponse,
  SkillProgressPayload,
  StudentTaskCompletionPayload,
  TeacherChangeRequestPayload,
  TeacherSelectionPayload,
  TeacherTaskPayload,
} from '../../shared/models/profile';
import { BackendApiService } from './backend-api.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly platformId = inject(PLATFORM_ID);
  readonly profile = signal<ProfileResponse | null>(null);
  readonly loading = signal(false);

  constructor(
    private readonly api: BackendApiService,
    private readonly auth: AuthService,
  ) {}

  async refresh(force = true): Promise<ProfileResponse | null> {
    if (!isPlatformBrowser(this.platformId)) {
      return this.profile();
    }

    if (!this.auth.user()) {
      this.profile.set(null);
      return null;
    }

    if (this.profile() && !force) {
      return this.profile();
    }

    this.loading.set(true);
    try {
      const profile = await this.api.getProfile();
      this.setProfile(profile);
      return profile;
    } finally {
      this.loading.set(false);
    }
  }

  async saveDiagnostic(responses: AssessmentResponseInput[]): Promise<{ recommendedLevel: LevelId; profile: ProfileResponse }> {
    const response = await this.api.saveDiagnostic(responses);
    this.setProfile(response.profile);
    return response;
  }

  async saveCheckpoint(payload: { levelId: LevelId; contentType: ContentType; itemId: string }): Promise<ProfileResponse> {
    const profile = await this.api.saveCheckpoint(payload);
    this.setProfile(profile);
    return profile;
  }

  async saveVideoProgress(payload: {
    levelId: 'a1' | 'a2' | 'b1' | 'b2';
    lessonId: string;
    status: 'started' | 'completed';
    lastPositionSeconds?: number | null;
    watchedSeconds?: number;
  }): Promise<ProfileResponse> {
    const profile = await this.api.saveVideoProgress(payload);
    this.setProfile(profile);
    return profile;
  }

  async saveGrammarProgress(payload: {
    levelId: 'a1' | 'a2' | 'b1' | 'b2';
    topicId: string;
    answer: string;
    isCorrect: boolean;
    completed: boolean;
  }): Promise<ProfileResponse> {
    const profile = await this.api.saveGrammarProgress(payload);
    this.setProfile(profile);
    return profile;
  }

  async saveShadowingProgress(payload: {
    levelId: 'a1' | 'a2' | 'b1' | 'b2';
    taskId: string;
    recognizedText: string;
    isMatch: boolean;
  }): Promise<ProfileResponse> {
    const profile = await this.api.saveShadowingProgress(payload);
    this.setProfile(profile);
    return profile;
  }

  async saveSkillProgress(payload: SkillProgressPayload): Promise<ProfileResponse> {
    const profile = await this.api.saveSkillProgress(payload);
    this.setProfile(profile);
    return profile;
  }

  async saveMiniGameProgress(payload: MiniGameProgressPayload): Promise<ProfileResponse> {
    const profile = await this.api.saveMiniGameProgress(payload);
    this.setProfile(profile);
    return profile;
  }

  async saveModuleTest(payload: { levelId: 'a1' | 'a2' | 'b1' | 'b2'; responses: AssessmentResponseInput[] }): Promise<ProfileResponse> {
    const profile = await this.api.saveModuleTest(payload);
    this.setProfile(profile);
    return profile;
  }

  async selectTeacher(payload: TeacherSelectionPayload): Promise<ProfileResponse> {
    const profile = await this.api.selectTeacher(payload);
    this.setProfile(profile);
    return profile;
  }

  async requestTeacherChange(payload: TeacherChangeRequestPayload): Promise<ProfileResponse> {
    const profile = await this.api.requestTeacherChange(payload);
    this.setProfile(profile);
    return profile;
  }

  async submitFeedback(payload: FeedbackPayload): Promise<ProfileResponse | { ok: true }> {
    const result = await this.api.submitFeedback(payload);
    if ('user' in result) {
      this.setProfile(result);
    }
    return result;
  }

  async createTeacherTask(payload: TeacherTaskPayload): Promise<ProfileResponse> {
    const profile = await this.api.createTeacherTask(payload);
    this.setProfile(profile);
    return profile;
  }

  async completeStudentTask(payload: StudentTaskCompletionPayload): Promise<ProfileResponse> {
    const profile = await this.api.completeStudentTask(payload);
    this.setProfile(profile);
    return profile;
  }

  clear(): void {
    this.profile.set(null);
  }

  private setProfile(profile: ProfileResponse): void {
    this.profile.set(profile);
    this.auth.setUser(profile.user);
  }
}
