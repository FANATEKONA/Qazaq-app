import { Component, OnInit, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-shadowing',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './shadowing.html',
  styleUrl: './shadowing.css'
})
export class Shadowing implements OnInit {
  route = inject(ActivatedRoute);
  zone = inject(NgZone);
  cdr = inject(ChangeDetectorRef); // Инструмент для принудительного обновления HTML

  levelId: string = 'a1';
  currentTaskId: string = '1';

  isRecording = false;
  recognizedText = '';
  isMatch = false;

  isAudioPlaying = false;
  currentUtterance: SpeechSynthesisUtterance | null = null;
  recognition: any;

  shadowingDatabase: { [key: string]: any[] } = {
    'a1': [
      { id: '1', title: 'Приветствие', kazakh: 'Сәлеметсіз бе', russian: 'Здравствуйте', audioLength: '0:03' },
      { id: '2', title: 'Как дела?', kazakh: 'Қалыңыз қалай', russian: 'Как ваши дела', audioLength: '0:04' },
      { id: '3', title: 'Знакомство', kazakh: 'Танысқанымызға қуаныштымын', russian: 'Рад(а) знакомству', audioLength: '0:05' },
      { id: '4', title: 'Прощание', kazakh: 'Сау болыңыз', russian: 'До свидания', audioLength: '0:03' },
      { id: '5', title: 'Семья', kazakh: 'Бұл менің отбасым', russian: 'Это моя семья', audioLength: '0:04' }
    ],
    'a2': [
      { id: '1', title: 'В магазине', kazakh: 'Бұл қанша тұрады', russian: 'Сколько это стоит', audioLength: '0:04' }
    ]
  };

  tasks: any[] = [];

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.levelId = (params.get('levelId') || 'a1').toLowerCase();
      this.currentTaskId = params.get('taskId') || '1';
      this.tasks = this.shadowingDatabase[this.levelId] || this.shadowingDatabase['a1'];
      this.resetRecording();
    });
    this.initSpeechRecognition();
  }

  get currentTask() {
    return this.tasks.find(t => t.id === this.currentTaskId) || this.tasks[0];
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
    const utterance = new SpeechSynthesisUtterance(this.currentTask.kazakh);
    utterance.lang = 'kk-KZ';
    utterance.rate = 0.9;

    // Функция для поиска и установки казахского голоса
    const setKzVoice = () => {
      const voices = window.speechSynthesis.getVoices();

      // Выводим все доступные голоса в консоль (F12), чтобы ты увидел, что нашел браузер
      console.log('Доступные голоса:', voices.map(v => `${v.name} (${v.lang})`));

      // Ищем сначала "натуральные" голоса Microsoft (лучшее качество в Edge)
      let kzVoice = voices.find(v => v.name.includes('Aigul') || v.name.includes('Daulet'));

      // Если их нет, ищем любой с кодом 'kk'
      if (!kzVoice) {
        kzVoice = voices.find(v => v.lang.toLowerCase().includes('kk'));
      }

      if (kzVoice) {
        utterance.voice = kzVoice;
        console.log('Выбран казахский голос:', kzVoice.name);
      } else {
        console.warn('Казахский голос не найден. Попробуйте установить пакет в настройках Windows или использовать Edge Online.');
      }

      utterance.onend = () => {
        this.zone.run(() => { this.isAudioPlaying = false; this.cdr.detectChanges(); });
      };

      window.speechSynthesis.speak(utterance);
      this.isAudioPlaying = true;
      this.cdr.detectChanges();
    };

    // Если голоса еще не загрузились, подписываемся на событие их загрузки
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => setKzVoice();
    } else {
      setKzVoice();
    }
  }
  initSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'kk-KZ';
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event: any) => {
        this.zone.run(() => {
          this.recognizedText = event.results[0][0].transcript;
          console.log('Услышано:', this.recognizedText);
          this.checkPronunciation();
          this.cdr.detectChanges(); // Жестко перерисовываем UI
        });
      };

      this.recognition.onend = () => {
        this.zone.run(() => {
          this.isRecording = false;
          this.cdr.detectChanges();
        });
      };

      this.recognition.onerror = (event: any) => {
        this.zone.run(() => {
          this.isRecording = false;
          this.cdr.detectChanges();
        });
      };
    } else {
      console.warn('Ваш браузер не поддерживает Web Speech API.');
    }
  }

  toggleRecording() {
    if (!this.recognition) return;

    if (this.isRecording) {
      this.isRecording = false;
      this.recognition.stop();
    } else {
      this.resetRecording();
      this.isRecording = true;
      try {
        this.recognition.start();
      } catch (e) {
        this.isRecording = false;
      }
    }
  }

  checkPronunciation() {
    // Убираем знаки препинания для более точного сравнения
    const cleanOriginal = this.currentTask.kazakh.toLowerCase().replace(/[.,!?]/g, '').trim();
    const cleanRecognized = this.recognizedText.toLowerCase().replace(/[.,!?]/g, '').trim();
    this.isMatch = cleanOriginal === cleanRecognized || cleanRecognized.includes(cleanOriginal);
  }

  resetRecording() {
    this.isRecording = false;
    this.recognizedText = '';
    this.isMatch = false;
    window.speechSynthesis.cancel();
    this.isAudioPlaying = false;
  }
}
