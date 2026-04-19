import { isPlatformBrowser, UpperCasePipe } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';

import { CatalogService } from '../../core/services/catalog.service';
import { LanguageService } from '../../core/services/language.service';
import { ProfileService } from '../../core/services/profile.service';
import { isAcceptableAnswer } from '../../shared/answer-utils';
import { AssessmentResponseInput, LevelId, ModuleTestQuestion } from '../../shared/models/content';

@Component({
  selector: 'app-module-test',
  standalone: true,
  imports: [RouterLink, UpperCasePipe, FormsModule],
  templateUrl: './module-test.html',
  styleUrl: './module-test.css',
})
export class ModuleTest implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(CatalogService);
  private readonly profile = inject(ProfileService);
  readonly lang = inject(LanguageService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  levelId: LevelId = 'a1';
  currentStep = 0;
  score = 0;
  isFinished = false;
  statusMessage = '';
  questions: ModuleTestQuestion[] = [];
  currentAnswer = '';
  selectedOption: number | null = null;
  listeningPlays: Record<string, number> = {};
  speakingAttempts: Record<string, number> = {};
  recognition: any;
  isRecording = false;

  async ngOnInit(): Promise<void> {
    await this.catalog.ensureLoaded();
    this.route.paramMap.subscribe((params) => {
      void this.applyRoute(params);
    });
    if (isPlatformBrowser(this.platformId)) {
      this.initSpeechRecognition();
    }
  }

  get current(): ModuleTestQuestion | null {
    return this.questions[this.currentStep] ?? null;
  }

  get progressWidth(): number {
    return this.questions.length ? Math.round((this.currentStep / this.questions.length) * 100) : 0;
  }

  optionLabel(option: string | { ru: string; en: string; kz: string }): string {
    return this.lang.text(option);
  }

  remainingAudioPlays(question: ModuleTestQuestion): number {
    return Math.max(0, (question.maxAudioPlays ?? 3) - (this.listeningPlays[question.id] || 0));
  }

  remainingSpeakingAttempts(question: ModuleTestQuestion): number {
    return Math.max(0, (question.maxSpeakingAttempts ?? 3) - (this.speakingAttempts[question.id] || 0));
  }

  passedScore(): boolean {
    return this.score >= Math.ceil(this.questions.length * 0.6);
  }

  prompt(): string {
    return this.lang.text(this.current?.prompt ?? this.current?.q ?? '');
  }

  helper(): string {
    return this.lang.text(this.current?.helper ?? '');
  }

  placeholder(): string {
    return this.lang.text(this.current?.placeholder ?? '');
  }

  selectOption(index: number): void {
    this.currentAnswer = '';
    this.selectedOption = index;
  }

  updateAnswer(value: string): void {
    this.currentAnswer = value;
    this.selectedOption = null;
  }

  playAudio(): void {
    const question = this.current;
    if (!question?.audioText || !isPlatformBrowser(this.platformId)) {
      return;
    }
    const plays = this.listeningPlays[question.id] ?? 0;
    const limit = question.maxAudioPlays ?? 3;
    if (plays >= limit) {
      return;
    }
    this.listeningPlays = { ...this.listeningPlays, [question.id]: plays + 1 };
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question.audioText);
    utterance.lang = 'kk-KZ';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  toggleRecording(): void {
    const question = this.current;
    if (!question || question.type !== 'speaking') {
      return;
    }
    if (!this.recognition) {
      this.statusMessage = this.lang.t('speech_not_supported');
      return;
    }
    if (this.isRecording) {
      this.isRecording = false;
      this.recognition.stop();
      return;
    }
    const attempts = this.speakingAttempts[question.id] ?? 0;
    const limit = question.maxSpeakingAttempts ?? 3;
    if (attempts >= limit) {
      return;
    }
    this.speakingAttempts = { ...this.speakingAttempts, [question.id]: attempts + 1 };
    this.isRecording = true;
    try {
      this.recognition.start();
    } catch {
      this.isRecording = false;
    }
  }

  async next(): Promise<void> {
    const question = this.current;
    if (!question) {
      return;
    }
    const response = this.buildResponse(question);
    if (!response) {
      this.statusMessage = this.lang.t('answer_required');
      return;
    }

    this.storeResponse(response);
    if (this.currentStep < this.questions.length - 1) {
      this.currentStep += 1;
      this.loadStoredAnswer();
      this.statusMessage = '';
      return;
    }

    await this.finish();
  }

  private async applyRoute(params: ParamMap): Promise<void> {
    const catalog = await this.catalog.ensureLoaded();
    this.levelId = ((params.get('levelId') || 'a1').toLowerCase() as LevelId);
    this.questions = catalog.byLevel[this.levelId]?.moduleTest ?? [];
    this.currentStep = 0;
    this.score = 0;
    this.isFinished = false;
    this.statusMessage = '';
    this.currentAnswer = '';
    this.selectedOption = null;
    (this as unknown as { _responses?: Record<string, AssessmentResponseInput> })._responses = {};

    await this.profile.saveCheckpoint({
      levelId: this.levelId,
      contentType: 'module-test',
      itemId: 'test',
    });
    this.loadStoredAnswer();
  }

  private loadStoredAnswer(): void {
    const response = this.current ? this.buildStoredResponse(this.current.id) : null;
    if (!response) {
      this.currentAnswer = '';
      this.selectedOption = null;
      return;
    }
    if (typeof response.answer === 'number') {
      this.selectedOption = response.answer;
      this.currentAnswer = '';
    } else {
      this.currentAnswer = response.answer;
      this.selectedOption = null;
    }
  }

  private buildResponse(question: ModuleTestQuestion): AssessmentResponseInput | null {
    if (typeof this.selectedOption === 'number') {
      return {
        questionId: question.id,
        answer: this.selectedOption,
        listeningPlays: this.listeningPlays[question.id] ?? 0,
      };
    }

    const answer = this.currentAnswer.trim();
    if (!answer) {
      return null;
    }
    return {
      questionId: question.id,
      answer,
      listeningPlays: this.listeningPlays[question.id] ?? 0,
      speakingAttempts: this.speakingAttempts[question.id] ?? (question.type === 'speaking' ? 1 : 0),
    };
  }

  private buildStoredResponse(questionId: string): AssessmentResponseInput | null {
    const store = (this as unknown as { _responses?: Record<string, AssessmentResponseInput> })._responses ?? {};
    return store[questionId] ?? null;
  }

  private storeResponse(response: AssessmentResponseInput): void {
    const host = this as unknown as { _responses?: Record<string, AssessmentResponseInput> };
    host._responses = {
      ...(host._responses ?? {}),
      [response.questionId]: response,
    };
  }

  private allResponses(): AssessmentResponseInput[] {
    const store = (this as unknown as { _responses?: Record<string, AssessmentResponseInput> })._responses ?? {};
    return Object.values(store);
  }

  private async finish(): Promise<void> {
    this.isFinished = true;
    try {
      await this.profile.saveModuleTest({
        levelId: this.levelId,
        responses: this.allResponses(),
      });
      this.score = this.calculateScore();
      this.statusMessage = this.lang.t('module_saved');
    } catch (error) {
      this.statusMessage = error instanceof Error ? error.message : this.lang.t('module_save_error');
    }
  }

  private calculateScore(): number {
    return this.questions.reduce((sum, question) => sum + (this.isCorrect(question) ? 1 : 0), 0);
  }

  private isCorrect(question: ModuleTestQuestion): boolean {
    const response = this.buildStoredResponse(question.id);
    if (!response) {
      return false;
    }
    if (typeof response.answer === 'number') {
      return response.answer === (question.correctOption ?? question.correct);
    }
    return isAcceptableAnswer(response.answer, question.acceptableAnswers ?? []);
  }

  private initSpeechRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'kk-KZ';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
    this.recognition.onresult = (event: any) => {
      this.zone.run(() => {
        this.currentAnswer = event.results[0][0].transcript;
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
    this.recognition.onend = () => {
      this.zone.run(() => {
        this.isRecording = false;
        this.cdr.detectChanges();
      });
    };
  }
}
