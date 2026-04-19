import { AppLanguage, GrammarTopic, LevelId, ShadowingTask, SkillQuestion, SkillType } from './models/content';

type Copy = Record<AppLanguage, string>;

interface GrammarLocalization {
  title: Copy;
  rule: Copy;
  examples: Copy[];
  exercisePrompt: Copy;
}

interface ShadowingLocalization {
  title: Copy;
  meaning: Copy;
}

interface SkillQuestionLocalization {
  q: Copy;
  options: Copy[];
}

interface SkillLessonLocalization {
  title: Copy;
  questions: Record<string, SkillQuestionLocalization>;
}

const grammarBank: Record<LevelId, Record<string, GrammarLocalization>> = {
  a1: {
    '1': {
      title: { ru: 'Множественное число', en: 'Plural forms', kz: 'Көпше түр' },
      rule: {
        ru: 'Окончания -лар/-лер, -дар/-дер, -тар/-тер выбираются по закону сингармонизма и по последнему звуку слова.',
        en: 'The endings -лар/-лер, -дар/-дер and -тар/-тер are chosen by vowel harmony and the final sound of the word.',
        kz: '-лар/-лер, -дар/-дер, -тар/-тер жалғаулары сөздің соңғы дыбысына және үндестік заңына қарай жалғанады.',
      },
      examples: [
        { ru: 'Кітап + тар = кітаптар', en: 'Кітап + тар = кітаптар', kz: 'Кітап + тар = кітаптар' },
        { ru: 'Дәптер + лер = дәптерлер', en: 'Дәптер + лер = дәптерлер', kz: 'Дәптер + лер = дәптерлер' },
      ],
      exercisePrompt: {
        ru: 'Поставьте слово "кітап" во множественное число. Какое окончание нужно?',
        en: 'Put "кітап" into the plural. Which ending is needed?',
        kz: '"кітап" сөзін көпше түрге қойыңыз. Қай жалғау керек?',
      },
    },
    '2': {
      title: { ru: 'Притяжательные окончания', en: 'Possessive endings', kz: 'Тәуелдік жалғаулары' },
      rule: {
        ru: 'Чтобы показать принадлежность, используются окончания -ым/-ім, -ың/-ің, -ы/-і.',
        en: 'To show possession, Kazakh uses endings such as -ым/-ім, -ың/-ің and -ы/-і.',
        kz: 'Меншік мағынасын беру үшін -ым/-ім, -ың/-ің, -ы/-і сияқты тәуелдік жалғаулары қолданылады.',
      },
      examples: [
        { ru: 'Менің қаламым', en: 'Менің қаламым', kz: 'Менің қаламым' },
        { ru: 'Сенің дәптерің', en: 'Сенің дәптерің', kz: 'Сенің дәптерің' },
      ],
      exercisePrompt: {
        ru: 'Дополните форму "Менің қалам...". Какое окончание подходит?',
        en: 'Complete the form "Менің қалам...". Which ending fits?',
        kz: '"Менің қалам..." тіркесін толықтырыңыз. Қай жалғау керек?',
      },
    },
    '3': {
      title: { ru: 'Именительный падеж', en: 'Nominative case', kz: 'Атау септік' },
      rule: {
        ru: 'Это базовая форма слова, которая отвечает на вопросы "кто?" и "что?".',
        en: 'This is the basic dictionary form of the word answering the questions "who?" and "what?".',
        kz: 'Бұл сөздің негізгі түрі, ол "кім?" және "не?" сұрақтарына жауап береді.',
      },
      examples: [
        { ru: 'Оқушы келді', en: 'Оқушы келді', kz: 'Оқушы келді' },
        { ru: 'Терезе ашық', en: 'Терезе ашық', kz: 'Терезе ашық' },
      ],
      exercisePrompt: {
        ru: 'Кто пришел? Впишите слово "ученик" по-казахски.',
        en: 'Who came? Write the word "student" in Kazakh.',
        kz: 'Кім келді? "Оқушы" сөзін жазыңыз.',
      },
    },
    '4': {
      title: { ru: 'Дательный падеж', en: 'Dative case', kz: 'Барыс септік' },
      rule: {
        ru: 'Дательный падеж показывает направление или цель и оформляется с помощью -ға/-ге, -қа/-ке.',
        en: 'The dative case shows direction or destination and uses endings like -ға/-ге and -қа/-ке.',
        kz: 'Барыс септік бағытты не мақсатты білдіреді және -ға/-ге, -қа/-ке жалғаулары арқылы жасалады.',
      },
      examples: [
        { ru: 'Мектепке бару', en: 'Мектепке бару', kz: 'Мектепке бару' },
        { ru: 'Ауылға келу', en: 'Ауылға келу', kz: 'Ауылға келу' },
      ],
      exercisePrompt: {
        ru: 'Дополните форму направления: "Мектеп... бару".',
        en: 'Complete the directional form: "Мектеп... бару".',
        kz: 'Бағыт формасын толықтырыңыз: "Мектеп... бару".',
      },
    },
    '5': {
      title: { ru: 'Вопросительные частицы', en: 'Question particles', kz: 'Сұраулық шылаулар' },
      rule: {
        ru: 'Частицы ма/ме, ба/бе, па/пе ставятся в конце предложения, чтобы задать общий вопрос.',
        en: 'Particles such as ма/ме, ба/бе and па/пе are placed at the end of a sentence to form a yes-no question.',
        kz: 'Ма/ме, ба/бе, па/пе шылаулары жалпы сұрақ жасау үшін сөйлемнің соңына қойылады.',
      },
      examples: [
        { ru: 'Бұл кітап па?', en: 'Бұл кітап па?', kz: 'Бұл кітап па?' },
        { ru: 'Сен студентсің бе?', en: 'Сен студентсің бе?', kz: 'Сен студентсің бе?' },
      ],
      exercisePrompt: {
        ru: 'Сделайте вопрос из фразы "Бұл қалам ... ?".',
        en: 'Turn the phrase "Бұл қалам ... ?" into a question.',
        kz: '"Бұл қалам ... ?" тіркесін сұраққа айналдырыңыз.',
      },
    },
  },
  a2: {
    '1': {
      title: { ru: 'Прошедшее время', en: 'Past tense', kz: 'Өткен шақ' },
      rule: {
        ru: 'Для прошедшего времени используются окончания -ды/-ді, -ты/-ті и личные окончания.',
        en: 'Kazakh forms the past tense with endings like -ды/-ді and -ты/-ті plus personal endings.',
        kz: 'Өткен шақ -ды/-ді, -ты/-ті жалғаулары және жіктік жалғаулар арқылы жасалады.',
      },
      examples: [
        { ru: 'Ол келді', en: 'Ол келді', kz: 'Ол келді' },
        { ru: 'Мен жаздым', en: 'Мен жаздым', kz: 'Мен жаздым' },
      ],
      exercisePrompt: {
        ru: 'Поставьте глагол "кет" в прошедшее время для "он ушел".',
        en: 'Put "кет" into the past tense for "he left".',
        kz: '"Ол кетті" формасы үшін тиісті жалғауды жазыңыз.',
      },
    },
    '2': {
      title: { ru: 'Местный падеж', en: 'Locative case', kz: 'Жатыс септік' },
      rule: {
        ru: 'Местный падеж показывает местонахождение и использует -да/-де, -та/-те, -нда/-нде.',
        en: 'The locative case shows location and uses endings like -да/-де, -та/-те and -нда/-нде.',
        kz: 'Жатыс септік мекенді білдіреді және -да/-де, -та/-те, -нда/-нде жалғаулары арқылы жасалады.',
      },
      examples: [
        { ru: 'Үйде отырмын', en: 'Үйде отырмын', kz: 'Үйде отырмын' },
        { ru: 'Қалада тұрамын', en: 'Қалада тұрамын', kz: 'Қалада тұрамын' },
      ],
      exercisePrompt: {
        ru: 'Дополните фразу "Астана... тұрамын".',
        en: 'Complete the phrase "Астана... тұрамын".',
        kz: '"Астана... тұрамын" тіркесін толықтырыңыз.',
      },
    },
    '3': {
      title: { ru: 'Отрицательная форма глагола', en: 'Negative verb form', kz: 'Етістіктің болымсыз түрі' },
      rule: {
        ru: 'Отрицание образуется с помощью -ма/-ме, -ба/-бе, -па/-пе.',
        en: 'Negative verb forms are built with -ма/-ме, -ба/-бе and -па/-пе.',
        kz: 'Болымсыз етістік -ма/-ме, -ба/-бе, -па/-пе жұрнақтары арқылы жасалады.',
      },
      examples: [
        { ru: 'Барма', en: 'Барма', kz: 'Барма' },
        { ru: 'Келме', en: 'Келме', kz: 'Келме' },
      ],
      exercisePrompt: {
        ru: 'Сделайте отрицательную форму от "Оқы...".',
        en: 'Build the negative form from "Оқы...".',
        kz: '"Оқы..." формасын болымсыз түрге айналдырыңыз.',
      },
    },
    '4': {
      title: { ru: 'Сравнение', en: 'Comparison', kz: 'Салыстыру' },
      rule: {
        ru: 'Для сравнения часто используются формы с -рақ/-рек и слова көбірек, азырақ.',
        en: 'Comparison often uses endings like -рақ/-рек and words such as көбірек or азырақ.',
        kz: 'Салыстыру үшін -рақ/-рек формалары және көбірек, азырақ сияқты сөздер жиі қолданылады.',
      },
      examples: [
        { ru: 'Бұл кітап қызығырақ', en: 'Бұл кітап қызығырақ', kz: 'Бұл кітап қызығырақ' },
        { ru: 'Мен көбірек оқимын', en: 'Мен көбірек оқимын', kz: 'Мен көбірек оқимын' },
      ],
      exercisePrompt: {
        ru: 'Сделайте сравнительную форму: "Бұл фильм ұзын...".',
        en: 'Make the comparative form: "Бұл фильм ұзын...".',
        kz: 'Салыстырмалы форманы жазыңыз: "Бұл фильм ұзын...".',
      },
    },
    '5': {
      title: { ru: 'Будущее намерение', en: 'Future intention', kz: 'Болашақ ниет' },
      rule: {
        ru: 'Конструкция с -мақ/-мек и личными окончаниями помогает выразить намерение.',
        en: 'The pattern with -мақ/-мек and personal endings helps express intention.',
        kz: '-мақ/-мек және жіктік жалғаулар ниет мағынасын білдіруге көмектеседі.',
      },
      examples: [
        { ru: 'Мен бармақпын', en: 'Мен бармақпын', kz: 'Мен бармақпын' },
        { ru: 'Біз оқымақпыз', en: 'Біз оқымақпыз', kz: 'Біз оқымақпыз' },
      ],
      exercisePrompt: {
        ru: 'Дополните форму намерения: "Мен ертең кел...пын".',
        en: 'Complete the intention form: "Мен ертең кел...пын".',
        kz: 'Ниет формасын толықтырыңыз: "Мен ертең кел...пын".',
      },
    },
  },
  b1: {
    '1': {
      title: { ru: 'Условная форма', en: 'Conditional form', kz: 'Шартты рай' },
      rule: {
        ru: 'Условие образуется с помощью -са/-се: барса, келсе.',
        en: 'The conditional is formed with -са/-се, for example барса or келсе.',
        kz: 'Шартты рай -са/-се арқылы жасалады: барса, келсе.',
      },
      examples: [
        { ru: 'Уақытым болса, барамын', en: 'Уақытым болса, барамын', kz: 'Уақытым болса, барамын' },
        { ru: 'Ол келсе, сөйлесеміз', en: 'Ол келсе, сөйлесеміз', kz: 'Ол келсе, сөйлесеміз' },
      ],
      exercisePrompt: {
        ru: 'Дополните условную форму: "Егер ол кел... , біз бастаймыз".',
        en: 'Complete the conditional form: "Егер ол кел... , біз бастаймыз".',
        kz: 'Шартты форманы толықтырыңыз: "Егер ол кел... , біз бастаймыз".',
      },
    },
    '2': {
      title: { ru: 'Причастные формы', en: 'Participial forms', kz: 'Есімше формалары' },
      rule: {
        ru: 'Формы на -ған/-ген, -атын/-етін описывают признак через действие.',
        en: 'Forms such as -ған/-ген and -атын/-етін describe a noun through an action.',
        kz: '-ған/-ген, -атын/-етін формалары қимыл арқылы заттың белгісін сипаттайды.',
      },
      examples: [
        { ru: 'Оқыған кітап', en: 'Оқыған кітап', kz: 'Оқыған кітап' },
        { ru: 'Келетін қонақ', en: 'Келетін қонақ', kz: 'Келетін қонақ' },
      ],
      exercisePrompt: {
        ru: 'Впишите форму для "прочитанная книга".',
        en: 'Write the form for "a read book".',
        kz: '"Оқылған кітап" мағынасына сай форманы жазыңыз.',
      },
    },
    '3': {
      title: { ru: 'Сложные союзы', en: 'Complex connectors', kz: 'Күрделі жалғаулықтар' },
      rule: {
        ru: 'Связная речь строится с помощью союзов типа "если", "потому что", "однако".',
        en: 'Connected speech uses linkers such as "if", "because" and "however".',
        kz: 'Байланысты сөйлеуде "егер", "себебі", "алайда" сияқты жалғаулықтар қолданылады.',
      },
      examples: [
        { ru: 'Себебі уақыт жоқ', en: 'Себебі уақыт жоқ', kz: 'Себебі уақыт жоқ' },
        { ru: 'Бірақ мен барамын', en: 'Бірақ мен барамын', kz: 'Бірақ мен барамын' },
      ],
      exercisePrompt: {
        ru: 'Дополните связь причины: "Мен келмедім, ... ауырдым".',
        en: 'Complete the cause connector: "Мен келмедім, ... ауырдым".',
        kz: 'Себепті білдіретін сөзді қойыңыз: "Мен келмедім, ... ауырдым".',
      },
    },
    '4': {
      title: { ru: 'Косвенная речь', en: 'Reported speech', kz: 'Төл сөзді жеткізу' },
      rule: {
        ru: 'Чужие слова часто передаются через конструкцию "деп" и похожие модели.',
        en: 'Reported speech often uses the particle "деп" and related structures.',
        kz: 'Бөгде сөзді жеткізу үшін "деп" және соған ұқсас құрылымдар жиі қолданылады.',
      },
      examples: [
        { ru: 'Ол келеді деп ойлаймын', en: 'Ол келеді деп ойлаймын', kz: 'Ол келеді деп ойлаймын' },
        { ru: 'Мен солай деді деп естідім', en: 'Мен солай деді деп естідім', kz: 'Мен солай деді деп естідім' },
      ],
      exercisePrompt: {
        ru: 'Дополните фразу: "Ол барады ... ойлаймын".',
        en: 'Complete the phrase: "Ол барады ... ойлаймын".',
        kz: 'Тіркесті толықтырыңыз: "Ол барады ... ойлаймын".',
      },
    },
    '5': {
      title: { ru: 'Причина и следствие', en: 'Cause and effect', kz: 'Себеп пен салдар' },
      rule: {
        ru: 'Связь причины и результата часто выражается словами "сондықтан" и "сол үшін".',
        en: 'Cause and result are often linked with words like "сондықтан" and "сол үшін".',
        kz: 'Себеп пен нәтижені байланыстыру үшін "сондықтан", "сол үшін" сияқты сөздер қолданылады.',
      },
      examples: [
        { ru: 'Жаңбыр жауды, сондықтан үйде қалдым', en: 'Жаңбыр жауды, сондықтан үйде қалдым', kz: 'Жаңбыр жауды, сондықтан үйде қалдым' },
        { ru: 'Уақыт аз, сол үшін асығамыз', en: 'Уақыт аз, сол үшін асығамыз', kz: 'Уақыт аз, сол үшін асығамыз' },
      ],
      exercisePrompt: {
        ru: 'Дополните связку результата: "Кеш қалдым, ... такси шақырдым".',
        en: 'Complete the result connector: "Кеш қалдым, ... такси шақырдым".',
        kz: 'Нәтижені білдіретін сөзді қойыңыз: "Кеш қалдым, ... такси шақырдым".',
      },
    },
  },
  b2: {
    '1': {
      title: { ru: 'Сложноподчиненные конструкции', en: 'Complex sentence structures', kz: 'Сабақтас құрмалас құрылымдар' },
      rule: {
        ru: 'На уровне B2 важно уверенно использовать вложенные конструкции и логические связки.',
        en: 'At B2 it is important to handle embedded structures and logical linkers confidently.',
        kz: 'B2 деңгейінде күрделі құрылымдар мен логикалық байланыстарды еркін қолдану маңызды.',
      },
      examples: [
        { ru: 'Менің ойымша, егер уақыт болса, жобаны аяқтаймыз', en: 'Менің ойымша, егер уақыт болса, жобаны аяқтаймыз', kz: 'Менің ойымша, егер уақыт болса, жобаны аяқтаймыз' },
        { ru: 'Ол айтқан пікірмен толық келісемін', en: 'Ол айтқан пікірмен толық келісемін', kz: 'Ол айтқан пікірмен толық келісемін' },
      ],
      exercisePrompt: {
        ru: 'Дополните условную часть: "Егер мүмкіндік ... , біз бастаймыз".',
        en: 'Complete the conditional part: "Егер мүмкіндік ... , біз бастаймыз".',
        kz: 'Шарт бөлігін толықтырыңыз: "Егер мүмкіндік ... , біз бастаймыз".',
      },
    },
    '2': {
      title: { ru: 'Официальный стиль', en: 'Formal style', kz: 'Ресми стиль' },
      rule: {
        ru: 'Для официальной речи используются более нейтральные и формальные конструкции.',
        en: 'Formal speech relies on neutral and official constructions.',
        kz: 'Ресми сөйлеуде бейтарап әрі ресми құрылымдар қолданылады.',
      },
      examples: [
        { ru: 'Хабарлағым келеді', en: 'Хабарлағым келеді', kz: 'Хабарлағым келеді' },
        { ru: 'Назарларыңызға ұсынамын', en: 'Назарларыңызға ұсынамын', kz: 'Назарларыңызға ұсынамын' },
      ],
      exercisePrompt: {
        ru: 'Дополните официальную форму: "Сізге хабарла... келеді".',
        en: 'Complete the formal phrase: "Сізге хабарла... келеді".',
        kz: 'Ресми форманы толықтырыңыз: "Сізге хабарла... келеді".',
      },
    },
    '3': {
      title: { ru: 'Оттенки модальности', en: 'Modal shades', kz: 'Модаль реңктер' },
      rule: {
        ru: 'Модальные слова помогают выражать уверенность, сомнение и необходимость.',
        en: 'Modal words help express certainty, doubt and necessity.',
        kz: 'Модаль сөздер сенімділік, күмән және қажеттілікті білдіруге көмектеседі.',
      },
      examples: [
        { ru: 'Мүмкін', en: 'Мүмкін', kz: 'Мүмкін' },
        { ru: 'Әрине', en: 'Әрине', kz: 'Әрине' },
        { ru: 'Қажет', en: 'Қажет', kz: 'Қажет' },
      ],
      exercisePrompt: {
        ru: 'Дополните фразу необходимости: "Бұл мәселені шешу ...".',
        en: 'Complete the necessity phrase: "Бұл мәселені шешу ...".',
        kz: 'Қажеттілік формасын толықтырыңыз: "Бұл мәселені шешу ...".',
      },
    },
    '4': {
      title: { ru: 'Стилистические замены', en: 'Stylistic substitutions', kz: 'Стильдік алмастырулар' },
      rule: {
        ru: 'На высоком уровне полезно заменять повторяющиеся слова синонимами и перефразом.',
        en: 'At an advanced level it is useful to replace repeated words with synonyms and paraphrases.',
        kz: 'Жоғары деңгейде қайталанатын сөздерді синонимдермен және перифразбен алмастырған пайдалы.',
      },
      examples: [
        { ru: 'Маңызды - өзекті', en: 'Маңызды - өзекті', kz: 'Маңызды - өзекті' },
        { ru: 'Айту - жеткізу', en: 'Айту - жеткізу', kz: 'Айту - жеткізу' },
      ],
      exercisePrompt: {
        ru: 'Подберите замену к слову "маңызды".',
        en: 'Choose a substitute for the word "маңызды".',
        kz: '"Маңызды" сөзіне балама жазыңыз.',
      },
    },
    '5': {
      title: { ru: 'Связность текста', en: 'Text cohesion', kz: 'Мәтіннің байланысы' },
      rule: {
        ru: 'Связки вроде "во-первых", "кроме того", "таким образом" делают речь последовательной.',
        en: 'Linkers such as "firstly", "besides" and "thus" make speech coherent.',
        kz: '"Біріншіден", "сонымен қатар", "осылайша" сияқты байланыстырғыштар мәтінді жүйелі етеді.',
      },
      examples: [
        { ru: 'Біріншіден', en: 'Біріншіден', kz: 'Біріншіден' },
        { ru: 'Сонымен қатар', en: 'Сонымен қатар', kz: 'Сонымен қатар' },
        { ru: 'Осылайша', en: 'Осылайша', kz: 'Осылайша' },
      ],
      exercisePrompt: {
        ru: 'Выберите связку для начала перечисления.',
        en: 'Choose the linker that starts a sequence of points.',
        kz: 'Тізбектеуді бастайтын байланыстырушыны таңдаңыз.',
      },
    },
  },
};

