// Predefined bet templates per category.
// Each template has a SINGLE proof_type locked to the activity so the user
// cannot choose a proof format that doesn't match (e.g. steps for a reading goal).
export const BET_TEMPLATES = {
  fitness: [
    { titleRu: 'Пробегать 5 км в день',         titleEn: 'Run 5 km a day',              proof_type: 'steps_km', icon: '🏃' },
    { titleRu: 'Проходить 10 000 шагов',         titleEn: 'Walk 10,000 steps',           proof_type: 'steps_km', icon: '👟' },
    { titleRu: 'Сделать 100 отжиманий',          titleEn: 'Do 100 push-ups',             proof_type: 'video',    icon: '💪' },
    { titleRu: 'Сделать 50 приседаний',          titleEn: 'Do 50 squats',                proof_type: 'video',    icon: '🦵' },
    { titleRu: 'Подтянуться 10 раз',             titleEn: 'Do 10 pull-ups',              proof_type: 'video',    icon: '🏋️' },
    { titleRu: 'Тренировка в зале',              titleEn: 'Gym workout',                 proof_type: 'photo',    icon: '🏟️' },
    { titleRu: 'Утренняя зарядка',               titleEn: 'Morning workout',             proof_type: 'video',    icon: '🌅' },
    { titleRu: 'Велопрогулка',                   titleEn: 'Cycling ride',                proof_type: 'steps_km', icon: '🚴' },
  ],
  health: [
    { titleRu: 'Принимать витамины',             titleEn: 'Take vitamins daily',         proof_type: 'photo',    icon: '💊' },
    { titleRu: 'Здоровый завтрак',               titleEn: 'Healthy breakfast',           proof_type: 'photo',    icon: '🥗' },
    { titleRu: 'Сходить к врачу',                titleEn: 'Visit a doctor',              proof_type: 'photo',    icon: '🩺' },
    { titleRu: 'Сдать анализы',                  titleEn: 'Get lab tests',               proof_type: 'photo',    icon: '🧪' },
    { titleRu: 'Лечь спать до 23:00',            titleEn: 'Sleep before 11 pm',          proof_type: 'photo',    icon: '😴' },
    { titleRu: 'Готовить дома',                  titleEn: 'Cook at home',                proof_type: 'photo',    icon: '🍳' },
  ],
  learning: [
    { titleRu: 'Прочитать книгу',                titleEn: 'Finish a book',               proof_type: 'photo',    icon: '📚' },
    { titleRu: 'Получить сертификат курса',      titleEn: 'Complete an online course',   proof_type: 'photo',    icon: '🎓' },
    { titleRu: 'Изучать английский (Duolingo)',  titleEn: 'Practice English (Duolingo)', proof_type: 'photo',    icon: '🇬🇧' },
    { titleRu: 'Конспект лекции',                titleEn: 'Lecture notes',               proof_type: 'photo',    icon: '📝' },
    { titleRu: 'Запушить код в GitHub',          titleEn: 'Push code to GitHub',         proof_type: 'photo',    icon: '⌨️' },
    { titleRu: 'Рассказать тему на видео',       titleEn: 'Explain a topic on video',    proof_type: 'video',    icon: '🎙️' },
  ],
  productivity: [
    { titleRu: 'Закрыть N задач из to-do',       titleEn: 'Close N to-do tasks',         proof_type: 'photo',    icon: '✅' },
    { titleRu: 'Глубокая работа 4 часа',         titleEn: 'Deep work 4 hours',           proof_type: 'photo',    icon: '⏱️' },
    { titleRu: 'Скрин Screen Time <2 ч соцсети', titleEn: 'Screen Time <2 h on social',  proof_type: 'photo',    icon: '📵' },
    { titleRu: '5 сессий Pomodoro',              titleEn: '5 Pomodoro sessions',         proof_type: 'photo',    icon: '🍅' },
    { titleRu: 'Встать в 6 утра',                titleEn: 'Wake up at 6 am',             proof_type: 'photo',    icon: '⏰' },
    { titleRu: 'Inbox Zero к вечеру',            titleEn: 'Inbox Zero by evening',       proof_type: 'photo',    icon: '📨' },
  ],
  mindfulness: [
    { titleRu: 'Медитация 10 минут (Calm/Headspace)', titleEn: 'Meditate 10 min (Calm/Headspace)', proof_type: 'photo', icon: '🧘' },
    { titleRu: 'Прогулка на природе',            titleEn: 'Walk in nature',              proof_type: 'steps_km', icon: '🌳' },
    { titleRu: 'Дневник благодарности',          titleEn: 'Gratitude journal',           proof_type: 'photo',    icon: '📔' },
    { titleRu: 'Цифровой детокс (Screen Time)',  titleEn: 'Digital detox (Screen Time)', proof_type: 'photo',    icon: '🌿' },
    { titleRu: 'Дыхательная практика',           titleEn: 'Breathing practice',          proof_type: 'video',    icon: '🫁' },
  ],
  finance: [
    { titleRu: 'Скрин баланса накоплений',       titleEn: 'Savings balance screenshot',  proof_type: 'photo',    icon: '🏦' },
    { titleRu: 'Без доставки еды',               titleEn: 'No food delivery',            proof_type: 'photo',    icon: '🍱' },
    { titleRu: 'Без кофе на вынос',              titleEn: 'No take-away coffee',         proof_type: 'photo',    icon: '☕' },
    { titleRu: 'Вести бюджет в приложении',      titleEn: 'Track budget in an app',      proof_type: 'photo',    icon: '📊' },
    { titleRu: 'Инвестировать сумму',            titleEn: 'Make an investment',          proof_type: 'photo',    icon: '📈' },
  ],
  social: [
    { titleRu: 'Позвонить родителям',            titleEn: 'Call parents',                proof_type: 'photo',    icon: '📞' },
    { titleRu: 'Встретиться с другом',           titleEn: 'Meet a friend',               proof_type: 'photo',    icon: '🤝' },
    { titleRu: 'Семейный ужин',                  titleEn: 'Family dinner',               proof_type: 'photo',    icon: '🍽️' },
    { titleRu: 'Помочь кому-то',                 titleEn: 'Help someone',                proof_type: 'photo',    icon: '❤️' },
    { titleRu: 'Написать благодарность другу',   titleEn: 'Write a thank-you note',      proof_type: 'photo',    icon: '✉️' },
  ],
  custom: [], // user describes own goal + picks proof type
};
