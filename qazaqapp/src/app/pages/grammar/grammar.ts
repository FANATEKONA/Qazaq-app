import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-grammar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './grammar.html',
  styleUrl: './grammar.css'
})
export class Grammar implements OnInit {
  private route = inject(ActivatedRoute);

  levelId: string = 'a1';
  currentTopicId: string = '1';
  isExerciseActive = false;
  userAnswer: string = '';
  isChecked = false;
  isCorrect = false;

  topics: any[] = [];

  // Объединенная база данных: содержит правила, примеры и упражнения
  grammarDatabase: { [key: string]: any[] } = {
    'a1': [
      {
        id: '1',
        title: 'Множественное число (-лар/-лер)',
        rule: 'Окончания -лар/-лер, -дар/-дер, -тар/-тер добавляются в зависимости от последнего звука слова. После гласных и р, л, й — -лар/-лер.',
        examples: [
          'Кітап (книга) + <strong>тар</strong> = Кітаптар (книги)',
          'Дәптер (тетрадь) + <strong>лер</strong> = Дәптерлер (тетради)'
        ],
        exercise: { word: 'Кітап (книги)', correct: 'тар' }
      },
      {
        id: '2',
        title: 'Притяжательные окончания',
        rule: 'Для обозначения принадлежности предмета лицу (мой, твой) используются окончания -ым/-ім, -ың/-ің. Например: менің үйім (мой дом).',
        examples: [
          'Менің қалам + <strong>ым</strong> (Моя ручка)',
          'Сенің дәптер + <strong>ің</strong> (Твоя тетрадь)'
        ],
        exercise: { word: 'Менің қалам...', correct: 'ым' }
      },
      {
        id: '3',
        title: 'Именительный падеж (Атау септік)',
        rule: 'Основная форма слова, отвечающая на вопросы Кім? (Кто?) Не? (Что?). Например: Оқушы (Ученик), Терезе (Окно).',
        examples: [
          '<strong>Оқушы</strong> келді (Ученик пришел)',
          '<strong>Терезе</strong> ашық (Окно открыто)'
        ],
        exercise: { word: '... (Кто?) келді? (Ученик)', correct: 'оқушы' }
      },
      {
        id: '4',
        title: 'Родительный падеж (Ілік септік)',
        rule: 'Указывает на принадлежность одного предмета другому. Окончания: -ның/-нің, -дың/-дің, -тың/-тің.',
        examples: [
          'Дос + <strong>ымның</strong> үйі (Дом друга)',
          'Мектеп + <strong>тің</strong> ауласы (Двор школы)'
        ],
        exercise: { word: 'Әпкем... үйі (Дом сестры)', correct: 'нің' }
      },
      {
        id: '5',
        title: 'Дательный падеж (Барыс септік)',
        rule: 'Указывает направление или цель (куда?). Окончания: -ға/-ге, -қа/-ке.',
        examples: [
          'Әжетхана + <strong>ға</strong> бару (Идти в туалет)',
          'Ауыл + <strong>ға</strong> келу (Приехать в аул)'
        ],
        exercise: { word: 'Мектеп... бару (идти в школу)', correct: 'ке' }
      },
      {
        id: '6',
        title: 'Местный падеж (Жатыс септік)',
        rule: 'Указывает на местонахождение (где?). Окончания: -да/-де, -та/-те, -нда/-нде. Например: үйде (дома), қалада (в городе).',
        examples: [
          'Үй + <strong>де</strong> отыру (Сидеть дома)',
          'Қала + <strong>да</strong> тұру (Жить в городе)'
        ],
        exercise: { word: 'Астана... тұрамын (живу в Астане)', correct: 'да' }
      },
      {
        id: '7',
        title: 'Отрицательная форма глагола',
        rule: 'Образуется с помощью суффиксов -ма/-ме, -ба/-бе, -па/-пе, которые добавляются к корню глагола.',
        examples: [
          'Ал + <strong>ма</strong> (Не бери)',
          'Кел + <strong>ме</strong> (Не приходи)'
        ],
        exercise: { word: 'Бар... (не иди)', correct: 'ма' }
      },
      {
        id: '8',
        title: 'Вопросительные частицы',
        rule: 'Частицы ма/ме, ба/бе, па/пе ставятся в конце предложения для создания общих вопросов.',
        examples: [
          'Сен студентсің <strong>бе</strong>? (Ты студент?)',
          'Бұл кітап <strong>па</strong>? (Это книга?)'
        ],
        exercise: { word: 'Бұл қалам ... ? (Это ручка?)', correct: 'ба' }
      },
      {
        id: '9',
        title: 'Личные окончания (Мен/Сен)',
        rule: 'Обозначают лицо, совершающее действие или являющееся кем-то (Я есть, Ты есть). Окончания: -мын/-мін, -сың/-сің.',
        examples: [
          'Мен оқушы + <strong>мын</strong> (Я ученик)',
          'Сен дәрігер + <strong>сің</strong> (Ты врач)'
        ],
        exercise: { word: 'Мен дәрігер... (Я врач)', correct: 'мін' }
      },
      {
        id: '10',
        title: 'Числительные',
        rule: 'Сан есім. Один — бір, два — екі, три — үш. Используются для счета предметов без окончаний множественного числа.',
        examples: [
          '<strong>Бір</strong> кітап (Одна книга)',
          '<strong>Екі</strong> бала (Двое детей)'
        ],
        exercise: { word: '5 (напишите словом)', correct: 'бес' }
      }
    ],
    'a2': [
      {
        id: '1',
        title: 'Прошедшее время',
        rule: 'Обозначает законченное действие. Окончания: -ды/-ді, -ты/-ті.',
        examples: [
          'Ол кел + <strong>ді</strong> (Он пришел)',
          'Мен жаз + <strong>дым</strong> (Я написал)'
        ],
        exercise: { word: 'Ол кет.. (Он ушел)', correct: 'ті' }
      }
    ]
  };

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.levelId = (params.get('levelId') || 'a1').toLowerCase();
      this.currentTopicId = params.get('topicId') || '1';
      this.topics = this.grammarDatabase[this.levelId] || this.grammarDatabase['a1'];

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

  checkAnswer() {
    if (!this.userAnswer.trim()) return;

    const correctAnswer = this.currentTopic.exercise?.correct.toLowerCase();

    if (this.userAnswer.trim().toLowerCase() === correctAnswer) {
      this.isCorrect = true;
    } else {
      this.isCorrect = false;
    }

    this.isChecked = true;
  }
}
