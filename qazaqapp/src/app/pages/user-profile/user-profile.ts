import { UpperCasePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { LanguageService } from '../../core/services/language.service';
import { ProfileService } from '../../core/services/profile.service';
import { LocalizedText, UserRole } from '../../shared/models/content';
import { BadgeView, DailyTaskView, LeaderboardEntry, ProfileResponse } from '../../shared/models/profile';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [RouterLink, UpperCasePipe, FormsModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css',
})
export class UserProfile implements OnInit {
  readonly profileService = inject(ProfileService);
  readonly lang = inject(LanguageService);
  readonly profile = computed(() => this.profileService.profile());

  readonly selectedTeacherId = signal('');
  readonly requestedTeacherId = signal('');
  readonly teacherChangeMessage = signal('');
  readonly feedbackMessage = signal('');
  readonly taskStudentId = signal('');
  readonly taskTitle = signal('');
  readonly taskDescription = signal('');
  readonly taskDueDate = signal('');
  readonly actionMessage = signal('');
  readonly minDueDate = signal(new Date().toISOString().slice(0, 10));

  async ngOnInit(): Promise<void> {
    await this.profileService.refresh(true);
    this.syncDefaults();
  }

  ringStyle(percent: number, accent: string): string {
    return `conic-gradient(${accent} 0 ${percent}%, rgba(18, 61, 60, 0.08) ${percent}% 100%)`;
  }

  xpProgressPercent(): number {
    const profile = this.profile();
    if (!profile) {
      return 0;
    }

    const currentFloor = this.xpThreshold(profile.user.xpLevel);
    const nextThreshold = profile.nextLevelXp;
    const progress = ((profile.user.xp - currentFloor) / Math.max(1, nextThreshold - currentFloor)) * 100;
    return Math.max(0, Math.min(100, Math.round(progress)));
  }

  taskPercent(task: DailyTaskView): number {
    return task.target ? Math.min(100, Math.round((task.progress / task.target) * 100)) : 0;
  }

  badgeClass(badge: BadgeView): string {
    return badge.tone;
  }

  text(value: string | LocalizedText | undefined | null): string {
    return this.lang.text(value);
  }

  currentLevelTitle(levelId: string): string {
    const suffix = this.pick({
      ru: 'прогресс',
      en: 'progress',
      kz: 'прогресі',
    });
    return `${levelId.toUpperCase()} ${suffix}`;
  }

  progressLabel(key: string): string {
    const labels: Record<string, { ru: string; en: string; kz: string }> = {
      video: { ru: 'Видеоуроки', en: 'Video lessons', kz: 'Видео сабақтар' },
      grammar: { ru: 'Грамматика', en: 'Grammar', kz: 'Грамматика' },
      shadowing: { ru: 'Speaking', en: 'Speaking', kz: 'Сөйлеу' },
      skills: { ru: 'Reading & Listening', en: 'Reading & Listening', kz: 'Оқу және тыңдау' },
      'mini-games': { ru: 'Мини-игры', en: 'Mini-games', kz: 'Мини-ойындар' },
    };
    return this.pick(labels[key] ?? { ru: key, en: key, kz: key });
  }

  dailyTaskTitle(taskId: string): string {
    const labels: Record<string, { ru: string; en: string; kz: string }> = {
      'video-spark': { ru: 'Видео дня', en: 'Video of the day', kz: 'Күн видеосы' },
      'practice-loop': { ru: 'Практика дня', en: 'Practice of the day', kz: 'Күн практикасы' },
      'arcade-boost': { ru: 'Arcade Boost', en: 'Arcade Boost', kz: 'Arcade Boost' },
    };
    return this.pick(labels[taskId] ?? { ru: taskId, en: taskId, kz: taskId });
  }

  dailyTaskDescription(taskId: string): string {
    const labels: Record<string, { ru: string; en: string; kz: string }> = {
      'video-spark': {
        ru: 'Завершите хотя бы один видеоурок.',
        en: 'Complete at least one video lesson.',
        kz: 'Кемінде бір видео сабақты аяқтаңыз.',
      },
      'practice-loop': {
        ru: 'Завершите грамматику или shadowing-сессию.',
        en: 'Complete a grammar topic or a shadowing session.',
        kz: 'Грамматика тақырыбын не shadowing сессиясын аяқтаңыз.',
      },
      'arcade-boost': {
        ru: 'Пройдите мини-игру или раздел навыков.',
        en: 'Finish a mini-game or a skills lesson.',
        kz: 'Мини-ойынды немесе дағды бөлімін аяқтаңыз.',
      },
    };
    return this.pick(labels[taskId] ?? { ru: '', en: '', kz: '' });
  }

