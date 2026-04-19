import { LevelGameCollection, LevelId, LocalizedText, WordOfDayEntry } from './models/content';

const lt = (ru: string, en: string, kz: string): LocalizedText => ({ ru, en, kz });

export const wordBank: WordOfDayEntry[] = [
  {
    id: 'w-1',
    word: 'Сәлем',
    translation: lt('Привет', 'Hello', 'Сәлемдесу'),
    example: lt('Привет, мой друг!', 'Hello, my friend!', 'Сәлем, досым!'),
    tip: lt(
      'Используется как дружелюбное приветствие.',
      'Used as a friendly greeting.',
      'Достық амандасуда жиі айтылады.',
    ),
  },
  {
    id: 'w-2',
    word: 'Рақмет',
    translation: lt('Спасибо', 'Thank you', 'Алғыс'),
    example: lt('Спасибо за помощь.', 'Thank you for your help.', 'Көмегіңе рақмет.'),
    tip: lt(
      'Вежливая форма благодарности.',
      'A polite form of gratitude.',
      'Ризашылық білдіретін сыпайы сөз.',
    ),
  },
  {
    id: 'w-3',
    word: 'Отбасы',
    translation: lt('Семья', 'Family', 'Жанұя'),
    example: lt('Моя семья большая.', 'My family is big.', 'Менің отбасым үлкен.'),
    tip: lt(
      'Часто встречается в базовых диалогах.',
      'Often appears in beginner dialogues.',
      'Бастапқы диалогтарда жиі кездеседі.',
    ),
  },
  {
    id: 'w-4',
    word: 'Мектеп',
    translation: lt('Школа', 'School', 'Оқу орны'),
    example: lt('Я иду в школу.', 'I am going to school.', 'Мен мектепке барамын.'),
    tip: lt(
      'Полезно для бытовых ситуаций и маршрутов.',
      'Useful for daily situations and directions.',
      'Күнделікті жағдайлар мен бағыт сұрауда пайдалы.',
    ),
  },
  {
    id: 'w-5',
    word: 'Қала',
    translation: lt('Город', 'City', 'Шаһар'),
    example: lt('Этот город красивый.', 'This city is beautiful.', 'Бұл қала әдемі.'),
    tip: lt(
      'Подходит для тем про транспорт и адреса.',
      'Helpful for transport and address topics.',
      'Көлік пен мекенжай тақырыптарына қолайлы.',
    ),
  },
  {
    id: 'w-6',
    word: 'Дос',
    translation: lt('Друг', 'Friend', 'Жолдас'),
    example: lt('Мой друг умный.', 'My friend is smart.', 'Менің досым ақылды.'),
    tip: lt(
      'Одно из базовых слов для описания людей.',
      'One of the core words for describing people.',
      'Адамды сипаттауда жиі қолданылатын негізгі сөз.',
    ),
  },
  {
    id: 'w-7',
    word: 'Сабақ',
    translation: lt('Урок', 'Lesson', 'Дәріс'),
    example: lt('Урок начинается в девять часов.', 'The lesson starts at nine.', 'Сабақ сағат тоғызда басталады.'),
    tip: lt(
      'Важно для учебного словаря.',
      'Important for academic vocabulary.',
      'Оқу лексикасы үшін маңызды сөз.',
    ),
  },
  {
    id: 'w-8',
    word: 'Арман',
    translation: lt('Мечта', 'Dream', 'Мұрат'),
    example: lt('У меня есть мечта.', 'I have a dream.', 'Менің арманым бар.'),
    tip: lt(
      'Подходит для разговоров о целях.',
      'Useful in conversations about goals.',
      'Мақсат пен ниет туралы әңгімеде қолданылады.',
    ),
  },
  {
    id: 'w-9',
    word: 'Ертең',
    translation: lt('Завтра', 'Tomorrow', 'Келесі күн'),
    example: lt('Увидимся завтра.', 'See you tomorrow.', 'Ертең кездесеміз.'),
    tip: lt(
      'Маркер будущего времени.',
      'A marker of future time.',
      'Келер шақты білдіретін уақыт сөзі.',
    ),
  },
  {
    id: 'w-10',
    word: 'Жаңалық',
    translation: lt('Новость', 'News', 'Хабар'),
    example: lt('Это интересная новость.', 'This is interesting news.', 'Бұл қызық жаңалық екен.'),
    tip: lt(
      'Полезно на уровнях B1-B2.',
      'Useful at B1-B2 levels.',
      'B1-B2 деңгейінде жиі кездеседі.',
    ),
  },
];

