export const CATEGORIES = {
  fitness: { emoji: '🏃', label: 'Fitness', labelRu: 'Фитнес', color: 'text-green-400' },
  health: { emoji: '🥗', label: 'Health', labelRu: 'Здоровье', color: 'text-emerald-400' },
  learning: { emoji: '📚', label: 'Learning', labelRu: 'Обучение', color: 'text-blue-400' },
  productivity: { emoji: '⚡', label: 'Productivity', labelRu: 'Продуктивность', color: 'text-yellow-400' },
  mindfulness: { emoji: '🧘', label: 'Mindfulness', labelRu: 'Медитация', color: 'text-purple-400' },
  finance: { emoji: '💰', label: 'Finance', labelRu: 'Финансы', color: 'text-amber-400' },
  social: { emoji: '🤝', label: 'Social', labelRu: 'Общение', color: 'text-pink-400' },
  custom: { emoji: '🎯', label: 'Custom', labelRu: 'Другое', color: 'text-cyan-400' },
};

// Duration multipliers
export const DURATION_MULTIPLIERS = {
  1:  { multiplier: 1.3, label: '×1.3' },
  3:  { multiplier: 1.6, label: '×1.6' },
  7:  { multiplier: 1.9, label: '×1.9' },
  14: { multiplier: 2.3, label: '×2.3' },
  30: { multiplier: 3.3, label: '×3.3' },
};

// Daily bet limits
// Every user starts with 1 bet per day. Each invited friend adds +1 slot.
export const BASE_DAILY_BET_LIMIT = 1;
export function getDailyBetLimit(profile) {
  const friendsCount = Array.isArray(profile?.tg_friends_ids)
    ? profile.tg_friends_ids.length
    : 0;
  return BASE_DAILY_BET_LIMIT + friendsCount;
}

// Proof type multipliers
export const PROOF_MULTIPLIERS = {
  photo:    { multiplier: 1.0, labelEn: '📷 Photo', labelRu: '📷 Фото', hintEn: 'Photo/screenshot proof', hintRu: 'Фото или скриншот результата' },
  video:    { multiplier: 1.35, labelEn: '🎥 Video', labelRu: '🎥 Видео', hintEn: 'Video of the exercise/result', hintRu: 'Видео выполнения или результата' },
  steps_km: { multiplier: 1.5, labelEn: '👟 Tracker', labelRu: '👟 Трекер', hintEn: 'Steps/km from a tracker', hintRu: 'Шаги/км из трекера' },
  any:      { multiplier: 0.8, labelEn: '📝 Any proof', labelRu: '📝 Любое доказательство', hintEn: 'Legacy flexible proof', hintRu: 'Старый гибкий формат' },
};

// Which proof types make sense per category. "Any proof" stays supported for old bets,
// but new bets use concrete proof formats. Only the "custom" category lets the user
// pick a proof type — for everything else the proof type is locked by the chosen
// activity template.
export const CATEGORY_PROOF_TYPES = {
  fitness:      ['steps_km', 'video', 'photo'],
  health:       ['photo'],
  learning:     ['photo', 'video'],
  productivity: ['photo'],
  mindfulness:  ['photo', 'video', 'steps_km'],
  finance:      ['photo'],
  social:       ['photo'],
  custom:       ['photo', 'video', 'steps_km'],
};

export function getAllowedProofTypes(category) {
  return CATEGORY_PROOF_TYPES[category] || ['photo', 'any'];
}

export function normalizeProofType(category, proofType) {
  const allowed = getAllowedProofTypes(category);
  if (allowed.includes(proofType)) return proofType;
  return allowed[0];
}

