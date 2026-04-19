import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '../../core/services/catalog.service';
import { LanguageService } from '../../core/services/language.service';
import { ProfileService } from '../../core/services/profile.service';
import { isAcceptableAnswer } from '../../shared/answer-utils';
import {
  localizeGrammarExamples,
  localizeGrammarPrompt,
  localizeGrammarRule,
  localizeGrammarTitle,
} from '../../shared/learning-localization';
import { GrammarTopic, LevelId } from '../../shared/models/content';

@Component({
  selector: 'app-grammar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './grammar.html',
  styleUrl: './grammar.css',
})
export class Grammar implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(CatalogService);
  private readonly auth = inject(AuthService);
  private readonly profile = inject(ProfileService);
  readonly lang = inject(LanguageService);

  levelId: LevelId = 'a1';
  currentTopicId = '1';
  isExerciseActive = false;
  userAnswer = '';
  isChecked = false;
  isCorrect = false;
  saveMessage = '';
  topics: GrammarTopic[] = [];

  async ngOnInit(): Promise<void> {
    await this.catalog.ensureLoaded();
    this.route.paramMap.subscribe((params) => {
      void this.applyRoute(params);
    });
  }

  get currentTopic(): GrammarTopic | null {
    return this.topics.find((topic) => topic.id === this.currentTopicId) ?? this.topics[0] ?? null;
  }

  topicTitle(topic: GrammarTopic): string {
    return localizeGrammarTitle(this.levelId, topic, this.lang.lang());
  }

  topicRule(topic: GrammarTopic): string {
    return localizeGrammarRule(this.levelId, topic, this.lang.lang());
  }

  topicExamples(topic: GrammarTopic): string[] {
    return localizeGrammarExamples(this.levelId, topic, this.lang.lang());
  }

  exercisePrompt(topic: GrammarTopic): string {
    return localizeGrammarPrompt(this.levelId, topic, this.lang.lang());
  }

  topicsTitle(): string {
    return this.copy({
      ru: 'Темы по грамматике',
      en: 'Grammar topics',
      kz: 'Грамматика тақырыптары',
    });
  }

  badgeLabel(): string {
    return this.copy({
      ru: 'Правило',
      en: 'Rule',
      kz: 'Ереже',
    });
  }

  ruleHeading(): string {
    return this.copy({
      ru: 'Как это работает',
      en: 'How it works',
      kz: 'Қалай жұмыс істейді',
    });
  }

  examplesLabel(): string {
    return this.copy({
      ru: 'Примеры',
      en: 'Examples',
      kz: 'Мысалдар',
    });
  }

  practiceHeading(): string {
    return this.copy({
      ru: 'Практика',
      en: 'Practice',
      kz: 'Практика',
    });
  }

  practiceText(): string {
    return this.copy({
      ru: 'Закрепите правило и проверьте ответ. Правильный ответ сохраняется как завершенная тема.',
      en: 'Practice the rule and check your answer. A correct answer is saved as a completed topic.',
      kz: 'Ережені бекітіп, жауабыңызды тексеріңіз. Дұрыс жауап тақырыпты аяқталған деп сақтайды.',
    });
  }

  startExerciseLabel(): string {
    return this.copy({
      ru: 'Начать упражнение',
      en: 'Start exercise',
      kz: 'Жаттығуды бастау',
    });
  }

  taskLabel(): string {
    return this.copy({
      ru: 'Задание',
      en: 'Task',
      kz: 'Тапсырма',
    });
  }

  answerPlaceholder(): string {
    return this.copy({
      ru: 'Ваш ответ',
      en: 'Your answer',
      kz: 'Жауабыңыз',
    });
  }

  successText(): string {
    return this.copy({
      ru: 'Правильно. Тема засчитана.',
      en: 'Correct. The topic is counted as completed.',
      kz: 'Дұрыс. Тақырып орындалды деп есептелді.',
    });
  }

  errorText(): string {
    return this.copy({
      ru: 'Ошибка. Попробуйте еще раз.',
      en: 'Not quite right. Try again.',
      kz: 'Қате. Қайта көріңіз.',
    });
  }

  checkLabel(): string {
    return this.copy({
      ru: 'Проверить',
      en: 'Check',
      kz: 'Тексеру',
    });
  }

  hideLabel(): string {
    return this.copy({
      ru: 'Скрыть',
      en: 'Hide',
      kz: 'Жасыру',
    });
  }

  loadingText(): string {
    return this.copy({
      ru: 'Загрузка темы...',
      en: 'Loading topic...',
      kz: 'Тақырып жүктелуде...',
    });
  }

  toggleExercise(): void {
    this.isExerciseActive = !this.isExerciseActive;
    if (!this.isExerciseActive) {
      this.resetExercise();
    }
  }

  resetExercise(): void {
    this.userAnswer = '';
    this.isChecked = false;
    this.isCorrect = false;
  }

  async checkAnswer(): Promise<void> {
    if (!this.currentTopic || !this.userAnswer.trim()) {
      return;
    }

    this.isCorrect = isAcceptableAnswer(this.userAnswer, [this.currentTopic.exercise.correct]);
    this.isChecked = true;

    if (!this.auth.user()) {
      this.saveMessage = this.copy({
        ru: 'Войдите, чтобы сохранить выполнение грамматики.',
        en: 'Sign in to save grammar practice.',
        kz: 'Грамматика нәтижесін сақтау үшін кіріңіз.',
      });
      return;
    }

    try {
      await this.profile.saveGrammarProgress({
        levelId: this.levelId,
        topicId: this.currentTopicId,
        answer: this.userAnswer,
        isCorrect: this.isCorrect,
        completed: this.isCorrect,
      });
      this.saveMessage = this.isCorrect
        ? this.copy({
            ru: 'Тема сохранена как завершенная.',
            en: 'The topic was saved as completed.',
            kz: 'Тақырып аяқталған ретінде сақталды.',
          })
        : this.copy({
            ru: 'Попытка сохранена.',
            en: 'Attempt saved.',
            kz: 'Әрекет сақталды.',
          });
    } catch (error) {
      this.saveMessage = error instanceof Error
        ? error.message
        : this.copy({
            ru: 'Не удалось сохранить прогресс.',
            en: 'Unable to save progress.',
            kz: 'Прогресті сақтау мүмкін болмады.',
          });
    }
  }

  private async applyRoute(params: ParamMap): Promise<void> {
    const catalog = await this.catalog.ensureLoaded();
    this.levelId = ((params.get('levelId') || 'a1').toLowerCase() as LevelId);
    this.currentTopicId = params.get('topicId') || '1';
    this.topics = catalog.byLevel[this.levelId]?.grammar ?? [];
    this.isExerciseActive = false;
    this.resetExercise();

    if (!this.auth.user()) {
      this.saveMessage = this.copy({
        ru: 'Войдите, чтобы сохранять текущую тему.',
        en: 'Sign in to save the current topic.',
        kz: 'Ағымдағы тақырыпты сақтау үшін кіріңіз.',
      });
      return;
    }

    try {
      await this.profile.saveCheckpoint({
        levelId: this.levelId,
        contentType: 'grammar',
        itemId: this.currentTopicId,
      });
      this.saveMessage = this.copy({
        ru: 'Текущая тема сохранена.',
        en: 'Current topic saved.',
        kz: 'Ағымдағы тақырып сақталды.',
      });
    } catch (error) {
      this.saveMessage = error instanceof Error
        ? error.message
        : this.copy({
            ru: 'Не удалось сохранить текущую тему.',
            en: 'Unable to save the current topic.',
            kz: 'Ағымдағы тақырыпты сақтау мүмкін болмады.',
          });
    }
  }

  private copy(bank: { ru: string; en: string; kz: string }): string {
    return bank[this.lang.lang()];
  }
}