const shadowingBank: Record<LevelId, Record<string, ShadowingLocalization>> = {
  a1: {
    '1': {
      title: { ru: 'Приветствие', en: 'Greeting', kz: 'Амандасу' },
      meaning: { ru: 'Вежливое приветствие.', en: 'A polite greeting.', kz: 'Сыпайы амандасу формасы.' },
    },
    '2': {
      title: { ru: 'Как дела?', en: 'How are you?', kz: 'Қал-жағдай сұрау' },
      meaning: { ru: 'Вежливый вопрос о самочувствии.', en: 'A polite question about someone’s well-being.', kz: 'Хал-жағдайды сыпайы сұрау.' },
    },
    '3': {
      title: { ru: 'Знакомство', en: 'Meeting someone', kz: 'Танысу' },
      meaning: { ru: 'Фраза для знакомства.', en: 'A phrase used when meeting someone.', kz: 'Танысқанда айтылатын сөйлем.' },
    },
    '4': {
      title: { ru: 'Прощание', en: 'Goodbye', kz: 'Қоштасу' },
      meaning: { ru: 'Вежливое прощание.', en: 'A polite goodbye.', kz: 'Сыпайы қоштасу формасы.' },
    },
    '5': {
      title: { ru: 'Семья', en: 'Family', kz: 'Отбасы' },
      meaning: { ru: 'Представление своей семьи.', en: 'Introducing your family.', kz: 'Өз отбасыңызды таныстыру.' },
    },
  },
  a2: {
    '1': {
      title: { ru: 'В магазине', en: 'In a shop', kz: 'Дүкенде' },
      meaning: { ru: 'Вопрос о цене товара.', en: 'Asking about the price of an item.', kz: 'Заттың бағасын сұрау.' },
    },
    '2': {
      title: { ru: 'Мне нужен билет', en: 'I need a ticket', kz: 'Маған билет керек' },
      meaning: { ru: 'Просьба о покупке билета.', en: 'A request to buy a ticket.', kz: 'Билет сұрау формасы.' },
    },
    '3': {
      title: { ru: 'Где остановка?', en: 'Where is the stop?', kz: 'Аялдама қайда?' },
      meaning: { ru: 'Вопрос о местоположении остановки.', en: 'Asking where the bus stop is.', kz: 'Аялдаманың орнын сұрау.' },
    },
    '4': {
      title: { ru: 'Мне холодно', en: 'I feel cold', kz: 'Маған суық' },
      meaning: { ru: 'Описание самочувствия.', en: 'Describing how you feel.', kz: 'Өз жағдайыңызды айту.' },
    },
    '5': {
      title: { ru: 'Я уже поел', en: 'I have already eaten', kz: 'Мен тамақ ішіп қойдым' },
      meaning: { ru: 'Сообщение о завершенном действии.', en: 'Reporting a completed action.', kz: 'Аяқталған әрекетті айту.' },
    },
  },
  b1: {
    '1': {
      title: { ru: 'Я думаю, что...', en: 'I think that...', kz: 'Менің ойымша...' },
      meaning: { ru: 'Выражение собственного мнения.', en: 'Expressing your opinion.', kz: 'Өз пікіріңізді білдіру.' },
    },
    '2': {
      title: { ru: 'Рабочая встреча', en: 'Work meeting', kz: 'Жұмыс кездесуі' },
      meaning: { ru: 'Сообщение о времени встречи.', en: 'Announcing the time of a meeting.', kz: 'Кездесу уақытын хабарлау.' },
    },
    '3': {
      title: { ru: 'Путешествие', en: 'Travel', kz: 'Сапар' },
      meaning: { ru: 'Разговор о планируемой поездке.', en: 'Talking about an upcoming trip.', kz: 'Жоспарланған сапар туралы айту.' },
    },
    '4': {
      title: { ru: 'План на вечер', en: 'Evening plan', kz: 'Кешкі жоспар' },
      meaning: { ru: 'План о встрече вечером.', en: 'A plan to meet in the evening.', kz: 'Кешке болатын жоспарды айту.' },
    },
    '5': {
      title: { ru: 'Новость', en: 'News', kz: 'Жаңалық' },
      meaning: { ru: 'Сообщение о прочитанной новости.', en: 'Talking about a piece of news you read.', kz: 'Оқыған жаңалық туралы айту.' },
    },
  },
  b2: {
    '1': {
      title: { ru: 'Мнение', en: 'Opinion', kz: 'Пікір' },
      meaning: { ru: 'Оценка общественной значимости вопроса.', en: 'Evaluating the social importance of an issue.', kz: 'Мәселенің қоғамдық маңызын бағалау.' },
    },
    '2': {
      title: { ru: 'Аргумент', en: 'Argument', kz: 'Дәлел' },
      meaning: { ru: 'Поддержка предложения несколькими причинами.', en: 'Supporting an idea with several reasons.', kz: 'Ұсынысты бірнеше себеппен қолдау.' },
    },
    '3': {
      title: { ru: 'Выступление', en: 'Presentation', kz: 'Баяндама' },
      meaning: { ru: 'Начало формального выступления.', en: 'Opening a formal presentation.', kz: 'Ресми баяндаманы бастау.' },
    },
    '4': {
      title: { ru: 'Интервью', en: 'Interview', kz: 'Сұхбат' },
      meaning: { ru: 'Описание профессионального опыта.', en: 'Describing professional experience.', kz: 'Кәсіби тәжірибенің әсерін сипаттау.' },
    },
    '5': {
      title: { ru: 'Вывод', en: 'Conclusion', kz: 'Қорытынды' },
      meaning: { ru: 'Подведение итога и вывод решения.', en: 'Summing up and leading to a conclusion.', kz: 'Қорытынды жасап, шешімге келу.' },
    },
  },
};

