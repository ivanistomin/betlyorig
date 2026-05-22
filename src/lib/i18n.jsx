import { createContext, useContext, useState } from 'react';

export const translations = {
  en: {
    // Nav
    missions: 'Missions',
    bets: 'Bets',
    rank: 'Rank',
    exchange: 'Exchange',
    profile: 'Profile',
    // Dashboard
    dashboard_subtitle: 'Your habit battleground',
    active_bets: 'Active Bets',
    win_rate: 'Win Rate',
    best_streak: 'Best Streak',
    level: 'Level',
    bet: 'Bet',
    place_bet: 'Place Bet',
    my_bets: 'My Bets',
    leaderboard: 'Leaderboard',
    missions_short: 'Missions',
    no_active_bets: 'No active bets',
    start_first_bet: 'Place your first bet and start winning!',
    wins: 'Wins',
    losses: 'Losses',
    streak: 'Streak',
    // NewBet
    new_bet: 'New Bet',
    your_balance: 'Your balance',
    goal_question: "What's your goal?",
    goal_placeholder: 'e.g. Run 5km every day',
    details_optional: 'Details (optional)',
    details_placeholder: 'Describe the rules of your bet...',
    category: 'Category',
    stake_amount: 'Stake Amount',
    duration_days: 'Duration (days)',
    difficulty: 'Difficulty',
    difficulty_easy: 'Easy',
    difficulty_medium: 'Medium',
    difficulty_hard: 'Hard',
    difficulty_legendary: 'Legendary',
    difficulty_desc: 'Higher difficulty = bigger reward multiplier',
    potential_reward: 'Potential Reward',
    if_fail: 'If you fail',
    place_bet_btn: '🎯 Place Bet',
    placing: 'Placing Bet...',
    proof_type: 'Proof of completion',
    proof_photo: '📷 Photo proof',
    proof_steps: '👟 Steps / km (fitness)',
    proof_video: '🎥 Video proof',
    proof_any: '📝 Any evidence',
    proof_hint: 'You will need to attach proof when marking bet as complete. Moderators may review it.',
    moderation_notice: '⚠️ P.S. Moderation reserves the right to cancel any bet without explanation if suspicious activity is detected.',
    // Leaderboard
    compete_win: 'Compete. Win. Dominate.',
    global: 'Global',
    friends: 'Friends',
    // Exchange
    min_exchange: 'Minimum exchange: 10,000 GEMS = 1 TON',
    // Community Bets
    community_bets: 'Community Bets',
    community_desc: 'Community-created challenges. Participate and earn from others\' failures.',
    propose_bet: 'Propose a Bet',
    pending_moderation: 'Pending moderation',
    battle_pass_nav: 'Pass',
    // Missions
    missions_page: 'Missions',
    missions_subtitle: 'Complete missions — earn GEMS',
    claim_reward: '🎁 Claim Reward',
    claimed: 'Claimed',
    in_progress: 'In Progress',
  },
  ru: {
    // Nav
    missions: 'Миссии',
    bets: 'Ставки',
    rank: 'Рейтинг',
    exchange: 'Обмен',
    profile: 'Профиль',
    // Dashboard
    dashboard_subtitle: 'Твоя арена привычек',
    active_bets: 'Активные ставки',
    win_rate: 'Побед',
    best_streak: 'Рекорд серии',
    level: 'Уровень',
    bet: 'Ставка',
    place_bet: 'Ставка',
    my_bets: 'Мои ставки',
    leaderboard: 'Рейтинг',
    missions_short: 'Миссии',
    no_active_bets: 'Нет активных ставок',
    start_first_bet: 'Сделай первую ставку и начни побеждать!',
    wins: 'Побед',
    losses: 'Поражений',
    streak: 'Серия',
    // NewBet
    new_bet: 'Новая ставка',
    your_balance: 'Ваш баланс',
    goal_question: 'Какова ваша цель?',
    goal_placeholder: 'напр. Бегать 5 км каждый день',
    details_optional: 'Подробности (необязательно)',
    details_placeholder: 'Опишите правила вашей ставки...',
    category: 'Категория',
    stake_amount: 'Сумма ставки',
    duration_days: 'Длительность (дней)',
    difficulty: 'Сложность',
    difficulty_easy: 'Легко',
    difficulty_medium: 'Средне',
    difficulty_hard: 'Сложно',
    difficulty_legendary: 'Легендарно',
    difficulty_desc: 'Чем сложнее — тем больше множитель награды',
    potential_reward: 'Потенциальная награда',
    if_fail: 'Если провалишь',
    place_bet_btn: '🎯 Поставить',
    placing: 'Оформление...',
    proof_type: 'Тип доказательства',
    proof_photo: '📷 Фото-доказательство',
    proof_steps: '👟 Шаги / км (фитнес)',
    proof_video: '🎥 Видео-доказательство',
    proof_any: '📝 Любое доказательство',
    proof_hint: 'При закрытии ставки нужно приложить доказательство. Модераторы могут его проверить.',
    moderation_notice: '⚠️ P.S. Модерация оставляет за собой право отменить любую ставку без объяснений, если будет замечена подозрительная активность.',
    // Leaderboard
    compete_win: 'Соревнуйся. Побеждай. Доминируй.',
    global: 'Глобальный',
    friends: 'Друзья',
    // Exchange
    min_exchange: 'Минимум для вывода: 10 000 GEMS = 1 TON',
    // Community Bets
    community_bets: 'Общие ставки',
    community_desc: 'Ставки от сообщества. Участвуй и зарабатывай с проигрышей других.',
    propose_bet: 'Предложить ставку',
    pending_moderation: 'На модерации',
    battle_pass_nav: 'Пропуск',
    // Missions
    missions_page: 'Миссии',
    missions_subtitle: 'Выполняй миссии — получай GEMS',
    claim_reward: '🎁 Забрать награду',
    claimed: 'Получено',
    in_progress: 'В процессе',
  },
};

const LangContext = createContext({ lang: 'ru', t: (k) => k, setLang: () => {} });

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('paceup_lang') || 'ru');

  const t = (key) => translations[lang]?.[key] || translations['en']?.[key] || key;

  const switchLang = (l) => {
    setLang(l);
    localStorage.setItem('paceup_lang', l);
  };

  return <LangContext.Provider value={{ lang, t, setLang: switchLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
