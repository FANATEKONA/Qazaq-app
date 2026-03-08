import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-diagnostic-test',
  standalone: true,
  imports: [RouterLink, UpperCasePipe],
  templateUrl: './diagnostic-test.html',
  styleUrl: './diagnostic-test.css'
})
export class DiagnosticTest {
  // Простой массив вопросов для примера
  questions = [
    { text: 'Как переводится "Сәлем"?', options: ['Пока', 'Привет', 'Спасибо', 'Пожалуйста'], correct: 1 },
    { text: 'Как сказать "Меня зовут..."?', options: ['Менің атым...', 'Менің жасым...', 'Мен...', 'Сенің атың...'], correct: 0 },
    { text: 'Выберите правильный перевод: "Кітап оқу"', options: ['Писать письмо', 'Смотреть кино', 'Читать книгу', 'Слушать музыку'], correct: 2 }
  ];

  currentQuestion = 0;
  score = 0;
  isFinished = false;
  recommendedLevel = '';

  answer(selectedIndex: number) {
    // Проверяем правильность ответа
    if (selectedIndex === this.questions[this.currentQuestion].correct) {
      this.score++;
    }

    // Переходим к следующему или завершаем
    if (this.currentQuestion < this.questions.length - 1) {
      this.currentQuestion++;
    } else {
      this.finishTest();
    }
  }

  finishTest() {
    this.isFinished = true;
    // Простая логика определения уровня по баллам
    if (this.score === 3) {
      this.recommendedLevel = 'b1';
    } else if (this.score === 2) {
      this.recommendedLevel = 'a2';
    } else {
      this.recommendedLevel = 'a1';
    }
  }
}
