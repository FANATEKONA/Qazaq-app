import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CatalogService } from '../../core/services/catalog.service';
import { LanguageService } from '../../core/services/language.service';
import { ProfileService } from '../../core/services/profile.service';
import { LevelContent, LevelGameCollection, LevelId, LocalizedText } from '../../shared/models/content';

@Component({
  selector: 'app-level-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './level-dashboard.html',
  styleUrl: './level-dashboard.css',
})
export class LevelDashboard implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly catalogService = inject(CatalogService);
  readonly profileService = inject(ProfileService);
  readonly lang = inject(LanguageService);

  readonly levelId = signal<LevelId>('a1');
  readonly content = signal<LevelContent | null>(null);
  readonly arcade = signal<LevelGameCollection | null>(null);
  readonly profile = computed(() => this.profileService.profile());

  async ngOnInit(): Promise<void> {
    const catalog = await this.catalogService.ensureLoaded();
    await this.profileService.refresh(false);

    this.route.paramMap.subscribe((params) => {
      const nextLevelId = (params.get('levelId') as LevelId | null) ?? 'a1';
      this.levelId.set(nextLevelId);
      this.content.set(catalog.byLevel[nextLevelId]);
      this.arcade.set(catalog.gamesByLevel[nextLevelId]);
    });
  }

  levelPercent(): number {
    return this.profile()?.levelSummaries.find((item) => item.levelId === this.levelId())?.percent ?? 0;
  }

  certificateRoute(): string | null {
    const certificate = this.profile()?.certificates.find((item) => item.levelId === this.levelId());
    return certificate?.route ?? null;
  }

  cards() {
    const levelId = this.levelId();
    const content = this.content();
    const arcade = this.arcade();
    if (!content || !arcade) {
      return [];
    }

    return [
      {
        icon: '🎬',
        title: this.lang.t('video_lessons'),
        text: `${content.videos.length} ${this.lang.t('video_lessons').toLowerCase()}.`,
        route: `/levels/${levelId}/video/1`,
      },
      {
        icon: '📚',
        title: this.lang.t('grammar_lab'),
        text: `${content.grammar.length} ${this.lang.t('grammar_lab').toLowerCase()}.`,
        route: `/levels/${levelId}/grammar/1`,
      },
      {
        icon: '🎙',
        title: this.lang.t('shadowing'),
        text: `${content.shadowing.length} ${this.lang.t('shadowing').toLowerCase()}.`,
        route: `/levels/${levelId}/shadowing/1`,
      },
      {
        icon: '🧩',
        title: this.lang.t('four_skills'),
        text: this.lang.t('feature_live_text'),
        route: `/levels/${levelId}/skills/reading`,
      },
      {
        icon: '🎮',
        title: this.lang.t('arcade_zone'),
        text: `${arcade.games.length} ${this.lang.t('mini_games')}.`,
        route: `/levels/${levelId}/arcade`,
      },
      {
        icon: '🏁',
        title: this.lang.t('module_test'),
        text: this.lang.t('final_checkpoint'),
        route: `/levels/${levelId}/test`,
      },
    ];
  }

  text(value: string | LocalizedText | undefined): string {
    return this.lang.text(value);
  }
}