// Early close modes (alternative system)
export const CLOSE_MODES = {
  easy:   { labelEn: 'Easy', labelRu: 'Лёгкий', descEn: 'Close early any day, reward proportional to days', descRu: 'Закрыть досрочно в любой день, награда пропорциональна дням', color: 'text-green-400', bg: 'bg-green-400/10' },
  medium: { labelEn: 'Standard', labelRu: 'Стандарт', descEn: 'Early close only after 50% of days', descRu: 'Досрочно только после 50% дней', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  strict: { labelEn: 'Strict', labelRu: 'Жёсткий', descEn: 'Early close = full stake lost', descRu: 'Досрочное закрытие = потеря всей ставки', color: 'text-red-400', bg: 'bg-red-400/10' },
};

// Kept for backward compatibility with BetCard
export const DIFFICULTIES = {
  easy:      { label: 'Easy',      multiplier: 1.2, color: 'text-green-400',  bgColor: 'bg-green-400/10' },
  medium:    { label: 'Medium',    multiplier: 1.5, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
  hard:      { label: 'Hard',      multiplier: 2.0, color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
  legendary: { label: 'Legendary', multiplier: 3.0, color: 'text-red-400',    bgColor: 'bg-red-400/10' },
};

export const ACHIEVEMENTS = [
  { id: 'first_bet',   title: 'First Step',   titleRu: 'Первый шаг',    desc: 'Place your first bet',     descRu: 'Сделай первую ставку',       emoji: '🎯' },
  { id: 'first_win',   title: 'Winner',       titleRu: 'Победитель',    desc: 'Win your first bet',       descRu: 'Выиграй первую ставку',       emoji: '🏆' },
  { id: 'streak_3',   title: 'On Fire',       titleRu: 'В огне',        desc: '3 wins in a row',          descRu: '3 победы подряд',             emoji: '🔥' },
  { id: 'streak_7',   title: 'Unstoppable',   titleRu: 'Неостановим',   desc: '7 wins in a row',          descRu: '7 побед подряд',              emoji: '💎' },
  { id: 'high_roller', title: 'High Roller',  titleRu: 'Крупный игрок', desc: 'Stake 500+ GEMS',          descRu: 'Поставь 500+ GEMS',           emoji: '🎰' },
  { id: 'legend',     title: 'Legend',        titleRu: 'Легенда',       desc: 'Complete a 30-day bet',    descRu: 'Выполни ставку на 30 дней',   emoji: '👑' },
  { id: 'thousand_club', title: '1K Club',    titleRu: 'Клуб 1K',      desc: 'Earn 1000+ GEMS total',    descRu: 'Заработай 1000+ GEMS',        emoji: '💰' },
  { id: 'level_5',    title: 'Veteran',       titleRu: 'Ветеран',       desc: 'Reach level 5',            descRu: 'Достигни уровня 5',           emoji: '⭐' },
  { id: 'level_10',   title: 'Master',        titleRu: 'Мастер',        desc: 'Reach level 10',           descRu: 'Достигни уровня 10',          emoji: '🌟' },
  { id: 'ten_wins',   title: 'Consistent',    titleRu: 'Постоянство',   desc: 'Win 10 bets',              descRu: 'Выиграй 10 ставок',           emoji: '📈' },
];

export function getXpForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// New reward formula: stake × duration_multiplier × proof_multiplier
export function calculateReward(stakeAmount, durationDays, proofType = 'any') {
  const durEntry = DURATION_MULTIPLIERS[durationDays];
  const durMult = durEntry ? durEntry.multiplier : 1.0;
  const proofMult = PROOF_MULTIPLIERS[proofType]?.multiplier || 0.8;
  return Math.floor(stakeAmount * durMult * proofMult);
}

// Backward-compat wrapper used by MyBets/BetCard
export function calculateRewardLegacy(stakeAmount, difficulty) {
  const multiplier = DIFFICULTIES[difficulty]?.multiplier || 1.5;
  return Math.floor(stakeAmount * multiplier);
}

// ─── Anti-cheat validation ────────────────────────────────────────────────────
const CHEAT_KEYWORDS_RU = [
  'секунд', 'секунду', 'секунды', 'минуту', 'минут', 'минуты',
  'не моргать', 'моргнуть', 'подержаться', 'продержаться',
  'не делать', 'ничего не делать', 'полежать', 'посидеть',
  'раз', 'одно', 'один раз', 'два раза', 'потрогать', 'коснуться',
];
const CHEAT_KEYWORDS_EN = [
  'second', 'seconds', 'minute', 'minutes', 'blink', 'hold for',
  'stay still', 'do nothing', 'sit down once', 'touch', 'tap once',
  'one time', 'once', 'just stand',
];
const ALL_CHEAT = [...CHEAT_KEYWORDS_RU, ...CHEAT_KEYWORDS_EN];

export function validateGoalTitle(title) {
  const lower = title.toLowerCase();
  const found = ALL_CHEAT.find((kw) => lower.includes(kw));
  if (found) {
    return {
      valid: false,
      reason_en: `Goals must require real, measurable effort over time. Trivial tasks ("${found}…") are not allowed.`,
      reason_ru: `Цель должна требовать реальных измеримых усилий. Тривиальные задачи ("${found}…") не допускаются.`,
    };
  }
  if (title.trim().length < 10) {
    return {
      valid: false,
      reason_en: 'Goal title is too short. Describe a specific, measurable goal.',
      reason_ru: 'Название цели слишком короткое. Опишите конкретную измеримую цель.',
    };
  }
  return { valid: true };
}