  studyDayLabel(date: string): string {
    const locale = this.lang.lang() === 'kz' ? 'kk-KZ' : this.lang.lang() === 'en' ? 'en-US' : 'ru-RU';
    const value = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(date));
    return value.replace('.', '');
  }

  weeklyChallengeDescription(): string {
    return this.pick({
      ru: 'Будьте активны каждый день на этой неделе, чтобы открыть награду за серию.',
      en: 'Stay active every day this week to unlock the streak reward.',
      kz: 'Серия сыйлығын ашу үшін осы аптада күн сайын белсенді болыңыз.',
    });
  }

  roleLabel(role: UserRole): string {
    return role === 'teacher' ? this.lang.t('role_teacher') : this.lang.t('role_student');
  }

  rankTitle(role: UserRole, xpLevel: number): string {
    const studentRanks = [
      { ru: 'Старт', en: 'Starter', kz: 'Бастау' },
      { ru: 'Исследователь', en: 'Explorer', kz: 'Зерттеуші' },
      { ru: 'Навигатор', en: 'Navigator', kz: 'Бағыттаушы' },
      { ru: 'Ученый', en: 'Scholar', kz: 'Білімпаз' },
      { ru: 'Амбассадор', en: 'Ambassador', kz: 'Елші' },
      { ru: 'Легенда', en: 'Legend', kz: 'Аңыз' },
    ];
    const teacherRanks = [
      { ru: 'Куратор', en: 'Curator', kz: 'Куратор' },
      { ru: 'Ментор', en: 'Mentor', kz: 'Ментор' },
      { ru: 'Коуч', en: 'Coach', kz: 'Коуч' },
      { ru: 'Ведущий ментор', en: 'Lead Mentor', kz: 'Жетекші ментор' },
      { ru: 'Факультет лид', en: 'Faculty Lead', kz: 'Факультет жетекшісі' },
      { ru: 'Мастер-гид', en: 'Master Guide', kz: 'Шебер гид' },
    ];
    const bank = role === 'teacher' ? teacherRanks : studentRanks;
    return this.pick(bank[Math.min(bank.length - 1, Math.max(0, xpLevel - 1))]);
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

  badgeLabel(badge: BadgeView, profile: ProfileResponse): string {
    const labels: Record<string, { ru: string; en: string; kz: string }> = {
      'streak-7': { ru: 'Серия 7 дней', en: '7-Day Streak', kz: '7 күндік серия' },
      'streak-14': { ru: 'Фокус 14 дней', en: '14-Day Focus', kz: '14 күндік фокус' },
      certificate: { ru: 'Сертифицированный ученик', en: 'Certified learner', kz: 'Сертификат иесі' },
      arcade: { ru: 'Arcade-исследователь', en: 'Arcade Explorer', kz: 'Arcade зерттеушісі' },
    };

    if (badge.id === 'rank-title') {
      return this.rankTitle(profile.user.role, profile.user.xpLevel);
    }
    if (badge.id === 'crown') {
      return this.crownTitle(profile.user.totalPoints);
    }
    if (badge.id === `role-${profile.user.role}`) {
      return this.roleLabel(profile.user.role);
    }
    return this.pick(labels[badge.id] ?? { ru: badge.label, en: badge.label, kz: badge.label });
  }

  roleHubTitle(profile: ProfileResponse): string {
    return profile.user.role === 'teacher'
      ? this.pick({ ru: 'Панель учителя', en: 'Teacher studio', kz: 'Мұғалім панелі' })
      : this.pick({ ru: 'Панель ученика', en: 'Student cockpit', kz: 'Оқушы панелі' });
  }

  roleHubCardTitle(cardId: string, role: UserRole): string {
    const teacherLabels: Record<string, { ru: string; en: string; kz: string }> = {
      students: { ru: 'Ученики', en: 'Learners', kz: 'Оқушылар' },
      'avg-streak': { ru: 'Средняя серия', en: 'Average streak', kz: 'Орташа серия' },
      certificates: { ru: 'Сертификаты', en: 'Certificates', kz: 'Сертификаттар' },
    };
    const studentLabels: Record<string, { ru: string; en: string; kz: string }> = {
      daily: { ru: 'Ежедневные задания', en: 'Daily tasks', kz: 'Күнделікті тапсырмалар' },
      weekly: { ru: '7-дневный челлендж', en: '7-Day challenge', kz: '7 күндік челлендж' },
      certs: { ru: 'Сертификаты', en: 'Certificates', kz: 'Сертификаттар' },
    };
    const bank = role === 'teacher' ? teacherLabels : studentLabels;
    return this.pick(bank[cardId] ?? { ru: cardId, en: cardId, kz: cardId });
  }

  roleHubCardSubtitle(cardId: string, role: UserRole): string {
    const teacherLabels: Record<string, { ru: string; en: string; kz: string }> = {
      students: { ru: 'Студентов в системе', en: 'Students in the system', kz: 'Жүйедегі оқушылар' },
      'avg-streak': { ru: 'Средняя регулярность', en: 'Average consistency', kz: 'Орташа тұрақтылық' },
      certificates: { ru: 'Выдано сертификатов', en: 'Certificates issued', kz: 'Берілген сертификаттар' },
    };
    const studentLabels: Record<string, { ru: string; en: string; kz: string }> = {
      daily: { ru: 'Миссии на сегодня', en: 'Missions for today', kz: 'Бүгінгі миссиялар' },
      weekly: { ru: 'Прогресс недели', en: 'Weekly progress', kz: 'Апта прогресі' },
      certs: { ru: 'Подтвержденные уровни', en: 'Verified levels', kz: 'Расталған деңгейлер' },
    };
    const bank = role === 'teacher' ? teacherLabels : studentLabels;
    return this.pick(bank[cardId] ?? { ru: '', en: '', kz: '' });
  }

  roleHubHighlights(profile: ProfileResponse): string[] {
    if (profile.user.role === 'teacher') {
      const topStudent = profile.leaderboard[0]?.name ?? this.pick({ ru: 'нет данных', en: 'no data', kz: 'дерек жоқ' });
      return [
        `${this.pick({ ru: 'Топ-ученик недели', en: 'Top learner of the week', kz: 'Аптаның үздік оқушысы' })}: ${topStudent}`,
        `${this.pick({ ru: 'Ученики в группе', en: 'Learners in your group', kz: 'Тобыңыздағы оқушылар' })}: ${profile.teacherStudents.length}`,
        `${this.pick({ ru: 'Фокус для внимания', en: 'Current focus', kz: 'Қазіргі фокус' })}: ${this.skillLabel(profile.weakSkills[0]?.id ?? 'skills')}`,
      ];
    }

    return [
      `${this.pick({ ru: 'Следующий ранг', en: 'Next rank', kz: 'Келесі ранг' })}: ${this.rankTitle(profile.user.role, profile.user.xpLevel + 1)}`,
      `${this.pick({ ru: 'Сегодня получено XP', en: 'XP earned today', kz: 'Бүгін алынған XP' })}: ${this.roleHubXpToday(profile)}`,
      `${this.pick({ ru: 'Лучший навык сейчас', en: 'Top skill right now', kz: 'Қазіргі үздік дағды' })}: ${this.skillLabel(profile.strongSkills[0]?.id ?? 'skills')}`,
    ];
  }

  roleHubXpToday(profile: ProfileResponse): number {
    const highlight = profile.roleHub.highlights.find((item) => /xp/i.test(item));
    const match = highlight?.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  }

  skillLabel(skillId: string): string {
    const labels: Record<string, { ru: string; en: string; kz: string }> = {
      video: { ru: 'Видео', en: 'Video', kz: 'Видео' },
      grammar: { ru: 'Грамматика', en: 'Grammar', kz: 'Грамматика' },
      shadowing: { ru: 'Speaking', en: 'Speaking', kz: 'Сөйлеу' },
      skills: { ru: 'Reading & Listening', en: 'Reading & Listening', kz: 'Оқу және тыңдау' },
      'mini-games': { ru: 'Мини-игры', en: 'Mini-games', kz: 'Мини-ойындар' },
    };
    return this.pick(labels[skillId] ?? { ru: skillId, en: skillId, kz: skillId });
  }

  skillDescription(skillId: string): string {
    const labels: Record<string, { ru: string; en: string; kz: string }> = {
      video: {
        ru: 'Показывает, насколько системно вы проходите видеоуроки.',
        en: 'Shows how consistently you move through video lessons.',
        kz: 'Видео сабақтарды қаншалықты жүйелі өтетініңізді көрсетеді.',
      },
      grammar: {
        ru: 'Оценивает качество выполнения грамматических тем.',
        en: 'Measures the quality of your grammar practice.',
        kz: 'Грамматикалық тақырыптарды орындау сапасын бағалайды.',
      },
      shadowing: {
        ru: 'Отражает устную практику и точность произношения.',
        en: 'Reflects spoken practice and pronunciation accuracy.',
        kz: 'Ауызша тәжірибе мен айтылым дәлдігін көрсетеді.',
      },
      skills: {
        ru: 'Показывает понимание текста и аудио.',
        en: 'Shows your understanding of text and audio.',
        kz: 'Мәтін мен аудионы түсіну деңгейін көрсетеді.',
      },
      'mini-games': {
        ru: 'Оценивает скорость закрепления словаря и паттернов.',
        en: 'Measures how quickly you reinforce vocabulary and patterns.',
        kz: 'Сөздік пен үлгілерді қаншалықты тез бекітетініңізді бағалайды.',
      },
    };
    return this.pick(labels[skillId] ?? { ru: '', en: '', kz: '' });
  }

  achievementTitle(id: string): string {
    const labels: Record<string, { ru: string; en: string; kz: string }> = {
      'first-steps': { ru: 'Первые шаги', en: 'First steps', kz: 'Алғашқы қадамдар' },
      discipline: { ru: 'Дисциплина', en: 'Discipline', kz: 'Тұрақтылық' },
      orator: { ru: 'Оратор', en: 'Orator', kz: 'Шешен' },
      'master-a1': { ru: 'Магистр A1', en: 'A1 master', kz: 'A1 шебері' },
      polyglot: { ru: 'Полиглот', en: 'Polyglot', kz: 'Полиглот' },
      'mistake-free': { ru: 'Без ошибок', en: 'Mistake-free', kz: 'Қатесіз' },
    };
    return this.pick(labels[id] ?? { ru: id, en: id, kz: id });
  }

  achievementDescription(id: string): string {
    const labels: Record<string, { ru: string; en: string; kz: string }> = {
      'first-steps': { ru: 'Пройти 5 любых учебных единиц', en: 'Complete any 5 learning units', kz: 'Кез келген 5 оқу бірлігін аяқтау' },
      discipline: { ru: 'Заниматься 7 дней подряд', en: 'Study for 7 days in a row', kz: '7 күн қатарынан оқу' },
      orator: { ru: 'Завершить 10 практик Shadowing', en: 'Finish 10 shadowing practices', kz: '10 shadowing жаттығуын аяқтау' },
      'master-a1': { ru: 'Сдать итоговый тест A1 на 100%', en: 'Score 100% on the A1 module test', kz: 'A1 модульдік тестін 100% тапсыру' },
      polyglot: { ru: 'Накопить 100 условных слов опыта', en: 'Collect 100 vocabulary experience points', kz: '100 сөздік тәжірибе ұпайын жинау' },
      'mistake-free': { ru: 'Пройти 5 грамматических тем с первого раза', en: 'Complete 5 grammar topics on the first try', kz: '5 грамматика тақырыбын бірінші реттен өту' },
    };
    return this.pick(labels[id] ?? { ru: '', en: '', kz: '' });
  }

  leaderboardClass(entry: LeaderboardEntry): string {
    return entry.userId === this.profile()?.user.id ? 'leader-row me' : 'leader-row';
  }

  async assignTeacher(): Promise<void> {
    if (!this.selectedTeacherId()) {
      return;
    }
    try {
      await this.profileService.selectTeacher({ teacherId: this.selectedTeacherId() });
      this.actionMessage.set(this.pick({ ru: 'Учитель выбран.', en: 'Teacher selected.', kz: 'Мұғалім таңдалды.' }));
      this.syncDefaults();
    } catch (error) {
      this.actionMessage.set(error instanceof Error ? error.message : this.pick({ ru: 'Не удалось выбрать учителя.', en: 'Unable to select teacher.', kz: 'Мұғалімді таңдау мүмкін болмады.' }));
    }
  }

  async requestTeacherChange(): Promise<void> {
    if (!this.requestedTeacherId()) {
      return;
    }
    try {
      await this.profileService.requestTeacherChange({
        teacherId: this.requestedTeacherId(),
        message: this.teacherChangeMessage(),
      });
      this.teacherChangeMessage.set('');
      this.actionMessage.set(this.pick({ ru: 'Запрос на смену учителя отправлен в бот.', en: 'Teacher change request sent to the bot center.', kz: 'Мұғалімді ауыстыру сұрауы ботқа жіберілді.' }));
      this.syncDefaults();
    } catch (error) {
      this.actionMessage.set(error instanceof Error ? error.message : this.pick({ ru: 'Не удалось отправить запрос.', en: 'Unable to send request.', kz: 'Сұрауды жіберу мүмкін болмады.' }));
    }
  }

  async submitFeedback(): Promise<void> {
    if (!this.feedbackMessage().trim()) {
      return;
    }
    try {
      await this.profileService.submitFeedback({ message: this.feedbackMessage() });
      this.feedbackMessage.set('');
      this.actionMessage.set(this.pick({ ru: 'Отзыв отправлен в бот.', en: 'Feedback sent to the bot center.', kz: 'Пікір ботқа жіберілді.' }));
    } catch (error) {
      this.actionMessage.set(error instanceof Error ? error.message : this.pick({ ru: 'Не удалось отправить отзыв.', en: 'Unable to send feedback.', kz: 'Пікірді жіберу мүмкін болмады.' }));
    }
  }

  async createTeacherTask(): Promise<void> {
    if (!this.taskStudentId() || !this.taskTitle().trim() || !this.taskDescription().trim()) {
      return;
    }
    try {
      await this.profileService.createTeacherTask({
        studentId: this.taskStudentId(),
        title: this.taskTitle(),
        description: this.taskDescription(),
        dueDate: this.taskDueDate() || null,
      });
      this.taskTitle.set('');
      this.taskDescription.set('');
      this.taskDueDate.set('');
      this.actionMessage.set(this.pick({ ru: 'Задание создано.', en: 'Teacher task created.', kz: 'Тапсырма құрылды.' }));
      this.syncDefaults();
    } catch (error) {
      this.actionMessage.set(error instanceof Error ? error.message : this.pick({ ru: 'Не удалось создать задание.', en: 'Unable to create task.', kz: 'Тапсырма құру мүмкін болмады.' }));
    }
  }

  async completeStudentTask(taskId: string): Promise<void> {
    try {
      await this.profileService.completeStudentTask({ taskId });
      this.actionMessage.set(this.pick({ ru: 'Задание отмечено выполненным.', en: 'Task marked as completed.', kz: 'Тапсырма орындалды деп белгіленді.' }));
    } catch (error) {
      this.actionMessage.set(error instanceof Error ? error.message : this.pick({ ru: 'Не удалось обновить задание.', en: 'Unable to update task.', kz: 'Тапсырманы жаңарту мүмкін болмады.' }));
    }
  }

  private syncDefaults(): void {
    const profile = this.profile();
    if (!profile) {
      return;
    }
    this.selectedTeacherId.set(profile.teacherDirectory[0]?.id ?? '');
    this.requestedTeacherId.set(profile.teacherDirectory.find((item) => item.id !== profile.teacherAssignment?.teacher.id)?.id ?? '');
    this.taskStudentId.set(profile.teacherStudents[0]?.id ?? '');
  }

  private xpThreshold(level: number): number {
    if (level <= 1) {
      return 0;
    }
    return (level - 1) * level * 60;
  }

  private pick(bank: { ru: string; en: string; kz: string }): string {
    return bank[this.lang.lang()];
  }
}
