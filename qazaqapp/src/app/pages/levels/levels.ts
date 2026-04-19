import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ProfileService } from '../../core/services/profile.service';
import { CatalogService } from '../../core/services/catalog.service';
import { LanguageService } from '../../core/services/language.service';
import { LevelSummary, LocalizedText } from '../../shared/models/content';

@Component({
  selector: 'app-levels',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './levels.html',
  styleUrl: './levels.css',
})
export class Levels implements OnInit {
  private readonly catalog = inject(CatalogService);
  readonly profileService = inject(ProfileService);
  readonly lang = inject(LanguageService);
  readonly levelsList = signal<LevelSummary[]>([]);
  readonly profile = computed(() => this.profileService.profile());

  async ngOnInit(): Promise<void> {
    const catalog = await this.catalog.ensureLoaded();
    this.levelsList.set(catalog.levels);
    await this.profileService.refresh(false);
  }

  progressFor(levelId: string): number {
    return this.profile()?.levelSummaries.find((item) => item.levelId === levelId)?.percent ?? 0;
  }

  isCurrent(levelId: string): boolean {
    return this.profile()?.user.currentLevel === levelId;
  }

  isRecommended(levelId: string): boolean {
    return this.profile()?.user.recommendedLevel === levelId;
  }

  hasCertificate(levelId: string): boolean {
    return this.profile()?.certificates.some((item) => item.levelId === levelId) ?? false;
  }

  text(value: string | LocalizedText): string {
    return this.lang.text(value);
  }

  levelName(level: LevelSummary): string {
    const labels: Record<string, LocalizedText> = {
      a1: { ru: 'A1 - Начальный', en: 'A1 - Beginner', kz: 'A1 - Бастапқы' },
      a2: { ru: 'A2 - Элементарный', en: 'A2 - Elementary', kz: 'A2 - Қарапайым' },
      b1: { ru: 'B1 - Средний', en: 'B1 - Intermediate', kz: 'B1 - Орта' },
      b2: { ru: 'B2 - Выше среднего', en: 'B2 - Upper Intermediate', kz: 'B2 - Жоғары орта' },
    };
    return this.text(labels[level.id] ?? level.name);
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
    return this.text(labels[level.id] ?? level.desc);
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
    return this.text(labels[level.id] ?? level.goal);
  }
}
