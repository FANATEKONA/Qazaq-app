import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-level-dashboard',
  standalone: true,
  imports: [RouterLink, UpperCasePipe],
  templateUrl: './level-dashboard.html',
  styleUrl: './level-dashboard.css'
})
export class LevelDashboard implements OnInit {
  route = inject(ActivatedRoute);
  levelId: string = 'a1';

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.levelId = params.get('levelId') || 'a1';
      console.log('Пойманный ID из URL:', this.levelId); // Выведет в консоль браузера
    });
  }
}
