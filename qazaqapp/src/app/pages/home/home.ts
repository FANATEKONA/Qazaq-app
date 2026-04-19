import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BackendApiService } from '../../core/services/backend-api.service';
import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '../../core/services/catalog.service';
import { LanguageService } from '../../core/services/language.service';
import { ProfileService } from '../../core/services/profile.service';
import { LevelSummary, LocalizedText, WordOfDayEntry } from '../../shared/models/content';
import { LeaderboardEntry, WordOfDayView } from '../../shared/models/profile';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly api = inject(BackendApiService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly auth = inject(AuthService);
  readonly profileService = inject(ProfileService);
  readonly lang = inject(LanguageService);
  readonly levels = signal<LevelSummary[]>([]);
  readonly wordOfDay = signal<WordOfDayView | null>(null);
  readonly leaderboard = signal<LeaderboardEntry[]>([]);
  readonly loading = signal(true);

  readonly profile = computed(() => this.profileService.profile());

  async ngOnInit(): Promise<void> {
    const catalog = await this.catalogService.ensureLoaded();
    this.levels.set(catalog.levels);
    this.wordOfDay.set(this.buildWordOfDay(catalog.wordBank));

    if (isPlatformBrowser(this.platformId)) {
      if (this.auth.user()) {
        await this.profileService.refresh(false);
      }

      try {
        this.leaderboard.set(await this.api.getLeaderboard(5));
      } catch {
        this.leaderboard.set([]);
      }
    }

    if (this.profile()?.wordOfDay) {
      this.wordOfDay.set(this.profile()!.wordOfDay);
    }

    this.loading.set(false);
  }

  featureCards() {
    return [
      { title: this.lang.t('feature_adaptive_title'), text: this.lang.t('feature_adaptive_text') },
      { title: this.lang.t('feature_live_title'), text: this.lang.t('feature_live_text') },
      { title: this.lang.t('feature_growth_title'), text: this.lang.t('feature_growth_text') },
    ];
  }

  missionCards() {
    const profile = this.profile();
    if (!profile) {
      return [];
    }

    return [
      {
        title: this.lang.t('resume_lesson'),
        value: profile.resume?.title ?? this.lang.t('start_first_lesson'),
        route: profile.resume?.route ?? '/levels',
      },
      {
        title: this.lang.t('daily_tasks'),
        value: `${profile.dailyTasks.filter((task) => task.completed).length}/3 ${this.lang.t('complete_short')}`,
        route: '/profile',
      },
      {
        title: this.lang.t('weekly_challenge'),
        value: `${profile.weeklyChallenge.daysCompleted}/7 ${this.lang.t('active_days')}`,
        route: '/profile',
      },
    ];
  }

  levelText(value: LevelSummary['name' | 'desc' | 'goal']): string {
    return this.lang.text(value);
  }

  levelName(level: LevelSummary): string {
    const labels: Record<string, LocalizedText> = {
      a1: { ru: 'A1 - Начальный', en: 'A1 - Beginner', kz: 'A1 - Бастапқы' },
      a2: { ru: 'A2 - Элементарный', en: 'A2 - Elementary', kz: 'A2 - Қарапайым' },
      b1: { ru: 'B1 - Средний', en: 'B1 - Intermediate', kz: 'B1 - Орта' },
      b2: { ru: 'B2 - Выше среднего', en: 'B2 - Upper Intermediate', kz: 'B2 - Жоғары орта' },
    };
    return this.lang.text(labels[level.id] ?? level.name);
  }

  levelDesc(level: LevelSummary): string {
    const labels: Record<string, LocalizedText> = {
      a1: {
        ru: 'Базовые фразы, алфавит, знакомство и первые бытовые темы.',
        en: 'Basic phrases, alphabet, introductions and first everyday topics.',
        kz: 'Базалық тіркестер, әліпби, танысу және алғашқы тұрмыстық тақырыптар.',
      },
      a2: {
        ru: 'Повседневные ситуации, простая грамматика и короткие диалоги.',
        en: 'Everyday situations, simple grammar and short dialogues.',
        kz: 'Күнделікті жағдайлар, қарапайым грамматика және қысқа диалогтар.',
      },
      b1: {
        ru: 'Связная речь, аргументация и понимание развернутых текстов.',
        en: 'Connected speech, argumentation and understanding extended texts.',
        kz: 'Байланысты сөйлеу, ойды дәлелдеу және көлемді мәтіндерді түсіну.',
      },
      b2: {
        ru: 'Сложные тексты, дискуссии и академические темы.',
        en: 'Complex texts, discussions and academic topics.',
        kz: 'Күрделі мәтіндер, пікірталастар және академиялық тақырыптар.',
      },
    };
    return this.lang.text(labels[level.id] ?? level.desc);
  }

  levelGoal(level: LevelSummary): string {
    const labels: Record<string, LocalizedText> = {
      a1: {
        ru: 'Начать понимать простую речь и строить короткие фразы на казахском.',
        en: 'Start understanding simple speech and building short phrases in Kazakh.',
        kz: 'Қарапайым сөйлеуді түсініп, қазақша қысқа тіркестер құрауды бастау.',
      },
      a2: {
        ru: 'Уверенно говорить о семье, городе, покупках и ежедневных делах.',
        en: 'Speak confidently about family, city life, shopping and daily routines.',
        kz: 'Отбасы, қала, сауда және күнделікті істер туралы сенімді сөйлеу.',
      },
      b1: {
        ru: 'Поддерживать разговор на знакомые темы и понимать основной смысл контента.',
        en: 'Maintain conversations on familiar topics and understand the main idea of content.',
        kz: 'Таныс тақырыптарда сөйлесіп, контенттің негізгі мағынасын түсіну.',
      },
      b2: {
        ru: 'Свободно общаться, защищать мнение и работать со сложной лексикой.',
        en: 'Communicate freely, defend opinions and work with advanced vocabulary.',
        kz: 'Еркін сөйлесіп, пікірді қорғап, күрделі сөздікпен жұмыс істеу.',
      },
    };
    return this.lang.text(labels[level.id] ?? level.goal);
  }

  roleLabel(role: string): string {
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

  rankTitle(xpLevel: number): string {
    const labels = [
      { ru: 'Старт', en: 'Starter', kz: 'Бастау' },
      { ru: 'Исследователь', en: 'Explorer', kz: 'Зерттеуші' },
      { ru: 'Навигатор', en: 'Navigator', kz: 'Бағыттаушы' },
      { ru: 'Ученый', en: 'Scholar', kz: 'Білімпаз' },
      { ru: 'Амбассадор', en: 'Ambassador', kz: 'Елші' },
      { ru: 'Легенда', en: 'Legend', kz: 'Аңыз' },
    ];
    return this.pick(labels[Math.min(labels.length - 1, Math.max(0, xpLevel - 1))]);
  }

  private buildWordOfDay(wordBank: WordOfDayEntry[]): WordOfDayView | null {
    if (!wordBank.length) {
      return null;
    }

    const dayIndex = Math.floor(Date.now() / 86400000);
    const item = wordBank[Math.abs(dayIndex) % wordBank.length];
    return {
      date: new Date().toISOString().slice(0, 10),
      word: item.word,
      translation: item.translation,
      example: item.example,
      tip: item.tip,
    };
  }

  text(value: string | LocalizedText | undefined | null): string {
    return this.lang.text(value);
  }

  private pick(bank: { ru: string; en: string; kz: string }): string {
    return bank[this.lang.lang()];
  }
}