export const gamesByLevel: Record<LevelId, LevelGameCollection> = {
  a1: {
    intro: 'Мини-игры A1 помогают закрепить базовые слова, короткие фразы и слуховое распознавание.',
    games: [
      {
        type: 'match-words',
        id: 'a1-match',
        title: 'Match Words: Базовые слова',
        instructions: 'Соедините казахские слова с переводом.',
        pairs: [
          { id: 'p1', kazakh: 'Сәлем', translation: lt('Привет', 'Hello', 'Сәлемдесу') },
          { id: 'p2', kazakh: 'Отбасы', translation: lt('Семья', 'Family', 'Жанұя') },
          { id: 'p3', kazakh: 'Қала', translation: lt('Город', 'City', 'Шаһар') },
          { id: 'p4', kazakh: 'Рақмет', translation: lt('Спасибо', 'Thank you', 'Алғыс') },
        ],
      },
      {
        type: 'drag-and-drop',
        id: 'a1-drag',
        title: 'Drag & Drop: Собери фразу',
        instructions: 'Расставьте слова в правильном порядке.',
        tokens: ['Менің', 'атым', 'Аружан'],
        correctOrder: ['Менің', 'атым', 'Аружан'],
      },
      {
        type: 'listening-sprint',
        id: 'a1-listening',
        title: 'Listening Sprint: Слушай и выбирай',
        instructions: 'Прослушайте фразу и быстро выберите верный перевод.',
        rounds: [
          {
            id: 'l1',
            audioText: 'Сәлеметсіз бе',
            prompt: 'Что означает эта фраза?',
            options: ['Здравствуйте', 'До свидания', 'Спасибо'],
            correct: 0,
          },
          {
            id: 'l2',
            audioText: 'Мен Алматыда тұрамын',
            prompt: 'Выберите перевод',
            options: ['Я живу в Алматы', 'Я еду в Алматы', 'Я люблю Алматы'],
            correct: 0,
          },
        ],
      },
    ],
  },
  a2: {
    intro: 'Мини-игры A2 добавляют бытовые ситуации: транспорт, покупки, планы и время.',
    games: [
      {
        type: 'match-words',
        id: 'a2-match',
        title: 'Match Words: Повседневный словарь',
        instructions: 'Найдите соответствия для слов из повседневных ситуаций.',
        pairs: [
          { id: 'p1', kazakh: 'Дүкен', translation: lt('Магазин', 'Shop', 'Сауда орны') },
          { id: 'p2', kazakh: 'Билет', translation: lt('Билет', 'Ticket', 'Жүру құжаты') },
          { id: 'p3', kazakh: 'Аялдама', translation: lt('Остановка', 'Bus stop', 'Тоқтау орны') },
          { id: 'p4', kazakh: 'Ертең', translation: lt('Завтра', 'Tomorrow', 'Келесі күн') },
        ],
      },
      {
        type: 'drag-and-drop',
        id: 'a2-drag',
        title: 'Drag & Drop: План на завтра',
        instructions: 'Соберите предложение о планах.',
        tokens: ['Мен', 'ертең', 'жұмысқа', 'барамын'],
        correctOrder: ['Мен', 'ертең', 'жұмысқа', 'барамын'],
      },
      {
        type: 'listening-sprint',
        id: 'a2-listening',
        title: 'Listening Sprint: Транспорт и покупки',
        instructions: 'Прослушайте и выберите верное значение.',
        rounds: [
          {
            id: 'l1',
            audioText: 'Маған бір билет керек',
            prompt: 'О чем говорит герой?',
            options: ['Мне нужен один билет', 'Мне нужен один друг', 'Я купил билет'],
            correct: 0,
          },
          {
            id: 'l2',
            audioText: 'Бұл қанша тұрады',
            prompt: 'Что спрашивает герой?',
            options: ['Где это?', 'Сколько это стоит?', 'Когда это начнется?'],
            correct: 1,
          },
        ],
      },
    ],
  },
  b1: {
    intro: 'Мини-игры B1 тренируют аргументацию, работу, путешествия и понимание связной речи.',
    games: [
      {
        type: 'match-words',
        id: 'b1-match',
        title: 'Match Words: Работа и проекты',
        instructions: 'Соедините слова с переводом.',
        pairs: [
          { id: 'p1', kazakh: 'Жоба', translation: lt('Проект', 'Project', 'Жоспарлы жұмыс') },
          { id: 'p2', kazakh: 'Жиналыс', translation: lt('Собрание', 'Meeting', 'Кездесу') },
          { id: 'p3', kazakh: 'Сапар', translation: lt('Поездка', 'Trip', 'Саяхат') },
          { id: 'p4', kazakh: 'Тәжірибе', translation: lt('Опыт', 'Experience', 'Іс-тәжірибе') },
        ],
      },
      {
        type: 'drag-and-drop',
        id: 'b1-drag',
        title: 'Drag & Drop: Аргумент',
        instructions: 'Соберите логичную фразу.',
        tokens: ['Менің', 'ойымша', 'бұл', 'жақсы', 'шешім'],
        correctOrder: ['Менің', 'ойымша', 'бұл', 'жақсы', 'шешім'],
      },
      {
        type: 'listening-sprint',
        id: 'b1-listening',
        title: 'Listening Sprint: Новости и встречи',
        instructions: 'Слушайте деловые и бытовые фразы на время.',
        rounds: [
          {
            id: 'l1',
            audioText: 'Бүгін жиналыс сағат үште басталады',
            prompt: 'Когда начинается собрание?',
            options: ['В три часа', 'В два часа', 'Завтра утром'],
            correct: 0,
          },
          {
            id: 'l2',
            audioText: 'Бұл сапар маған қатты ұнады',
            prompt: 'Как герой оценивает поездку?',
            options: ['Она ему не понравилась', 'Она ему очень понравилась', 'Он ее отменил'],
            correct: 1,
          },
        ],
      },
    ],
  },
  b2: {
    intro: 'Мини-игры B2 тренируют формальный стиль, публичные выступления и общественные темы.',
    games: [
      {
        type: 'match-words',
        id: 'b2-match',
        title: 'Match Words: Академическая лексика',
        instructions: 'Сопоставьте слова высокого уровня.',
        pairs: [
          { id: 'p1', kazakh: 'Өзекті', translation: lt('Актуальный', 'Relevant', 'Маңызды') },
          { id: 'p2', kazakh: 'Қоғам', translation: lt('Общество', 'Society', 'Жұртшылық') },
          { id: 'p3', kazakh: 'Ұсыныс', translation: lt('Предложение', 'Proposal', 'Пікір') },
          { id: 'p4', kazakh: 'Шешім', translation: lt('Решение', 'Decision', 'Түйін') },
        ],
      },
      {
        type: 'drag-and-drop',
        id: 'b2-drag',
        title: 'Drag & Drop: Публичное выступление',
        instructions: 'Соберите формальную фразу.',
        tokens: ['Назарларыңызға', 'қысқаша', 'баяндама', 'ұсынамын'],
        correctOrder: ['Назарларыңызға', 'қысқаша', 'баяндама', 'ұсынамын'],
      },
      {
        type: 'listening-sprint',
        id: 'b2-listening',
        title: 'Listening Sprint: Общественные темы',
        instructions: 'Прослушайте сложную мысль и выберите лучший вывод.',
        rounds: [
          {
            id: 'l1',
            audioText: 'Бұл мәселе қоғам үшін өте маңызды',
            prompt: 'Оцените смысл фразы',
            options: ['Вопрос важен для общества', 'Вопрос не имеет значения', 'Это личная проблема'],
            correct: 0,
          },
          {
            id: 'l2',
            audioText: 'Осылайша біз тиімді шешімге келе аламыз',
            prompt: 'Какой вывод делает говорящий?',
            options: ['Решение невозможно', 'Можно прийти к эффективному решению', 'Нужно остановиться'],
            correct: 1,
          },
        ],
      },
    ],
  },
};