const skillBank: Record<LevelId, Record<SkillType, SkillLessonLocalization>> = {
  a1: {
    reading: {
      title: { ru: 'Текст: Моя семья', en: 'Reading: My family', kz: 'Мәтін: Менің отбасым' },
      questions: {
        'a1-r-1': {
          q: { ru: 'Сколько лет Арману?', en: 'How old is Arman?', kz: 'Арман неше жаста?' },
          options: [{ ru: '18', en: '18', kz: '18' }, { ru: '20', en: '20', kz: '20' }, { ru: '25', en: '25', kz: '25' }],
        },
        'a1-r-2': {
          q: { ru: 'Кто отец Армана?', en: 'Who is Arman’s father?', kz: 'Арманның әкесі кім?' },
          options: [
            { ru: 'Учитель', en: 'Teacher', kz: 'Мұғалім' },
            { ru: 'Студент', en: 'Student', kz: 'Студент' },
            { ru: 'Врач', en: 'Doctor', kz: 'Дәрігер' },
          ],
        },
        'a1-r-3': {
          q: { ru: 'Как зовут сестру?', en: 'What is the sister’s name?', kz: 'Қарындасының аты кім?' },
          options: [
            { ru: 'Айгерім', en: 'Aigerim', kz: 'Айгерім' },
            { ru: 'Айжан', en: 'Aizhan', kz: 'Айжан' },
            { ru: 'Арайлым', en: 'Arailym', kz: 'Арайлым' },
          ],
        },
      },
    },
    listening: {
      title: { ru: 'Аудио: Распорядок дня', en: 'Audio: Daily routine', kz: 'Аудио: Күн тәртібі' },
      questions: {
        'a1-l-1': {
          q: { ru: 'Во сколько он встает?', en: 'What time does he get up?', kz: 'Ол сағат нешеде тұрады?' },
          options: [{ ru: '06:00', en: '06:00', kz: '06:00' }, { ru: '07:00', en: '07:00', kz: '07:00' }, { ru: '08:00', en: '08:00', kz: '08:00' }],
        },
        'a1-l-2': {
          q: { ru: 'Куда он идет в 8:00?', en: 'Where does he go at 8:00?', kz: 'Ол сағат сегізде қайда барады?' },
          options: [
            { ru: 'В университет', en: 'To university', kz: 'Университетке' },
            { ru: 'На работу', en: 'To work', kz: 'Жұмысқа' },
            { ru: 'В магазин', en: 'To the shop', kz: 'Дүкенге' },
          ],
        },
      },
    },
  },
  a2: {
    reading: {
      title: { ru: 'Текст: Мой день', en: 'Reading: My day', kz: 'Мәтін: Менің күнім' },
      questions: {
        'a2-r-1': {
          q: { ru: 'Куда герой идет в 8:00?', en: 'Where does the character go at 8:00?', kz: 'Кейіпкер сағат сегізде қайда барады?' },
          options: [
            { ru: 'В школу', en: 'To school', kz: 'Мектепке' },
            { ru: 'На работу', en: 'To work', kz: 'Жұмысқа' },
            { ru: 'В магазин', en: 'To the shop', kz: 'Дүкенге' },
          ],
        },
        'a2-r-2': {
          q: { ru: 'Что он делает вечером?', en: 'What does he do in the evening?', kz: 'Ол кешке не істейді?' },
          options: [
            { ru: 'Смотрит фильм', en: 'Watches a film', kz: 'Фильм көреді' },
            { ru: 'Занимается спортом', en: 'Does sport', kz: 'Спортпен шұғылданады' },
            { ru: 'Едет к друзьям', en: 'Goes to friends', kz: 'Достарына барады' },
          ],
        },
      },
    },
    listening: {
      title: { ru: 'Аудио: Выходной день', en: 'Audio: A day off', kz: 'Аудио: Демалыс күні' },
      questions: {
        'a2-l-1': {
          q: { ru: 'С кем герой идет в кафе?', en: 'Who does the character go to the cafe with?', kz: 'Кейіпкер кафеге кіммен барады?' },
          options: [
            { ru: 'С семьей', en: 'With family', kz: 'Отбасымен' },
            { ru: 'С друзьями', en: 'With friends', kz: 'Достарымен' },
            { ru: 'Один', en: 'Alone', kz: 'Жалғыз' },
          ],
        },
        'a2-l-2': {
          q: { ru: 'Что он делает вечером?', en: 'What does he do in the evening?', kz: 'Ол кешке не істейді?' },
          options: [
            { ru: 'Работает', en: 'Works', kz: 'Жұмыс істейді' },
            { ru: 'Слушает музыку', en: 'Listens to music', kz: 'Музыка тыңдайды' },
            { ru: 'Учится', en: 'Studies', kz: 'Оқиды' },
          ],
        },
      },
    },
  },
  b1: {
    reading: {
      title: { ru: 'Текст: Мой рабочий день', en: 'Reading: My workday', kz: 'Мәтін: Менің жұмыс күнім' },
      questions: {
        'b1-r-1': {
          q: { ru: 'Где работает герой?', en: 'Where does the character work?', kz: 'Кейіпкер қайда жұмыс істейді?' },
          options: [
            { ru: 'В школе', en: 'At school', kz: 'Мектепте' },
            { ru: 'В международной компании', en: 'At an international company', kz: 'Халықаралық компанияда' },
            { ru: 'В больнице', en: 'At a hospital', kz: 'Ауруханада' },
          ],
        },
        'b1-r-2': {
          q: { ru: 'Что он делает в обед?', en: 'What does he do at lunch?', kz: 'Ол түсте не істейді?' },
          options: [
            { ru: 'Идет домой', en: 'Goes home', kz: 'Үйге барады' },
            { ru: 'Обсуждает проекты', en: 'Discusses projects', kz: 'Жобаларды талқылайды' },
            { ru: 'Спит', en: 'Sleeps', kz: 'Ұйықтайды' },
          ],
        },
      },
    },
    listening: {
      title: { ru: 'Аудио: О путешествии', en: 'Audio: About a trip', kz: 'Аудио: Сапар туралы' },
      questions: {
        'b1-l-1': {
          q: { ru: 'Куда ездил герой?', en: 'Where did the character travel?', kz: 'Кейіпкер қайда барды?' },
          options: [
            { ru: 'В Алматы', en: 'To Almaty', kz: 'Алматыға' },
            { ru: 'В Түркістан', en: 'To Turkistan', kz: 'Түркістанға' },
            { ru: 'В Шымкент', en: 'To Shymkent', kz: 'Шымкентке' },
          ],
        },
        'b1-l-2': {
          q: { ru: 'Что они делали?', en: 'What did they do?', kz: 'Олар не істеді?' },
          options: [
            { ru: 'Учились', en: 'Studied', kz: 'Оқыды' },
            { ru: 'Смотрели исторические места', en: 'Visited historical places', kz: 'Тарихи орындарды көрді' },
            { ru: 'Работали', en: 'Worked', kz: 'Жұмыс істеді' },
          ],
        },
      },
    },
  },
  b2: {
    reading: {
      title: { ru: 'Текст: Образование и технологии', en: 'Reading: Education and technology', kz: 'Мәтін: Білім және технология' },
      questions: {
        'b2-r-1': {
          q: { ru: 'На что влияет технология?', en: 'What does technology affect?', kz: 'Технология неге әсер етеді?' },
          options: [
            { ru: 'На спорт', en: 'Sport', kz: 'Спортқа' },
            { ru: 'На образование', en: 'Education', kz: 'Білімге' },
            { ru: 'На медицину', en: 'Medicine', kz: 'Медицинаға' },
          ],
        },
        'b2-r-2': {
          q: { ru: 'Что все еще важно?', en: 'What is still important?', kz: 'Әлі де не маңызды?' },
          options: [
            { ru: 'Только техника', en: 'Only technology', kz: 'Тек техника' },
            { ru: 'Роль учителя', en: 'The teacher’s role', kz: 'Мұғалімнің рөлі' },
            { ru: 'Только учебники', en: 'Only textbooks', kz: 'Тек оқулықтар' },
          ],
        },
      },
    },
    listening: {
      title: { ru: 'Аудио: Общественное мнение', en: 'Audio: Public opinion', kz: 'Аудио: Қоғамдық пікір' },
      questions: {
        'b2-l-1': {
          q: { ru: 'О чем идет речь?', en: 'What is being discussed?', kz: 'Не туралы айтылып жатыр?' },
          options: [
            { ru: 'О погоде', en: 'Weather', kz: 'Ауа райы туралы' },
            { ru: 'О транспорте в городе', en: 'City transport', kz: 'Қаладағы көлік туралы' },
            { ru: 'О спорте', en: 'Sport', kz: 'Спорт туралы' },
          ],
        },
        'b2-l-2': {
          q: { ru: 'Какое решение считает эффективным автор?', en: 'Which solution does the speaker find effective?', kz: 'Автор қай шешімді тиімді деп санайды?' },
          options: [
            { ru: 'Развивать только дороги', en: 'Develop only roads', kz: 'Тек жолдарды дамыту' },
            { ru: 'Развивать только автобусы', en: 'Develop only buses', kz: 'Тек автобустарды дамыту' },
            { ru: 'Развивать оба направления', en: 'Develop both directions', kz: 'Екі бағытты қатар дамыту' },
          ],
        },
      },
    },
  },
};

