import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-profile', // Обновили селектор
  standalone: true,
  imports: [RouterLink],
  templateUrl: './user-profile.html', // Указали правильный HTML
  styleUrl: './user-profile.css'      // Указали правильный CSS
})
export class UserProfile { // Обновили название класса
  // Данные пользователя
  user = {
    name: 'Елгелді',
    role: 'Software Engineer',
    avatar: '👨‍💻',
    currentLevel: 'A1',
    streak: 14,
    totalPoints: 1250
  };

  // Статистика по текущему уровню
  stats = [
    { label: 'Видеоуроки', value: 8, total: 10, color: '#3498db' },
    { label: 'Грамматика', value: 5, total: 10, color: '#f39c12' },
    { label: 'Говорение', value: 3, total: 10, color: '#e74c3c' },
    { label: 'Чтение и Аудирование', value: 2, total: 10, color: '#27ae60' }
  ];

  // Достижения
  achievements = [
    { icon: '🔥', title: 'Первые шаги', desc: 'Пройти 5 любых уроков', unlocked: true },
    { icon: '📅', title: 'Дисциплина', desc: 'Заниматься 7 дней подряд', unlocked: true },
    { icon: '🗣️', title: 'Оратор', desc: 'Пройти 10 практик Shadowing', unlocked: false },
    { icon: '🏆', title: 'Магистр A1', desc: 'Сдать итоговый тест A1 на 100%', unlocked: false },
    { icon: '🧠', title: 'Полиглот', desc: 'Выучить 100 новых слов', unlocked: false },
    { icon: '⚡', title: 'Без ошибок', desc: 'Пройти грамматику без единой ошибки', unlocked: false }
  ];

  // Вычисление процентов для прогресс-баров
  getPercent(value: number, total: number): number {
    return Math.round((value / total) * 100);
  }
}
