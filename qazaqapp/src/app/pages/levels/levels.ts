import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-levels',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './levels.html',
  styleUrl: './levels.css'
})
export class Levels {
  levelsList = [
    { id: 'a1', name: 'A1 - Beginner', desc: 'Базовые фразы и слова' },
    { id: 'a2', name: 'A2 - Elementary', desc: 'Понимание простых предложений' },
    { id: 'b1', name: 'B1 - Intermediate', desc: 'Свободное общение на бытовые темы' },
    { id: 'b2', name: 'B2 - Upper Intermediate', desc: 'Сложные тексты и беглая речь' }
  ];
}