export function localizeGrammarTitle(levelId: LevelId, topic: GrammarTopic, lang: AppLanguage): string {
  return grammarBank[levelId]?.[topic.id]?.title[lang] ?? topic.title;
}

export function localizeGrammarRule(levelId: LevelId, topic: GrammarTopic, lang: AppLanguage): string {
  return grammarBank[levelId]?.[topic.id]?.rule[lang] ?? topic.rule;
}

export function localizeGrammarExamples(levelId: LevelId, topic: GrammarTopic, lang: AppLanguage): string[] {
  const examples = grammarBank[levelId]?.[topic.id]?.examples;
  return examples?.map((item) => item[lang]) ?? topic.examples;
}

export function localizeGrammarPrompt(levelId: LevelId, topic: GrammarTopic, lang: AppLanguage): string {
  return grammarBank[levelId]?.[topic.id]?.exercisePrompt[lang] ?? topic.exercise.prompt;
}

export function localizeShadowingTitle(levelId: LevelId, task: ShadowingTask, lang: AppLanguage): string {
  return shadowingBank[levelId]?.[task.id]?.title[lang] ?? task.title;
}

export function localizeShadowingMeaning(levelId: LevelId, task: ShadowingTask, lang: AppLanguage): string {
  return shadowingBank[levelId]?.[task.id]?.meaning[lang] ?? task.russian;
}

export function localizeSkillLessonTitle(
  levelId: LevelId,
  skillType: SkillType,
  fallback: string,
  lang: AppLanguage,
): string {
  return skillBank[levelId]?.[skillType]?.title[lang] ?? fallback;
}

export function localizeSkillQuestionText(
  levelId: LevelId,
  skillType: SkillType,
  question: SkillQuestion,
  lang: AppLanguage,
): string {
  return skillBank[levelId]?.[skillType]?.questions[question.id]?.q[lang] ?? question.q;
}

export function localizeSkillQuestionOptions(
  levelId: LevelId,
  skillType: SkillType,
  question: SkillQuestion,
  lang: AppLanguage,
): string[] {
  const options = skillBank[levelId]?.[skillType]?.questions[question.id]?.options;
  return options?.map((item) => item[lang]) ?? question.options;
}
