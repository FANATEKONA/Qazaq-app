import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { ActivatedRoute, ParamMap, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '../../core/services/catalog.service';
import { LanguageService } from '../../core/services/language.service';
import { ProfileService } from '../../core/services/profile.service';
import { isSpeechMatch } from '../../shared/answer-utils';
import { localizeShadowingMeaning, localizeShadowingTitle } from '../../shared/learning-localization';
import { LevelId, ShadowingTask } from '../../shared/models/content';

@Component({
  selector: 'app-shadowing',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './shadowing.html',
  styleUrl: './shadowing.css',
})
export class Shadowing implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly catalog = inject(CatalogService);
  private readonly auth = inject(AuthService);
  private readonly profile = inject(ProfileService);
  readonly lang = inject(LanguageService);
  private readonly platformId = inject(PLATFORM_ID);

  levelId: LevelId = 'a1';
  currentTaskId = '1';
  tasks: ShadowingTask[] = [];

  isRecording = false;
  recognizedText = '';
  isMatch = false;
  isAudioPlaying = false;
  recognition: any;
  saveMessage = '';

  async ngOnInit(): Promise<void> {
    await this.catalog.ensureLoaded();
    this.route.paramMap.subscribe((params) => {
      void this.applyRoute(params);
    });
    if (isPlatformBrowser(this.platformId)) {
      this.initSpeechRecognition();
    }
  }

  get currentTask(): ShadowingTask | null {
    return this.tasks.find((task) => task.id === this.currentTaskId) ?? this.tasks[0] ?? null;
  }

  taskTitle(task: ShadowingTask): string {
    return localizeShadowingTitle(this.levelId, task, this.lang.lang());
  }

  taskMeaning(task: ShadowingTask): string {
    return localizeShadowingMeaning(this.levelId, task, this.lang.lang());
  }

  sidebarTitle(): string {
    return this.copy({
      ru: 'Темы для shadowing',
      en: 'Shadowing topics',
      kz: 'Shadowing тақырыптары',
    });
  }

  badgeLabel(): string {
    return this.copy({
      ru: 'Говорение',
      en: 'Speaking',
      kz: 'Сөйлеу',
    });
  }

  instructionText(): string {
    return this.copy({
      ru: 'Прослушайте фразу и повторите ее максимально точно.',
      en: 'Listen to the phrase and repeat it as accurately as possible.',
      kz: 'Фразаны тыңдап, оны мүмкіндігінше дәл қайталаңыз.',
    });
  }

  sourceLabel(): string {
    return this.copy({
      ru: 'Қазақша',
      en: 'Kazakh',
      kz: 'Қазақша',
    });
  }

  meaningLabel(): string {
    return this.copy({
      ru: 'Смысл',
      en: 'Meaning',
      kz: 'Мағынасы',
    });
  }

  speakingTurnLabel(): string {
    return this.copy({
      ru: 'Ваша очередь',
      en: 'Your turn',
      kz: 'Кезек сізде',
    });
  }

  recordButtonLabel(): string {
    return this.isRecording
      ? this.copy({
          ru: 'Остановить запись',
          en: 'Stop recording',
          kz: 'Жазуды тоқтату',
        })
      : this.copy({
          ru: 'Начать запись',
          en: 'Start recording',
          kz: 'Жазуды бастау',
        });
  }

  recordingStatusText(): string {
    return this.copy({
      ru: 'Идет запись. Прочитайте фразу вслух.',
      en: 'Recording in progress. Read the phrase aloud.',
      kz: 'Жазба жүріп жатыр. Фразаны дауыстап оқыңыз.',
    });
  }

  recognizedLabel(): string {
    return this.copy({
      ru: 'Вы сказали',
      en: 'You said',
      kz: 'Сіз айттыңыз',
    });
  }

  successText(): string {
    return this.copy({
      ru: 'Отлично. Произношение засчитано.',
      en: 'Good. Your pronunciation is accepted.',
      kz: 'Жақсы. Айтылым қабылданды.',
    });
  }

  errorText(): string {
    return this.copy({
      ru: 'Есть расхождения. Попробуйте еще раз.',
      en: 'There are mismatches. Try again.',
      kz: 'Айырмашылықтар бар. Қайта көріңіз.',
    });
  }

  loadingText(): string {
    return this.copy({
      ru: 'Загрузка практики...',
      en: 'Loading practice...',
      kz: 'Практика жүктелуде...',
    });
  }

  playAudio(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (!this.currentTask) {
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
    const utterance = new SpeechSynthesisUtterance(this.currentTask.kazakh);
    utterance.lang = 'kk-KZ';
    utterance.rate = 0.9;
    utterance.onend = () => {
      this.zone.run(() => {
        this.isAudioPlaying = false;
        this.cdr.detectChanges();
      });
    };

    window.speechSynthesis.speak(utterance);
    this.isAudioPlaying = true;
  }

  toggleRecording(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (!this.recognition) {
      this.saveMessage = this.copy({
        ru: 'В браузере нет поддержки распознавания речи.',
        en: 'Speech recognition is not supported in this browser.',
        kz: 'Бұл браузерде сөйлеуді тану қолдауы жоқ.',
      });
      return;
    }

    if (this.isRecording) {
      this.isRecording = false;
      this.recognition.stop();
      return;
    }

    this.resetRecording();
    this.isRecording = true;
    try {
      this.recognition.start();
    } catch {
      this.isRecording = false;
    }
  }

  private initSpeechRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'kk-KZ';
    this.recognition.interimResults = false;
    this.recognition.continuous = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      this.zone.run(() => {
        this.recognizedText = event.results[0][0].transcript;
        this.checkPronunciation();
        void this.persistPractice();
        this.cdr.detectChanges();
      });
    };

    this.recognition.onend = () => {
      this.zone.run(() => {
        this.isRecording = false;
        this.cdr.detectChanges();
      });
    };

    this.recognition.onerror = () => {
      this.zone.run(() => {
        this.isRecording = false;
        this.cdr.detectChanges();
      });
    };
  }

  private checkPronunciation(): void {
    if (!this.currentTask) {
      this.isMatch = false;
      return;
    }

    this.isMatch = isSpeechMatch(this.currentTask.kazakh, this.recognizedText);
  }

  private async persistPractice(): Promise<void> {
    if (!this.auth.user()) {
      this.saveMessage = this.copy({
        ru: 'Войдите, чтобы сохранять практику shadowing.',
        en: 'Sign in to save shadowing practice.',
        kz: 'Shadowing нәтижесін сақтау үшін кіріңіз.',
      });
      return;
    }

    try {
      await this.profile.saveShadowingProgress({
        levelId: this.levelId,
        taskId: this.currentTaskId,
        recognizedText: this.recognizedText,
        isMatch: this.isMatch,
      });
      this.saveMessage = this.isMatch
        ? this.copy({
            ru: 'Практика сохранена как успешная.',
            en: 'Practice saved as successful.',
            kz: 'Практика сәтті ретінде сақталды.',
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
            ru: 'Не удалось сохранить попытку.',
            en: 'Unable to save the attempt.',
            kz: 'Әрекетті сақтау мүмкін болмады.',
          });
    }
  }

  private resetRecording(): void {
    this.isRecording = false;
    this.recognizedText = '';
    this.isMatch = false;
    if (isPlatformBrowser(this.platformId)) {
      window.speechSynthesis.cancel();
    }
    this.isAudioPlaying = false;
  }

  private async applyRoute(params: ParamMap): Promise<void> {
    const catalog = await this.catalog.ensureLoaded();
    this.levelId = ((params.get('levelId') || 'a1').toLowerCase() as LevelId);
    this.currentTaskId = params.get('taskId') || '1';
    this.tasks = catalog.byLevel[this.levelId]?.shadowing ?? [];
    this.resetRecording();

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.auth.user()) {
      this.saveMessage = this.copy({
        ru: 'Войдите, чтобы сохранять точку остановки.',
        en: 'Sign in to save your current point.',
        kz: 'Ағымдағы орынды сақтау үшін кіріңіз.',
      });
      return;
    }

    try {
      await this.profile.saveCheckpoint({
        levelId: this.levelId,
        contentType: 'shadowing',
        itemId: this.currentTaskId,
      });
      this.saveMessage = this.copy({
        ru: 'Текущая практика сохранена.',
        en: 'Current practice saved.',
        kz: 'Ағымдағы практика сақталды.',
      });
    } catch (error) {
      this.saveMessage = error instanceof Error
        ? error.message
        : this.copy({
            ru: 'Не удалось сохранить текущую практику.',
            en: 'Unable to save the current practice.',
            kz: 'Ағымдағы практиканы сақтау мүмкін болмады.',
          });
    }
  }

  private copy(bank: { ru: string; en: string; kz: string }): string {
    return bank[this.lang.lang()];
  }
}
