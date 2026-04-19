import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BackendApiService } from '../../core/services/backend-api.service';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { UserRole } from '../../shared/models/content';
import { LeaderboardEntry } from '../../shared/models/profile';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.css',
})
export class LeaderboardPage implements OnInit {
  private readonly api = inject(BackendApiService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly auth = inject(AuthService);
  readonly lang = inject(LanguageService);

  readonly loading = signal(true);
  readonly entries = signal<LeaderboardEntry[]>([]);
  readonly error = signal('');

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading.set(false);
      return;
    }

    try {
      this.entries.set(await this.api.getLeaderboard(24));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : this.pick({ ru: 'Не удалось загрузить рейтинг.', en: 'Failed to load leaderboard.', kz: 'Рейтингті жүктеу мүмкін болмады.' }));
    } finally {
      this.loading.set(false);
    }
  }

  topThree(): LeaderboardEntry[] {
    return this.entries().slice(0, 3);
  }

  runners(): LeaderboardEntry[] {
    return this.entries().slice(3);
  }

  title(key: 'eyebrow' | 'description' | 'openProfile' | 'loading' | 'points' | 'pointsShort'): string {
    const labels = {
      eyebrow: { ru: 'Сообщество', en: 'Community pulse', kz: 'Қауым серпіні' },
      description: {
        ru: 'Лучшие пользователи по общим очкам, XP, серии и завершенным этапам.',
        en: 'Top learners ranked by total points, XP, streak and completed milestones.',
        kz: 'Жалпы ұпай, XP, серия және аяқталған белестер бойынша үздік қолданушылар.',
      },
      openProfile: { ru: 'Открыть профиль', en: 'Open profile hub', kz: 'Профильді ашу' },
      loading: { ru: 'Загрузка рейтинга...', en: 'Loading leaderboard...', kz: 'Рейтинг жүктелуде...' },
      points: { ru: 'Очки', en: 'Points', kz: 'Ұпай' },
      pointsShort: { ru: 'очк.', en: 'pts', kz: 'ұп.' },
    } as const;
    return this.pick(labels[key]);
  }

  roleLabel(role: UserRole): string {
    return role === 'teacher' ? this.lang.t('role_teacher') : this.lang.t('role_student');
  }

  crownTitle(totalPoints: number): string {
    if (totalPoints >= 3200) {
      return this.pick({ ru: 'Алмазная корона', en: 'Diamond Crown', kz: 'Алмас тәж' });
    }
    if (totalPoints >= 2200) {
      return this.pick({ ru: 'Золотая корона', en: 'Golden Crown', kz: 'Алтын тәж' });
    }
    if (totalPoints >= 1200) {
      return this.pick({ ru: 'Серебряная корона', en: 'Silver Crown', kz: 'Күміс тәж' });
    }
    return this.pick({ ru: 'Бронзовая корона', en: 'Bronze Crown', kz: 'Қола тәж' });
  }

  private pick(bank: { ru: string; en: string; kz: string }): string {
    return bank[this.lang.lang()];
  }
}
