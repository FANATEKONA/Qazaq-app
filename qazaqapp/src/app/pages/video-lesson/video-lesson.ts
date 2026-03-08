import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-video-lesson',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './video-lesson.html',
  styleUrl: './video-lesson.css'
})
export class VideoLesson implements OnInit {
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  levelId: string = 'a1';
  currentLessonId: string = '1';

  // Обновленная база с твоими ссылками
  lessonsDatabase: { [key: string]: any[] } = {
    'a1': [
      { id: '1', title: 'Урок 1: Алфавит и звуки', duration: '04:31', youtubeId: 'DImQCP-CdDU' },
      { id: '2', title: 'Урок 2: Приветствия', duration: '02:34', youtubeId: '5O5IGPbWWnQ' },
      { id: '3', title: 'Урок 3: Личные местоимения', duration: '03:38', youtubeId: 'iujAEeFLnp8' },
      { id: '4', title: 'Урок 4: Моя семья', duration: '0:46', youtubeId: 'm0tz11snjo8' },
      // Для остальных пока оставим заглушки
      { id: '5', title: 'Урок 5: Цифры и время', duration: '11:00', youtubeId: 'dQw4w9WgXcQ' },
      { id: '6', title: 'Урок 6: Дни недели', duration: '07:45', youtubeId: 'dQw4w9WgXcQ' },
      { id: '7', title: 'Урок 7: Еда и напитки', duration: '14:20', youtubeId: 'dQw4w9WgXcQ' },
      { id: '8', title: 'Урок 8: Мой город', duration: '10:50', youtubeId: 'dQw4w9WgXcQ' },
      { id: '9', title: 'Урок 9: Погода', duration: '08:40', youtubeId: 'dQw4w9WgXcQ' },
      { id: '10', title: 'Урок 10: Мое хобби', duration: '13:10', youtubeId: 'dQw4w9WgXcQ' }
    ],
    'a2': [
      { id: '1', title: 'Урок 1: Прошедшее время', duration: '11:20', youtubeId: 'dQw4w9WgXcQ' }
    ]
  };

  lessons: any[] = [];

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.levelId = (params.get('levelId') || 'a1').toLowerCase();
      this.currentLessonId = params.get('lessonId') || '1';
      this.lessons = this.lessonsDatabase[this.levelId] || this.lessonsDatabase['a1'];
    });
  }

  get currentLesson() {
    return this.lessons.find(l => l.id === this.currentLessonId) || this.lessons[0];
  }

  // Метод для безопасной вставки iframe
  getSafeUrl(videoId: string): SafeResourceUrl {
    const url = `https://www.youtube.com/embed/${videoId}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
