import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-four-skills',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './four-skills.html',
  styleUrl: './four-skills.css'
})
export class FourSkills implements OnInit {
  route = inject(ActivatedRoute);
  levelId: string = 'a1';
  skillType: string = 'reading'; // 'reading' или 'listening'

  content: any = null;

  // Переменные для аудирования
  isAudioPlaying = false;
  showTranscript = false;
  currentUtterance: SpeechSynthesisUtterance | null = null;

  // База данных текстов и аудио
  skillsDatabase: { [key: string]: any } = {
    'a1': {
      'reading': {
        title: 'Текст: Менің отбасым (Моя семья)',
        text: 'Сәлеметсіз бе! Менің атым Арман. Мен жиырма жастамын. Мен Алматыда тұрамын. Бұл менің отбасым. Менің әкем дәрігер, ал анам мұғалім. Менің кішкентай қарындасым бар. Оның аты Айгерім. Біз тату отбасымыз.',
        questions: [
          { q: '1. Арман неше жаста? (Сколько лет Арману?)', options: ['18', '20', '25'], correct: 1, selected: null },
          { q: '2. Арманның әкесі кім? (Кто папа Армана?)', options: ['Мұғалім', 'Студент', 'Дәрігер'], correct: 2, selected: null },
          { q: '3. Арманның қарындасының аты кім? (Как зовут сестренку?)', options: ['Айгерім', 'Айжан', 'Арайлым'], correct: 0, selected: null }
        ]
      },
      'listening': {
        title: 'Аудио: Күн тәртібі (Распорядок дня)',
        transcript: 'Мен таңертең сағат жетіде тұрамын. Жуынамын, таңғы ас ішемін. Сағат сегізде университетке барамын. Сабақ сағат екіде бітеді. Кешке мен кітап оқимын.',
        questions: [
          { q: '1. Ол сағат нешеде тұрады? (Во сколько он встает?)', options: ['Сағат 6:00', 'Сағат 7:00', 'Сағат 8:00'], correct: 1, selected: null },
          { q: '2. Ол сағат сегізде қайда барады? (Куда он идет в 8:00?)', options: ['Университетке', 'Жұмысқа', 'Дүкенге'], correct: 0, selected: null }
        ]
      }
    }
  };

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.levelId = (params.get('levelId') || 'a1').toLowerCase();
      this.skillType = params.get('skillType') || 'reading';
      this.loadContent();
    });
  }

  loadContent() {
    const levelData = this.skillsDatabase[this.levelId] || this.skillsDatabase['a1'];
    // Клонируем объект, чтобы при переключении сбрасывались ответы пользователя
    this.content = JSON.parse(JSON.stringify(levelData[this.skillType]));
    this.showTranscript = false;
    this.stopAudio();
  }

  // Запись ответа пользователя
  selectAnswer(qIndex: number, optIndex: number) {
    if (this.content.questions[qIndex].selected === null) {
      this.content.questions[qIndex].selected = optIndex;
    }
  }

  // Управление аудированием
  toggleTranscript() {
    this.showTranscript = !this.showTranscript;
  }

  playAudio() {
    if (this.isAudioPlaying) {
      window.speechSynthesis.pause();
      this.isAudioPlaying = false;
      return;
    }
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      this.isAudioPlaying = true;
      return;
    }

    window.speechSynthesis.cancel();
    this.currentUtterance = new SpeechSynthesisUtterance(this.content.transcript);
    this.currentUtterance.lang = 'kk-KZ';
    this.currentUtterance.rate = 0.85; // Чуть медленнее для аудирования

    this.currentUtterance.onend = () => { this.isAudioPlaying = false; };
    this.currentUtterance.onerror = () => { this.isAudioPlaying = false; };

    window.speechSynthesis.speak(this.currentUtterance);
    this.isAudioPlaying = true;
  }

  stopAudio() {
    window.speechSynthesis.cancel();
    this.isAudioPlaying = false;
  }
}
