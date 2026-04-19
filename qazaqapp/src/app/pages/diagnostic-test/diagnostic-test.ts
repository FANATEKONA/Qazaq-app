import { isPlatformBrowser, UpperCasePipe } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { LanguageService } from '../../core/services/language.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ProfileService } from '../../core/services/profile.service';
import { isAcceptableAnswer } from '../../shared/answer-utils';
import { AssessmentResponseInput, DiagnosticQuestion, LevelId } from '../../shared/models/content';

@Component({
  selector: 'app-diagnostic-test',
  standalone: true,
  imports: [RouterLink, UpperCasePipe, FormsModule],
  templateUrl: './diagnostic-test.html',
  styleUrl: './diagnostic-test.css',
})
export class DiagnosticTest implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly profile = inject(ProfileService);
  readonly lang = inject(LanguageService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  questions: DiagnosticQuestion[] = [];
  currentQuestion = 0;
  currentAnswer = '';
  selectedOption: number | null = null;
  listeningPlays: Record<string, number> = {};
  speakingAttempts: Record<string, number> = {};
  isFinished = false;
  recommendedLevel: LevelId = 'a1';
  statusMessage = '';
  score = 0;
  recognition: any;
  isRecording = false;

  async ngOnInit(): Promise<void> {
    const catalog = await this.catalog.ensureLoaded();
    this.questions = catalog.diagnosticTest;
    if (isPlatformBrowser(this.platformId)) {
      this.initSpeechRecognition();
    }
    this.loadCurrentResponse();
  }

  get current(): DiagnosticQuestion | null {
    return this.questions[this.currentQuestion] ?? null;
  }

  get progress(): number {
    return this.questions.length ? Math.round((this.currentQuestion / this.questions.length) * 100) : 0;
  }

  optionLabel(option: string | { ru: string; en: string; kz: string }): string {
    return this.lang.text(option);
  }

  remainingAudioPlays(question: DiagnosticQuestion): number {
    return Math.max(0, (question.maxAudioPlays ?? 3) - (this.listeningPlays[question.id] || 0));
  }

  remainingSpeakingAttempts(question: DiagnosticQuestion): number {
    return Math.max(0, (question.maxSpeakingAttempts ?? 3) - (this.speakingAttempts[question.id] || 0));
  }

  prompt(): string {
    return this.lang.text(this.current?.prompt ?? this.current?.text ?? '');
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
    if (!question || !question.audioText || !isPlatformBrowser(this.platformId)) {
      return;
    }

    const currentPlays = this.listeningPlays[question.id] ?? 0;
    const maxPlays = question.maxAudioPlays ?? 3;
    if (currentPlays >= maxPlays) {
      return;
    }

    this.listeningPlays = {
      ...this.listeningPlays,
      [question.id]: currentPlays + 1,
    };

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

    const usedAttempts = this.speakingAttempts[question.id] ?? 0;
    const maxAttempts = question.maxSpeakingAttempts ?? 3;
    if (usedAttempts >= maxAttempts) {
      return;
    }

    this.speakingAttempts = {
      ...this.speakingAttempts,
      [question.id]: usedAttempts + 1,
    };

    this.isRecording = true;
    this.currentAnswer = '';
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
    this.statusMessage = '';

    if (this.currentQuestion < this.questions.length - 1) {
      this.currentQuestion += 1;
      this.loadCurrentResponse();
      return;
    }

    await this.finishTest();
  }

  private loadCurrentResponse(): void {
    const question = this.current;
    if (!question) {
      return;
    }

    const existing = this.responses().find((item) => item.questionId === question.id);
    if (!existing) {
      this.currentAnswer = '';
      this.selectedOption = null;
      return;
    }

    if (typeof existing.answer === 'number') {
      this.selectedOption = existing.answer;
      this.currentAnswer = '';
    } else {
      this.currentAnswer = existing.answer;
      this.selectedOption = null;
    }
  }

  private responses(): AssessmentResponseInput[] {
    return this.questions
      .map((question) => this.buildStoredResponse(question.id))
      .filter((item): item is AssessmentResponseInput => Boolean(item));
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

  private buildResponse(question: DiagnosticQuestion): AssessmentResponseInput | null {
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

  private async finishTest(): Promise<void> {
    this.isFinished = true;
    try {
      const response = await this.profile.saveDiagnostic(this.responses());
      this.recommendedLevel = response.recommendedLevel;
      this.score = this.calculateScore();
      this.statusMessage = this.lang.t('diagnostic_saved');
    } catch (error) {
      this.statusMessage = error instanceof Error ? error.message : this.lang.t('diagnostic_save_error');
    }
  }

  private calculateScore(): number {
    return this.questions.reduce((sum, question) => sum + (this.isCorrect(question) ? 1 : 0), 0);
  }

  private isCorrect(question: DiagnosticQuestion): boolean {
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
