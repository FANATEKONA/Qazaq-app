import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-module-test',
  standalone: true,
  imports: [RouterLink,UpperCasePipe],
  templateUrl: './module-test.html',
  styleUrl: './module-test.css'
})
export class ModuleTest implements OnInit {
  route = inject(ActivatedRoute);
  levelId: string = 'a1';

  currentStep = 0;
  score = 0;
  isFinished = false;

  // Итоговый тест уровня A1
  testQuestions = [
    { q: 'Как правильно сказать "У меня есть книга"?', options: ['Менде кітап бар', 'Менің кітап бар', 'Мен кітап бар'], correct: 0 },
    { q: 'Множественное число слова "Қала" (Город):', options: ['Қалалер', 'Қалалар', 'Қаладар'], correct: 1 },
    { q: 'Перевод фразы "Мен студентпін":', options: ['Я учитель', 'Я врач', 'Я студент'], correct: 2 },
    { q: 'Выберите правильное окончание: Мен Алматыда тұра...', options: ['-мын', '-сың', '-мыз'], correct: 0 },
    { q: 'Как спросить "Который час?"', options: ['Қалың қалай?', 'Сағат қанша?', 'Атың кім?'], correct: 1 }
  ];

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.levelId = (params.get('levelId') || 'a1').toLowerCase();
    });
  }

  answer(index: number) {
    if (index === this.testQuestions[this.currentStep].correct) {
      this.score++;
    }

    if (this.currentStep < this.testQuestions.length - 1) {
      this.currentStep++;
    } else {
      this.isFinished = true;
    }
  }

  get progressWidth() {
    return ((this.currentStep + (this.isFinished ? 1 : 0)) / this.testQuestions.length) * 100;
  }
}
