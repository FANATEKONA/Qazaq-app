import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CatalogService } from '../../core/services/catalog.service';
import { LanguageService } from '../../core/services/language.service';
import { ProfileService } from '../../core/services/profile.service';
import { DragDropGame, LevelId, ListeningSprintGame, LocalizedText, MatchWordsGame, MiniGame } from '../../shared/models/content';

interface MatchTranslationOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-arcade',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './arcade.html',
  styleUrl: './arcade.css',
})
export class ArcadePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly catalogService = inject(CatalogService);
  private readonly profileService = inject(ProfileService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly lang = inject(LanguageService);

  readonly loading = signal(true);
  readonly levelId = signal<LevelId>('a1');
  readonly intro = signal<string | LocalizedText>('');
  readonly games = signal<MiniGame[]>([]);
  readonly selectedGameId = signal('');
  readonly message = signal('');
  readonly matchTranslationIds = signal<string[]>([]);
  readonly matchAnswers = signal<Record<string, string>>({});
  readonly dragBank = signal<string[]>([]);
  readonly dragSlots = signal<(string | null)[]>([]);
  readonly listeningAnswers = signal<Record<string, number>>({});
  readonly draggingToken = signal<string | null>(null);

  readonly selectedGame = computed(() => {
    const gameId = this.selectedGameId();
    return this.games().find((item) => item.id === gameId) ?? null;
  });

  async ngOnInit(): Promise<void> {
    const catalog = await this.catalogService.ensureLoaded();
    await this.profileService.refresh(false);

    this.route.paramMap.subscribe((params) => {
      const nextLevelId = (params.get('levelId') as LevelId | null) ?? 'a1';
      const collection = catalog.gamesByLevel[nextLevelId];
      this.levelId.set(nextLevelId);
      this.intro.set(collection.intro);
      this.games.set(collection.games);
      this.loading.set(false);

      const preferredId = this.route.snapshot.queryParamMap.get('game');
      const game = collection.games.find((entry) => entry.id === preferredId) ?? collection.games[0];
      if (game) {
        this.selectGame(game.id);
      }
    });
  }

  selectGame(gameId: string): void {
    const game = this.games().find((item) => item.id === gameId);
    if (!game) {
      return;
    }

    this.selectedGameId.set(gameId);
    this.message.set('');
    this.resetGameState(game);
    void this.profileService
      .saveCheckpoint({ levelId: this.levelId(), contentType: 'mini-games', itemId: game.id })
      .catch(() => undefined);
  }

  chooseMatch(pairId: string, translationId: string): void {
    if (!translationId) {
      const nextAnswers = { ...this.matchAnswers() };
      delete nextAnswers[pairId];
      this.matchAnswers.set(nextAnswers);
      return;
    }

    const nextAnswers = { ...this.matchAnswers() };
    for (const [existingPairId, existingTranslationId] of Object.entries(nextAnswers)) {
      if (existingPairId !== pairId && existingTranslationId === translationId) {
        delete nextAnswers[existingPairId];
      }
    }
    nextAnswers[pairId] = translationId;
    this.matchAnswers.set(nextAnswers);
  }

  onDragStart(token: string): void {
    this.draggingToken.set(token);
  }

  allowDrop(event: DragEvent): void {
    event.preventDefault();
  }

  onDropToSlot(index: number): void {
    const token = this.draggingToken();
    if (!token) {
      return;
    }

    this.removeToken(token);
    const slots = [...this.dragSlots()];
    slots[index] = token;
    this.dragSlots.set(slots);
    this.draggingToken.set(null);
  }

  clearSlot(index: number): void {
    const slots = [...this.dragSlots()];
    const token = slots[index];
    if (!token) {
      return;
    }

    slots[index] = null;
    this.dragSlots.set(slots);
    this.dragBank.set([...this.dragBank(), token]);
  }

  chooseListening(roundId: string, optionIndex: number): void {
    this.listeningAnswers.set({
      ...this.listeningAnswers(),
      [roundId]: optionIndex,
    });
  }

  playRoundAudio(audioText: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(audioText);
    utterance.lang = 'kk-KZ';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  async submit(): Promise<void> {
    const game = this.selectedGame();
    if (!game) {
      return;
    }

    let score = 0;
    let total = 0;

    if (game.type === 'match-words') {
      const answers = this.matchAnswers();
      total = game.pairs.length;
      if (game.pairs.some((pair) => !answers[pair.id])) {
        this.message.set(this.lang.t('complete_pairs'));
        return;
      }
      score = game.pairs.reduce((sum, pair) => sum + (answers[pair.id] === pair.id ? 1 : 0), 0);
    }

    if (game.type === 'drag-and-drop') {
      const slots = this.dragSlots();
      total = game.correctOrder.length;
      if (slots.some((item) => !item)) {
        this.message.set(this.lang.t('fill_slots'));
        return;
      }
      score = game.correctOrder.reduce((sum, token, index) => sum + (slots[index] === token ? 1 : 0), 0);
    }

    if (game.type === 'listening-sprint') {
      const answers = this.listeningAnswers();
      total = game.rounds.length;
      if (Object.keys(answers).length !== total) {
        this.message.set(this.lang.t('answer_every_round'));
        return;
      }
      score = game.rounds.reduce((sum, round) => sum + (answers[round.id] === round.correct ? 1 : 0), 0);
    }

    await this.profileService.saveMiniGameProgress({
      levelId: this.levelId(),
      gameType: game.type,
      gameId: game.id,
      score,
      total,
      completed: true,
    });

    this.message.set(`${this.lang.t('saved_result')}: ${score}/${total}. ${this.lang.t('xp_applied')}`);
  }

  matchGame(): MatchWordsGame | null {
    const game = this.selectedGame();
    return game?.type === 'match-words' ? game : null;
  }

  dragGame(): DragDropGame | null {
    const game = this.selectedGame();
    return game?.type === 'drag-and-drop' ? game : null;
  }

  listeningGame(): ListeningSprintGame | null {
    const game = this.selectedGame();
    return game?.type === 'listening-sprint' ? game : null;
  }

  availableTranslations(): MatchTranslationOption[] {
    const game = this.matchGame();
    if (!game) {
      return [];
    }

    const labels = new Map(game.pairs.map((pair) => [pair.id, this.text(pair.translation)]));
    return this.matchTranslationIds().map((id) => ({
      id,
      label: labels.get(id) ?? '',
    }));
  }

  isTranslationTaken(translationId: string, pairId: string): boolean {
    return Object.entries(this.matchAnswers()).some(
      ([selectedPairId, value]) => value === translationId && selectedPairId !== pairId,
    );
  }

  selectedMatch(pairId: string): string {
    return this.matchAnswers()[pairId] ?? '';
  }

  text(value: string | LocalizedText): string {
    return this.lang.text(value);
  }

  introText(): string {
    const labels: Record<LevelId, LocalizedText> = {
      a1: {
        ru: 'Мини-игры A1 помогают закрепить базовые слова, короткие фразы и слуховое распознавание.',
        en: 'A1 mini-games help reinforce core words, short phrases and listening recognition.',
        kz: 'A1 мини-ойындары негізгі сөздерді, қысқа тіркестерді және тыңдап тануды бекітеді.',
      },
      a2: {
        ru: 'Мини-игры A2 помогают закрепить бытовые диалоги, лексику и базовые языковые паттерны.',
        en: 'A2 mini-games reinforce everyday dialogues, vocabulary and core language patterns.',
        kz: 'A2 мини-ойындары күнделікті диалогтарды, сөздікті және негізгі тілдік үлгілерді бекітеді.',
      },
      b1: {
        ru: 'Мини-игры B1 помогают быстрее закреплять смысловые связи, лексику и понимание контекста.',
        en: 'B1 mini-games strengthen vocabulary, meaning links and context understanding.',
        kz: 'B1 мини-ойындары сөздік қорды, мағыналық байланыстарды және контексті түсінуді күшейтеді.',
      },
      b2: {
        ru: 'Мини-игры B2 развивают скорость реакции, продвинутую лексику и точность понимания.',
        en: 'B2 mini-games develop reaction speed, advanced vocabulary and precision of understanding.',
        kz: 'B2 мини-ойындары реакция жылдамдығын, күрделі сөздікті және түсіну дәлдігін дамытады.',
      },
    };
    return this.text(labels[this.levelId()] ?? this.intro());
  }

  gameTitle(game: MiniGame): string {
    const labels: Record<string, LocalizedText> = {
      'a1-match': { ru: 'Сопоставление слов: Базовая лексика', en: 'Match words: Core vocabulary', kz: 'Сөздерді сәйкестендіру: Негізгі сөздер' },
      'a1-drag': { ru: 'Сборка фразы: Базовая реплика', en: 'Drag and drop: Build the phrase', kz: 'Сөйлем құрастыру: Негізгі тіркес' },
      'a1-listening': { ru: 'Аудио-спринт: Слушай и выбирай', en: 'Listening sprint: Listen and choose', kz: 'Тыңдау спринті: Тыңдап таңда' },
      'a2-match': { ru: 'Сопоставление слов: Бытовой словарь', en: 'Match words: Everyday vocabulary', kz: 'Сөздерді сәйкестендіру: Күнделікті сөздік' },
      'a2-drag': { ru: 'Сборка фразы: План на завтра', en: 'Drag and drop: Plan for tomorrow', kz: 'Сөйлем құрастыру: Ертеңгі жоспар' },
      'a2-listening': { ru: 'Аудио-спринт: Транспорт и покупки', en: 'Listening sprint: Transport and shopping', kz: 'Тыңдау спринті: Көлік пен сауда' },
      'b1-match': { ru: 'Сопоставление слов: Работа и проекты', en: 'Match words: Work and projects', kz: 'Сөздерді сәйкестендіру: Жұмыс пен жобалар' },
      'b1-drag': { ru: 'Сборка фразы: Аргумент', en: 'Drag and drop: Build the argument', kz: 'Сөйлем құрастыру: Дәлел' },
      'b1-listening': { ru: 'Аудио-спринт: Новости и встречи', en: 'Listening sprint: News and meetings', kz: 'Тыңдау спринті: Жаңалықтар мен кездесулер' },
      'b2-match': { ru: 'Сопоставление слов: Академическая лексика', en: 'Match words: Academic vocabulary', kz: 'Сөздерді сәйкестендіру: Академиялық лексика' },
      'b2-drag': { ru: 'Сборка фразы: Публичное выступление', en: 'Drag and drop: Public speech', kz: 'Сөйлем құрастыру: Көпшілікке сөз' },
      'b2-listening': { ru: 'Аудио-спринт: Общественные темы', en: 'Listening sprint: Social issues', kz: 'Тыңдау спринті: Қоғамдық тақырыптар' },
    };
    return this.text(labels[game.id] ?? (typeof game.title === 'string' ? game.title : game.title));
  }

  gameInstructions(game: MiniGame): string {
    const labels: Record<string, LocalizedText> = {
      'a1-match': {
        ru: 'Соедините казахские слова с переводом.',
        en: 'Match each Kazakh word with the correct translation.',
        kz: 'Қазақ сөздерін дұрыс аудармамен сәйкестендіріңіз.',
      },
      'a1-drag': {
        ru: 'Перетащите слова в правильном порядке, чтобы собрать фразу.',
        en: 'Drag the words into the correct order to build the phrase.',
        kz: 'Сөйлемді құрау үшін сөздерді дұрыс ретпен орналастырыңыз.',
      },
      'a1-listening': {
        ru: 'Прослушайте аудио и выберите услышанную фразу.',
        en: 'Listen to the audio and choose the phrase you heard.',
        kz: 'Аудионы тыңдап, естіген тіркесті таңдаңыз.',
      },
      'a2-match': {
        ru: 'Найдите пары для слов из повседневных ситуаций.',
        en: 'Match words from everyday situations with their meanings.',
        kz: 'Күнделікті жағдайлардағы сөздерді мағынасымен сәйкестендіріңіз.',
      },
      'a2-drag': {
        ru: 'Соберите предложение о планах.',
        en: 'Build a sentence about plans.',
        kz: 'Жоспар туралы сөйлем құрастырыңыз.',
      },
      'a2-listening': {
        ru: 'Прослушайте аудио и выберите услышанную фразу.',
        en: 'Listen to the audio and choose the phrase you heard.',
        kz: 'Аудионы тыңдап, естіген тіркесті таңдаңыз.',
      },
      'b1-match': {
        ru: 'Соедините слова с переводом.',
        en: 'Match the words with their translations.',
        kz: 'Сөздерді аудармасымен сәйкестендіріңіз.',
      },
      'b1-drag': {
        ru: 'Соберите логичную фразу.',
        en: 'Build a logical phrase.',
        kz: 'Логикалық тіркес құрастырыңыз.',
      },
      'b1-listening': {
        ru: 'Прослушайте аудио и выберите услышанную фразу.',
        en: 'Listen to the audio and choose the phrase you heard.',
        kz: 'Аудионы тыңдап, естіген тіркесті таңдаңыз.',
      },
      'b2-match': {
        ru: 'Сопоставьте слова высокого уровня.',
        en: 'Match advanced words with their meanings.',
        kz: 'Жоғары деңгейлі сөздерді сәйкестендіріңіз.',
      },
      'b2-drag': {
        ru: 'Соберите формальную фразу.',
        en: 'Build a formal phrase.',
        kz: 'Ресми тіркес құрастырыңыз.',
      },
      'b2-listening': {
        ru: 'Прослушайте аудио и выберите услышанную фразу.',
        en: 'Listen to the audio and choose the phrase you heard.',
        kz: 'Аудионы тыңдап, естіген тіркесті таңдаңыз.',
      },
    };
    return this.text(labels[game.id] ?? (typeof game.instructions === 'string' ? game.instructions : game.instructions));
  }

  gameTypeLabel(game: MiniGame): string {
    const labels: Record<MiniGame['type'], LocalizedText> = {
      'match-words': { ru: 'Сопоставление слов', en: 'Match words', kz: 'Сөздерді сәйкестендіру' },
      'drag-and-drop': { ru: 'Сборка фразы', en: 'Drag and drop', kz: 'Сөйлем құрастыру' },
      'listening-sprint': { ru: 'Аудио-спринт', en: 'Listening sprint', kz: 'Тыңдау спринті' },
    };
    return this.text(labels[game.type]);
  }

  roundPrompt(gameId: string, roundId: string, fallback: string): string {
    const labels: Record<string, LocalizedText> = {
      'a1-listening:l1': {
        ru: 'Что вы услышали?',
        en: 'What did you hear?',
        kz: 'Не естідіңіз?',
      },
      'a1-listening:l2': {
        ru: 'Что вы услышали?',
        en: 'What did you hear?',
        kz: 'Не естідіңіз?',
      },
      'a2-listening:l1': {
        ru: 'Что вы услышали?',
        en: 'What did you hear?',
        kz: 'Не естідіңіз?',
      },
      'a2-listening:l2': {
        ru: 'Что вы услышали?',
        en: 'What did you hear?',
        kz: 'Не естідіңіз?',
      },
      'b1-listening:l1': {
        ru: 'Что вы услышали?',
        en: 'What did you hear?',
        kz: 'Не естідіңіз?',
      },
      'b1-listening:l2': {
        ru: 'Что вы услышали?',
        en: 'What did you hear?',
        kz: 'Не естідіңіз?',
      },
      'b2-listening:l1': {
        ru: 'Что вы услышали?',
        en: 'What did you hear?',
        kz: 'Не естідіңіз?',
      },
      'b2-listening:l2': {
        ru: 'Что вы услышали?',
        en: 'What did you hear?',
        kz: 'Не естідіңіз?',
      },
    };
    return this.text(labels[`${gameId}:${roundId}`] ?? fallback);
  }

  roundOptions(gameId: string, roundId: string, fallback: string[]): string[] {
    const labels: Record<string, LocalizedText[]> = {
      'a1-listening:l1': [
        { ru: 'Сәлеметсіз бе', en: 'Сәлеметсіз бе', kz: 'Сәлеметсіз бе' },
        { ru: 'Сау болыңыз', en: 'Сау болыңыз', kz: 'Сау болыңыз' },
        { ru: 'Рақмет', en: 'Рақмет', kz: 'Рақмет' },
      ],
      'a1-listening:l2': [
        { ru: 'Мен Алматыда тұрамын', en: 'Мен Алматыда тұрамын', kz: 'Мен Алматыда тұрамын' },
        { ru: 'Мен Алматыға барамын', en: 'Мен Алматыға барамын', kz: 'Мен Алматыға барамын' },
        { ru: 'Мен Алматыны жақсы көремін', en: 'Мен Алматыны жақсы көремін', kz: 'Мен Алматыны жақсы көремін' },
      ],
      'a2-listening:l1': [
        { ru: 'Маған бір билет керек', en: 'Маған бір билет керек', kz: 'Маған бір билет керек' },
        { ru: 'Маған бір дос керек', en: 'Маған бір дос керек', kz: 'Маған бір дос керек' },
        { ru: 'Мен билет сатып алдым', en: 'Мен билет сатып алдым', kz: 'Мен билет сатып алдым' },
      ],
      'a2-listening:l2': [
        { ru: 'Бұл қайда?', en: 'Бұл қайда?', kz: 'Бұл қайда?' },
        { ru: 'Бұл қанша тұрады?', en: 'Бұл қанша тұрады?', kz: 'Бұл қанша тұрады?' },
        { ru: 'Бұл қашан басталады?', en: 'Бұл қашан басталады?', kz: 'Бұл қашан басталады?' },
      ],
      'b1-listening:l1': [
        { ru: 'Жиналыс сағат үште басталады', en: 'Жиналыс сағат үште басталады', kz: 'Жиналыс сағат үште басталады' },
        { ru: 'Жиналыс сағат екіде басталады', en: 'Жиналыс сағат екіде басталады', kz: 'Жиналыс сағат екіде басталады' },
        { ru: 'Жиналыс ертең таңертең басталады', en: 'Жиналыс ертең таңертең басталады', kz: 'Жиналыс ертең таңертең басталады' },
      ],
      'b1-listening:l2': [
        { ru: 'Бұл сапар маған ұнамады', en: 'Бұл сапар маған ұнамады', kz: 'Бұл сапар маған ұнамады' },
        { ru: 'Бұл сапар маған қатты ұнады', en: 'Бұл сапар маған қатты ұнады', kz: 'Бұл сапар маған қатты ұнады' },
        { ru: 'Бұл сапар тоқтатылды', en: 'Бұл сапар тоқтатылды', kz: 'Бұл сапар тоқтатылды' },
      ],
      'b2-listening:l1': [
        { ru: 'Бұл мәселе қоғам үшін өте маңызды', en: 'Бұл мәселе қоғам үшін өте маңызды', kz: 'Бұл мәселе қоғам үшін өте маңызды' },
        { ru: 'Бұл мәселе маңызды емес', en: 'Бұл мәселе маңызды емес', kz: 'Бұл мәселе маңызды емес' },
        { ru: 'Бұл жеке мәселе', en: 'Бұл жеке мәселе', kz: 'Бұл жеке мәселе' },
      ],
      'b2-listening:l2': [
        { ru: 'Осылайша шешім мүмкін емес', en: 'Осылайша шешім мүмкін емес', kz: 'Осылайша шешім мүмкін емес' },
        { ru: 'Осылайша біз тиімді шешімге келе аламыз', en: 'Осылайша біз тиімді шешімге келе аламыз', kz: 'Осылайша біз тиімді шешімге келе аламыз' },
        { ru: 'Осылайша тоқтау керек', en: 'Осылайша тоқтау керек', kz: 'Осылайша тоқтау керек' },
      ],
    };

    const bank = labels[`${gameId}:${roundId}`];
    return bank ? bank.map((item) => this.text(item)) : fallback;
  }

  isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private resetGameState(game: MiniGame): void {
    if (game.type === 'match-words') {
      this.matchTranslationIds.set(this.shuffle(game.pairs.map((pair) => pair.id)));
      this.matchAnswers.set({});
      this.dragBank.set([]);
      this.dragSlots.set([]);
      this.listeningAnswers.set({});
      return;
    }

    if (game.type === 'drag-and-drop') {
      this.dragBank.set(this.shuffle([...game.tokens]));
      this.dragSlots.set(Array.from({ length: game.correctOrder.length }, () => null));
      this.matchTranslationIds.set([]);
      this.matchAnswers.set({});
      this.listeningAnswers.set({});
      return;
    }

    this.listeningAnswers.set({});
    this.matchTranslationIds.set([]);
    this.matchAnswers.set({});
    this.dragBank.set([]);
    this.dragSlots.set([]);
  }

  private removeToken(token: string): void {
    this.dragBank.set(this.dragBank().filter((item) => item !== token));
    this.dragSlots.set(
      this.dragSlots().map((item) => {
        return item === token ? null : item;
      }),
    );
  }

  private shuffle<T>(items: T[]): T[] {
    for (let index = items.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    }
    return items;
  }
}
