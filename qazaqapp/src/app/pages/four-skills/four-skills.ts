import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { ActivatedRoute, ParamMap, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '../../core/services/catalog.service';
import { LanguageService } from '../../core/services/language.service';
import { ProfileService } from '../../core/services/profile.service';
import {
  localizeSkillLessonTitle,
  localizeSkillQuestionOptions,
  localizeSkillQuestionText,
} from '../../shared/learning-localization';
import { LevelId, SkillQuestion, SkillType } from '../../shared/models/content';

type SkillQuestionView = SkillQuestion & { selected: number };

type SkillContentView = {
  title: string;
  text?: string;
  transcript?: string;
  questions: SkillQuestionView[];
};

@Component({
  selector: 'app-four-skills',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './four-skills.html',
  styleUrl: './four-skills.css',
})
export class FourSkills implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(CatalogService);
  private readonly auth = inject(AuthService);
  private readonly profile = inject(ProfileService);
  readonly lang = inject(LanguageService);
  private readonly platformId = inject(PLATFORM_ID);

  levelId: LevelId = 'a1';
  skillType: SkillType = 'reading';
  content: SkillContentView | null = null;
  isAudioPlaying = false;
  showTranscript = false;
  currentUtterance: SpeechSynthesisUtterance | null = null;
  saveMessage = '';

  async ngOnInit(): Promise<void> {
    await this.catalog.ensureLoaded();
    this.route.paramMap.subscribe((params) => {
      void this.applyRoute(params);
    });
  }

  selectAnswer(questionIndex: number, optionIndex: number): void {
    if (!this.content) {
      return;
    }
    if (this.content.questions[questionIndex].selected >= 0) {
      return;
    }

    this.content.questions[questionIndex].selected = optionIndex;
    if (this.content.questions.every((question) => question.selected >= 0)) {
      void this.persistAnswers();
    }
  }

  toggleTranscript(): void {
    this.showTranscript = !this.showTranscript;
  }

  playAudio(): void {
    if (!isPlatformBrowser(this.platformId) || !this.content?.transcript) {
      return;
    }

    if (this.isAudioPlaying) {
      window.speechSynthesis.pause();
      this.isAudioPlaying = false;
      return;
    }
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      this.isAudioPlaying = true;
      return;
    }

    window.speechSynthesis.cancel();
    this.currentUtterance = new SpeechSynthesisUtterance(this.content.transcript);
    this.currentUtterance.lang = 'kk-KZ';
    this.currentUtterance.rate = 0.85;
    this.currentUtterance.onend = () => {
      this.isAudioPlaying = false;
    };
    this.currentUtterance.onerror = () => {
      this.isAudioPlaying = false;
    };

    window.speechSynthesis.speak(this.currentUtterance);
    this.isAudioPlaying = true;
  }

  stopAudio(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.speechSynthesis.cancel();
    }
    this.isAudioPlaying = false;
  }

  skillLabel(skillType: SkillType): string {
    return skillType === 'reading'
      ? this.copy({ ru: 'Чтение', en: 'Reading', kz: 'Оқу' })
      : this.copy({ ru: 'Аудирование', en: 'Listening', kz: 'Тыңдау' });
  }

  toggleTranscriptLabel(): string {
    return this.showTranscript
      ? this.copy({ ru: 'Скрыть текст', en: 'Hide transcript', kz: 'Мәтінді жасыру' })
      : this.copy({ ru: 'Показать текст', en: 'Show transcript', kz: 'Мәтінді көрсету' });
  }

  contentTitle(): string {
    if (!this.content) {
      return '';
    }

    return localizeSkillLessonTitle(this.levelId, this.skillType, this.content.title, this.lang.lang());
  }

  questionText(question: SkillQuestion): string {
    return localizeSkillQuestionText(this.levelId, this.skillType, question, this.lang.lang());
  }

  questionOptions(question: SkillQuestion): string[] {
    return localizeSkillQuestionOptions(this.levelId, this.skillType, question, this.lang.lang());
  }

  listeningInstruction(): string {
    return this.copy({
      ru: 'Прослушайте аудио и ответьте на вопросы.',
      en: 'Listen to the audio and answer the questions.',
      kz: 'Аудионы тыңдап, сұрақтарға жауап беріңіз.',
    });
  }

  private async applyRoute(params: ParamMap): Promise<void> {
    const catalog = await this.catalog.ensureLoaded();
    this.levelId = ((params.get('levelId') || 'a1').toLowerCase() as LevelId);
    this.skillType = ((params.get('skillType') || 'reading') as SkillType);
    const source = catalog.byLevel[this.levelId]?.skills[this.skillType];

    this.content = source
      ? {
          title: source.title,
          text: 'text' in source ? source.text : undefined,
          transcript: 'transcript' in source ? source.transcript : undefined,
          questions: source.questions.map((question) => ({ ...question, selected: -1 })),
        }
      : null;

    this.showTranscript = false;
    this.stopAudio();

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.auth.user()) {
      this.saveMessage = this.copy({
        ru: 'Войдите, чтобы сохранять текущий раздел и результаты.',
        en: 'Sign in to save the current section and results.',
        kz: 'Ағымдағы бөлім мен нәтижелерді сақтау үшін кіріңіз.',
      });
      return;
    }

    try {
      await this.profile.saveCheckpoint({
        levelId: this.levelId,
        contentType: 'skills',
        itemId: this.skillType,
      });
      this.saveMessage = this.copy({
        ru: 'Текущий раздел сохранен.',
        en: 'Current section saved.',
        kz: 'Ағымдағы бөлім сақталды.',
      });
    } catch (error) {
      this.saveMessage = error instanceof Error
        ? error.message
        : this.copy({
            ru: 'Не удалось сохранить текущий раздел.',
            en: 'Unable to save the current section.',
            kz: 'Ағымдағы бөлімді сақтау мүмкін болмады.',
          });
    }
  }

  private async persistAnswers(): Promise<void> {
    if (!this.content) {
      return;
    }

    if (!this.auth.user()) {
      this.saveMessage = this.copy({
        ru: 'Войдите, чтобы сохранить результаты навыка.',
        en: 'Sign in to save skill results.',
        kz: 'Дағды нәтижелерін сақтау үшін кіріңіз.',
      });
      return;
    }

    const selectedAnswers = this.content.questions.map((question) => question.selected);
    const correctAnswers = this.content.questions.filter((question) => question.selected === question.correct).length;

    try {
      await this.profile.saveSkillProgress({
        levelId: this.levelId,
        skillType: this.skillType,
        selectedAnswers,
        correctAnswers,
        totalQuestions: this.content.questions.length,
        completed: true,
      });
      this.saveMessage = `${this.copy({
        ru: 'Результат сохранен',
        en: 'Result saved',
        kz: 'Нәтиже сақталды',
      })}: ${correctAnswers} / ${this.content.questions.length}.`;
    } catch (error) {
      this.saveMessage = error instanceof Error
        ? error.message
        : this.copy({
            ru: 'Не удалось сохранить результаты.',
            en: 'Unable to save results.',
            kz: 'Нәтижелерді сақтау мүмкін болмады.',
          });
    }
  }

  private copy(bank: { ru: string; en: string; kz: string }): string {
    return bank[this.lang.lang()];
  }
}
