import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms'; // <-- ДОБАВЛЕН ДЛЯ РАБОТЫ С INPUT

@Component({
  selector: 'app-grammar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, FormsModule], // <-- ДОБАВЛЕН СЮДА
  templateUrl: './grammar.html',
  styleUrl: './grammar.css'
})
export class Grammar implements OnInit {
  route = inject(ActivatedRoute);
  levelId: string = 'a1';
  currentTopicId: string = '1';

  // Состояние упражнения
  isExerciseActive = false;
  userAnswer: string = '';
  isChecked = false;
  isCorrect = false;

  grammarDatabase: { [key: string]: any[] } = {
    'a1': [
      {
        id: '1',
        title: 'Множественное число (лар/лер)',
        rule: 'Окончания множественного числа зависят от последнего звука слова...',
        // Добавили данные для упражнения
        exercise: { word: 'Бала (дети)', correct: 'лар' }
      },
      {
        id: '2',
        title: 'Притяжательные окончания',
        rule: 'Используются для выражения принадлежности (мой, твой, его)...',
        exercise: { word: 'Менің кітаб...', correct: 'ым' }
      },
      // Остальные темы без изменений (можно добавить exercise позже)
      { id: '3', title: 'Падежи: Именительный', rule: 'Начальная форма слова. Отвечает на вопросы Кім? Не?' },
      { id: '4', title: 'Падежи: Родительный', rule: 'Обозначает принадлежность. Окончания -ның/-нің, -дың/-дің...' },
      { id: '5', title: 'Падежи: Дательно-направительный', rule: 'Указывает направление. Окончания -ға/-ге, -қа/-ке...' },
      { id: '6', title: 'Глагол: Настоящее время', rule: 'Образуется с помощью вспомогательных глаголов жатыр, отыр, тұр, жүр...' },
      { id: '7', title: 'Отрицание (ма/ме, ба/бе)', rule: 'Отрицательная форма образуется добавлением суффиксов к основе...' },
      { id: '8', title: 'Вопросительные частицы', rule: 'Частицы ма/ме, ба/бе, па/пе ставятся в конце предложения...' },
      { id: '9', title: 'Послелоги (үшін, туралы)', rule: 'Употребляются после существительных, выполняют роль предлогов...' },
      { id: '10', title: 'Порядковые числительные', rule: 'Образуются с помощью суффиксов -ншы/-нші, -ыншы/-інші...' }
    ],
    'a2': [
      { id: '1', title: 'Прошедшее время', rule: 'Обозначает действие, которое уже произошло. Окончания -ды/-ді, -ты/-ті...' }
    ]
  };

  topics: any[] = [];

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.levelId = (params.get('levelId') || 'a1').toLowerCase();
      this.currentTopicId = params.get('topicId') || '1';
      this.topics = this.grammarDatabase[this.levelId] || this.grammarDatabase['a1'];

      // Сбрасываем состояние при смене темы
      this.isExerciseActive = false;
      this.resetExercise();
    });
  }

  get currentTopic() {
    return this.topics.find(t => t.id === this.currentTopicId) || this.topics[0];
  }

  toggleExercise() {
    this.isExerciseActive = !this.isExerciseActive;
    if (!this.isExerciseActive) {
      this.resetExercise();
    }
  }

  resetExercise() {
    this.userAnswer = '';
    this.isChecked = false;
    this.isCorrect = false;
  }

  // Функция проверки ответа
  checkAnswer() {
    if (!this.userAnswer.trim()) return; // Если пусто, ничего не делаем

    // Сравниваем ответ пользователя (без пробелов, в нижнем регистре) с правильным
    const correctAnswer = this.currentTopic.exercise?.correct.toLowerCase();

    if (this.userAnswer.trim().toLowerCase() === correctAnswer) {
      this.isCorrect = true;
    } else {
      this.isCorrect = false;
    }

    this.isChecked = true;
  }
}
