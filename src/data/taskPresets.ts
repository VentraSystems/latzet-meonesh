export interface TaskPreset {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  type: 'task' | 'quiz';
  category: 'chores' | 'homework' | 'behavior' | 'education';
}

export interface QuizPreset {
  id: string;
  title: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

// Task Presets - Easy for parents to select!
export const taskPresets: TaskPreset[] = [
  // Chores
  {
    id: 'clean-room',
    title: 'ניקיון חדר',
    titleEn: 'Clean Room',
    description: 'לנקות את החדר ולסדר את כל הדברים',
    descriptionEn: 'Clean the room and organize everything',
    icon: '🧹',
    type: 'task',
    category: 'chores',
  },
  {
    id: 'make-bed',
    title: 'סידור המיטה',
    titleEn: 'Make the Bed',
    description: 'לסדר את המיטה בצורה מסודרת',
    descriptionEn: 'Make the bed neatly',
    icon: '🛏️',
    type: 'task',
    category: 'chores',
  },
  {
    id: 'wash-dishes',
    title: 'שטיפת כלים',
    titleEn: 'Wash the Dishes',
    description: 'לשטוף את הכלים המלוכלכים',
    descriptionEn: 'Wash all the dirty dishes',
    icon: '🍽️',
    type: 'task',
    category: 'chores',
  },
  {
    id: 'take-out-trash',
    title: 'הוצאת אשפה',
    titleEn: 'Take Out the Trash',
    description: 'להוציא את האשפה לפח בחוץ',
    descriptionEn: 'Take the trash bag outside to the bin',
    icon: '🗑️',
    type: 'task',
    category: 'chores',
  },
  {
    id: 'organize-closet',
    title: 'סידור ארון',
    titleEn: 'Organize Closet',
    description: 'לסדר את הבגדים בארון',
    descriptionEn: 'Fold and organize clothes in the closet',
    icon: '👔',
    type: 'task',
    category: 'chores',
  },
  {
    id: 'clean-bathroom',
    title: 'ניקיון שירותים',
    titleEn: 'Clean the Bathroom',
    description: 'לנקות את השירותים והאמבטיה',
    descriptionEn: 'Clean the toilet and bathroom',
    icon: '🚿',
    type: 'task',
    category: 'chores',
  },

  // Homework
  {
    id: 'do-homework',
    title: 'שיעורי בית',
    titleEn: 'Do Homework',
    description: 'לעשות את כל שיעורי הבית',
    descriptionEn: 'Complete all homework assignments',
    icon: '📚',
    type: 'task',
    category: 'homework',
  },
  {
    id: 'read-book',
    title: 'קריאת ספר',
    titleEn: 'Read a Book',
    description: 'לקרוא 20 דקות',
    descriptionEn: 'Read for 20 minutes',
    icon: '📖',
    type: 'task',
    category: 'homework',
  },
  {
    id: 'practice-math',
    title: 'תרגול מתמטיקה',
    titleEn: 'Practice Math',
    description: 'לעשות 10 תרגילים במתמטיקה',
    descriptionEn: 'Complete 10 math exercises',
    icon: '🔢',
    type: 'task',
    category: 'homework',
  },
  {
    id: 'study-english',
    title: 'לימוד אנגלית',
    titleEn: 'Study English',
    description: 'ללמוד 10 מילים חדשות באנגלית',
    descriptionEn: 'Learn 10 new English words',
    icon: '🇬🇧',
    type: 'task',
    category: 'homework',
  },

  // Behavior
  {
    id: 'apologize',
    title: 'להתנצל',
    titleEn: 'Apologize',
    description: 'להתנצל על ההתנהגות',
    descriptionEn: 'Apologize sincerely for the behavior',
    icon: '🙏',
    type: 'task',
    category: 'behavior',
  },
  {
    id: 'help-sibling',
    title: 'לעזור לאח/אחות',
    titleEn: 'Help a Sibling',
    description: 'לעזור לאח או אחות במשימה',
    descriptionEn: 'Help a brother or sister with a task',
    icon: '🤝',
    type: 'task',
    category: 'behavior',
  },
  {
    id: 'no-phone-hour',
    title: 'שעה בלי טלפון',
    titleEn: 'One Hour No Phone',
    description: 'לא להשתמש בטלפון לשעה שלמה',
    descriptionEn: 'No phone use for a full hour',
    icon: '📵',
    type: 'task',
    category: 'behavior',
  },
];

// Educational Quizzes - Children learn while earning freedom!
export const quizPresets: QuizPreset[] = [
  {
    id: 'math-basic',
    title: 'חידון מתמטיקה - בסיסי',
    subject: 'מתמטיקה',
    difficulty: 'easy',
    questions: [
      {
        question: 'כמה זה 5 + 3?',
        options: ['7', '8', '9', '10'],
        correctAnswer: 1,
      },
      {
        question: 'כמה זה 10 - 4?',
        options: ['5', '6', '7', '4'],
        correctAnswer: 1,
      },
      {
        question: 'כמה זה 3 × 4?',
        options: ['7', '10', '12', '15'],
        correctAnswer: 2,
      },
      {
        question: 'כמה זה 20 ÷ 5?',
        options: ['3', '4', '5', '6'],
        correctAnswer: 1,
      },
      {
        question: 'כמה זה 7 + 8?',
        options: ['14', '15', '16', '17'],
        correctAnswer: 1,
      },
    ],
  },
  {
    id: 'hebrew-grammar',
    title: 'חידון עברית - דקדוק',
    subject: 'עברית',
    difficulty: 'medium',
    questions: [
      {
        question: 'מה זה שם עצם?',
        options: ['פעולה', 'דבר או אדם', 'תואר', 'מקום בלבד'],
        correctAnswer: 1,
      },
      {
        question: 'איזה מילה היא פועל?',
        options: ['ילד', 'רץ', 'יפה', 'בית'],
        correctAnswer: 1,
      },
      {
        question: 'מה הרבים של "ספר"?',
        options: ['ספרים', 'ספרות', 'ספרן', 'ספרי'],
        correctAnswer: 0,
      },
      {
        question: 'איזו מילה היא שם תואר?',
        options: ['שולחן', 'כותב', 'גדול', 'מהר'],
        correctAnswer: 2,
      },
      {
        question: 'מה זמן העתיד של "אני אוכל"?',
        options: ['אכלתי', 'אוכל', 'אוכל', 'אכל'],
        correctAnswer: 1,
      },
    ],
  },
  {
    id: 'general-knowledge',
    title: 'ידע כללי',
    subject: 'ידע כללי',
    difficulty: 'easy',
    questions: [
      {
        question: 'מה בירת ישראל?',
        options: ['תל אביב', 'ירושלים', 'חיפה', 'באר שבע'],
        correctAnswer: 1,
      },
      {
        question: 'כמה צבעים יש בקשת?',
        options: ['5', '6', '7', '8'],
        correctAnswer: 2,
      },
      {
        question: 'איזה חיה הכי גדולה בעולם?',
        options: ['פיל', 'לוויתן כחול', 'ג\'ירפה', 'דינוזאור'],
        correctAnswer: 1,
      },
      {
        question: 'כמה ימים יש בשבוע?',
        options: ['5', '6', '7', '8'],
        correctAnswer: 2,
      },
      {
        question: 'מה הכוכב הקרוב ביותר לכדור הארץ?',
        options: ['הירח', 'מאדים', 'השמש', 'צדק'],
        correctAnswer: 2,
      },
    ],
  },
  {
    id: 'science-basic',
    title: 'חידון מדעים',
    subject: 'מדעים',
    difficulty: 'medium',
    questions: [
      {
        question: 'מה קורה למים בטמפרטורה של 0 מעלות?',
        options: ['הם רותחים', 'הם קופאים', 'הם מתאדים', 'כלום'],
        correctAnswer: 1,
      },
      {
        question: 'כמה רגליים יש לעכביש?',
        options: ['6', '8', '10', '12'],
        correctAnswer: 1,
      },
      {
        question: 'מה הצמחים צריכים כדי לייצר אוכל?',
        options: ['מים בלבד', 'אור שמש בלבד', 'מים, אור ואוויר', 'שום דבר'],
        correctAnswer: 2,
      },
      {
        question: 'איזה איבר שולט במחשבות שלנו?',
        options: ['הלב', 'המוח', 'הכליות', 'הכבד'],
        correctAnswer: 1,
      },
      {
        question: 'מה שם התהליך שבו מים הופכים לאדים?',
        options: ['קפיאה', 'התכה', 'אידוי', 'עיבוי'],
        correctAnswer: 2,
      },
    ],
  },
];
