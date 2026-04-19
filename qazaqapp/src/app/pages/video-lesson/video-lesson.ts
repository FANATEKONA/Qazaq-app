import { Component, OnInit, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ProfileService } from '../../core/services/profile.service';
import { LevelId, VideoLesson as VideoLessonItem } from '../../shared/models/content';

@Component({
  selector: 'app-video-lesson',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './video-lesson.html',
  styleUrl: './video-lesson.css',
})
export class VideoLesson implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly catalog = inject(CatalogService);
  private readonly auth = inject(AuthService);
  private readonly profile = inject(ProfileService);

  levelId: LevelId = 'a1';
  currentLessonId = '1';
  lessons: VideoLessonItem[] = [];
  saveMessage = '';

  async ngOnInit(): Promise<void> {
    await this.catalog.ensureLoaded();
    this.route.paramMap.subscribe((params) => {
      void this.applyRoute(params);
    });
  }

  get currentLesson(): VideoLessonItem | null {
    return this.lessons.find((lesson) => lesson.id === this.currentLessonId) ?? this.lessons[0] ?? null;
  }

  getSafeUrl(videoId: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`);
  }

  async markCompleted(): Promise<void> {
    if (!this.auth.user()) {
      this.saveMessage = 'Войдите, чтобы сохранить завершение урока.';
      return;
    }

    try {
      await this.profile.saveVideoProgress({
        levelId: this.levelId,
        lessonId: this.currentLessonId,
        status: 'completed',
      });
      this.saveMessage = 'Урок отмечен как завершенный.';
    } catch (error) {
      this.saveMessage = error instanceof Error ? error.message : 'Не удалось сохранить прогресс.';
    }
  }

  private async applyRoute(params: ParamMap): Promise<void> {
    const catalog = await this.catalog.ensureLoaded();
    this.levelId = ((params.get('levelId') || 'a1').toLowerCase() as LevelId);
    this.currentLessonId = params.get('lessonId') || '1';
    this.lessons = catalog.byLevel[this.levelId]?.videos ?? [];

    if (!this.auth.user()) {
      this.saveMessage = 'Войдите, чтобы сохранять текущий урок и прогресс.';
      return;
    }

    try {
      await this.profile.saveVideoProgress({
        levelId: this.levelId,
        lessonId: this.currentLessonId,
        status: 'started',
      });
      this.saveMessage = 'Текущий урок сохранен.';
    } catch (error) {
      this.saveMessage = error instanceof Error ? error.message : 'Не удалось сохранить урок.';
    }
  }
}
