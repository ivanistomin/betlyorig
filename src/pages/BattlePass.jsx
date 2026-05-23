import { motion } from 'framer-motion';
import { useState } from 'react';
import { useProfile } from '@/lib/useProfile';
import { useTelegram } from '@/lib/useTelegram';
import { useLang } from '@/lib/i18n';
import { ArrowLeft, Gift, Lock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/api/base44Client';
import { toast } from 'sonner';

const REWARDS = [
  { level: 1,  emoji: '💎', titleRu: '200 GEMS',              titleEn: '200 GEMS',              type: 'gems'   },
  { level: 2,  emoji: '🎯', titleRu: '300 GEMS',              titleEn: '300 GEMS',              type: 'gems'   },
  { level: 3,  emoji: '🔥', titleRu: 'Аватар «Новичок»',      titleEn: '"Rookie" Avatar',       type: 'avatar' },
  { level: 4,  emoji: '💎', titleRu: '500 GEMS',              titleEn: '500 GEMS',              type: 'gems'   },
  { level: 5,  emoji: '🎁', titleRu: 'TG Подарок — Звезда',   titleEn: 'TG Gift — Star',        type: 'tg'     },
  { level: 6,  emoji: '💎', titleRu: '750 GEMS',              titleEn: '750 GEMS',              type: 'gems'   },
  { level: 7,  emoji: '⚡', titleRu: 'Промокод 10%',          titleEn: '10% Discount',          type: 'promo'  },
  { level: 8,  emoji: '💎', titleRu: '1 000 GEMS',            titleEn: '1,000 GEMS',            type: 'gems'   },
  { level: 9,  emoji: '🎭', titleRu: 'Аватар «Боец»',         titleEn: '"Fighter" Avatar',      type: 'avatar' },
  { level: 10, emoji: '💫', titleRu: 'TG Подарок — Торт',     titleEn: 'TG Gift — Cake',        type: 'tg'     },
  { level: 11, emoji: '💎', titleRu: '1 200 GEMS',            titleEn: '1,200 GEMS',            type: 'gems'   },
  { level: 12, emoji: '🎯', titleRu: '1 500 GEMS',            titleEn: '1,500 GEMS',            type: 'gems'   },
  { level: 13, emoji: '🏅', titleRu: 'Промокод 15%',          titleEn: '15% Discount',          type: 'promo'  },
  { level: 14, emoji: '💎', titleRu: '2 000 GEMS',            titleEn: '2,000 GEMS',            type: 'gems'   },
  { level: 15, emoji: '🎁', titleRu: 'TG Подарок — Трофей',   titleEn: 'TG Gift — Trophy',      type: 'tg'     },
  { level: 16, emoji: '💎', titleRu: '2 500 GEMS',            titleEn: '2,500 GEMS',            type: 'gems'   },
  { level: 17, emoji: '👾', titleRu: 'Аватар «Чемпион»',      titleEn: '"Champion" Avatar',     type: 'avatar' },
  { level: 18, emoji: '💎', titleRu: '3 000 GEMS',            titleEn: '3,000 GEMS',            type: 'gems'   },
  { level: 19, emoji: '⚡', titleRu: 'Промокод 20%',          titleEn: '20% Discount',          type: 'promo'  },
  { level: 20, emoji: '🏆', titleRu: 'TG Подарок — Золото',   titleEn: 'TG Gift — Gold',        type: 'tg'     },
  { level: 21, emoji: '💎', titleRu: '4 000 GEMS',            titleEn: '4,000 GEMS',            type: 'gems'   },
  { level: 22, emoji: '💎', titleRu: '5 000 GEMS',            titleEn: '5,000 GEMS',            type: 'gems'   },
  { level: 23, emoji: '🌟', titleRu: 'Аватар «Легенда»',      titleEn: '"Legend" Avatar',       type: 'avatar' },
  { level: 24, emoji: '💎', titleRu: '6 000 GEMS',            titleEn: '6,000 GEMS',            type: 'gems'   },
  { level: 25, emoji: '🎁', titleRu: 'TG Подарок — Диамант',  titleEn: 'TG Gift — Diamond',     type: 'tg'     },
  { level: 26, emoji: '💎', titleRu: '7 500 GEMS',            titleEn: '7,500 GEMS',            type: 'gems'   },
  { level: 27, emoji: '🔑', titleRu: 'Промокод 25%',          titleEn: '25% Discount',          type: 'promo'  },
  { level: 28, emoji: '💎', titleRu: '9 000 GEMS',            titleEn: '9,000 GEMS',            type: 'gems'   },
  { level: 29, emoji: '👑', titleRu: 'Аватар «Король»',       titleEn: '"King" Avatar',         type: 'avatar' },
  { level: 30, emoji: '🚀', titleRu: 'TG Подарок — Ракета',   titleEn: 'TG Gift — Rocket',      type: 'tg'     },
  { level: 31, emoji: '💎', titleRu: '10 000 GEMS',           titleEn: '10,000 GEMS',           type: 'gems'   },
  { level: 32, emoji: '💎', titleRu: '12 000 GEMS',           titleEn: '12,000 GEMS',           type: 'gems'   },
  { level: 33, emoji: '⚡', titleRu: 'Промокод 30%',          titleEn: '30% Discount',          type: 'promo'  },
  { level: 34, emoji: '💎', titleRu: '15 000 GEMS',           titleEn: '15,000 GEMS',           type: 'gems'   },
  { level: 35, emoji: '🎁', titleRu: 'TG Подарок — Корона',   titleEn: 'TG Gift — Crown',       type: 'tg'     },
  { level: 36, emoji: '💎', titleRu: '18 000 GEMS',           titleEn: '18,000 GEMS',           type: 'gems'   },
  { level: 37, emoji: '🌈', titleRu: 'Аватар «Миф»',          titleEn: '"Myth" Avatar',         type: 'avatar' },
  { level: 38, emoji: '💎', titleRu: '20 000 GEMS',           titleEn: '20,000 GEMS',           type: 'gems'   },
  { level: 39, emoji: '💰', titleRu: 'Промокод 40%',          titleEn: '40% Discount',          type: 'promo'  },
  { level: 40, emoji: '🔷', titleRu: '0.1 TON',               titleEn: '0.1 TON',               type: 'ton'    },
  { level: 41, emoji: '💎', titleRu: '25 000 GEMS',           titleEn: '25,000 GEMS',           type: 'gems'   },
  { level: 42, emoji: '🎁', titleRu: 'TG Подарок — Звезда 2', titleEn: 'TG Gift — Star 2',      type: 'tg'     },
  { level: 43, emoji: '💎', titleRu: '30 000 GEMS',           titleEn: '30,000 GEMS',           type: 'gems'   },
  { level: 44, emoji: '🔥', titleRu: 'Аватар «Бог»',          titleEn: '"God" Avatar',          type: 'avatar' },
  { level: 45, emoji: '💠', titleRu: '0.5 TON',               titleEn: '0.5 TON',               type: 'ton'    },
  { level: 46, emoji: '⚡', titleRu: '50 000 GEMS',           titleEn: '50,000 GEMS',           type: 'gems'   },
  { level: 47, emoji: '🎁', titleRu: 'Эксклюзивный TG-подарок', titleEn: 'Exclusive TG Gift',  type: 'tg'     },
  { level: 48, emoji: '💎', titleRu: '1 TON',                 titleEn: '1 TON',                 type: 'ton'    },
  { level: 49, emoji: '👑', titleRu: 'Аватар «Абсолют»',      titleEn: '"Absolute" Avatar',     type: 'avatar' },
  { level: 50, emoji: '📱', titleRu: 'Розыгрыш 3× iPhone 17!', titleEn: '3× iPhone 17 Giveaway!', type: 'jackpot' },
];

const TYPE_CONFIG = {
  gems:    { color: '#F5C842', glow: 'rgba(245,200,66,0.5)',  label: 'GEMS'    },
  tg:      { color: '#7C5CFC', glow: 'rgba(124,92,252,0.5)', label: 'TG Gift' },
  promo:   { color: '#00E5CC', glow: 'rgba(0,229,204,0.5)',  label: 'Promo'   },
  avatar:  { color: '#A0A0B0', glow: 'rgba(160,160,176,0.4)',label: 'Avatar'  },
  ton:     { color: '#5299DC', glow: 'rgba(82,153,220,0.5)', label: 'TON'     },
  jackpot: { color: '#F5C842', glow: 'rgba(245,200,66,0.7)', label: 'JACKPOT' },
};

function RewardRow({ reward, userLevel, isLast, claimed, onClaim, claiming }) {
  const cfg = TYPE_CONFIG[reward.type];
  const unlocked = userLevel >= reward.level;
  const isCurrent = userLevel + 1 === reward.level;
  const isJackpot = reward.type === 'jackpot';
  const canClaim = unlocked && !claimed;

  return (
    <div className="flex items-stretch gap-0">
      {/* Left: level number + connector line */}
      <div className="flex flex-col items-center w-12 shrink-0">
        {/* Level bubble */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: Math.min(reward.level * 0.02, 0.5) }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-heading font-black relative z-10"
          style={{
            background: claimed
              ? `linear-gradient(135deg, ${cfg.color}, ${cfg.color}99)`
              : unlocked
              ? `linear-gradient(135deg, #22c55e, #16a34a)`
              : isCurrent
              ? 'linear-gradient(135deg, #7C5CFC, #00E5CC)'
              : 'rgba(255,255,255,0.06)',
            border: claimed
              ? `2px solid ${cfg.color}`
              : unlocked
              ? '2px solid #22c55e'
              : isCurrent
              ? '2px solid #7C5CFC'
              : '2px solid rgba(255,255,255,0.1)',
            boxShadow: claimed || unlocked
              ? `0 0 14px ${cfg.glow}`
              : isCurrent
              ? '0 0 18px rgba(124,92,252,0.7)'
              : 'none',
            color: claimed || unlocked || isCurrent ? '#fff' : 'rgba(255,255,255,0.3)',
          }}
        >
          {claimed ? <CheckCircle className="w-4 h-4" /> : reward.level}
        </motion.div>

        {/* Connector line */}
        {!isLast && (
          <div
            className="flex-1 w-0.5 mt-0.5"
            style={{
              background: claimed || unlocked
                ? `linear-gradient(to bottom, ${cfg.color}80, rgba(255,255,255,0.06))`
                : 'rgba(255,255,255,0.07)',
              minHeight: 24,
            }}
          />
        )}
      </div>

      {/* Right: reward card */}
      <div className="flex-1 pb-3 pl-2">
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: Math.min(reward.level * 0.02, 0.5) }}
          className="rounded-2xl px-4 py-3 flex items-center gap-3 relative overflow-hidden"
          style={{
            background: isJackpot
              ? 'linear-gradient(135deg, rgba(245,200,66,0.15), rgba(124,92,252,0.15))'
              : claimed || unlocked
              ? `linear-gradient(135deg, ${cfg.color}18, ${cfg.color}08)`
              : isCurrent
              ? 'rgba(124,92,252,0.12)'
              : 'rgba(255,255,255,0.03)',
            border: isJackpot
              ? '1.5px solid rgba(245,200,66,0.6)'
              : claimed || unlocked
              ? `1.5px solid ${cfg.color}50`
              : isCurrent
              ? '1.5px solid rgba(124,92,252,0.5)'
              : '1.5px solid rgba(255,255,255,0.07)',
            boxShadow: isJackpot
              ? '0 0 24px rgba(245,200,66,0.2)'
              : claimed || unlocked
              ? `0 0 12px ${cfg.glow}30`
              : isCurrent
              ? '0 0 16px rgba(124,92,252,0.25)'
              : 'none',
          }}
        >
          {/* Glow bg for current */}
          {isCurrent && (
            <div className="absolute inset-0 rounded-2xl opacity-20"
              style={{ background: 'radial-gradient(ellipse at left, #7C5CFC 0%, transparent 70%)' }} />
          )}

          {/* Emoji */}
          <span className={`shrink-0 ${isJackpot ? 'text-3xl' : 'text-2xl'}`}>{reward.emoji}</span>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p
              className="font-heading font-bold text-sm leading-tight"
              style={{
                color: claimed || unlocked ? cfg.color : isCurrent ? '#fff' : 'rgba(255,255,255,0.4)',
              }}
            >
              {reward.titleRu}
            </p>
            {isJackpot && (
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(245,200,66,0.6)' }}>
                🍀 Финальная награда — 50-й уровень
              </p>
            )}
            {isCurrent && (
              <p className="text-[10px] mt-0.5 text-primary">Следующая награда</p>
            )}
            {canClaim && (
              <button
                onClick={() => onClaim(reward)}
                disabled={claiming}
                className="mt-2 px-3 py-1.5 rounded-lg text-xs font-heading font-bold text-black bg-gradient-to-r from-neon-gold to-amber-400 disabled:opacity-50"
              >
                {claiming ? '...' : 'Забрать награду'}
              </button>
            )}
            {claimed && (
              <p className="text-[10px] mt-1" style={{ color: `${cfg.color}aa` }}>
                Получено
              </p>
            )}
          </div>

          {/* Right icon */}
          <div className="shrink-0">
            {claimed ? (
              <span className="text-base">✅</span>
            ) : unlocked ? (
              <span className="text-base">🎁</span>
            ) : isCurrent ? (
              <motion.span
                className="text-base"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >🎯</motion.span>
            ) : (
              <Lock className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.2)' }} />
            )}
          </div>

          {/* Special badge */}
          {reward.type !== 'gems' && (
            <div
              className="absolute top-1.5 right-2 px-1.5 py-0.5 rounded-full text-[8px] font-heading font-black"
              style={{
                background: `${cfg.color}22`,
                color: cfg.color,
                border: `1px solid ${cfg.color}40`,
              }}
            >
              {cfg.label}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function BattlePass() {
  const navigate = useNavigate();
  const { tgUser } = useTelegram();
  const { profile, refreshProfile } = useProfile(tgUser);
  const { lang } = useLang();
  const [claimingLevel, setClaimingLevel] = useState(null);
  const userLevel = profile?.level || 1;
  const xp = profile?.xp || 0;
  const claimedRewards = Array.isArray(profile?.claimed_battle_pass_rewards)
    ? profile.claimed_battle_pass_rewards
    : [];

  const xpForLevel = userLevel * 100;
  const progress = Math.min((xp / xpForLevel) * 100, 100);
  const unlockedCount = REWARDS.filter(r => userLevel >= r.level).length;

  const handleClaim = async (reward) => {
    if (!profile) {
      toast.error(lang === 'ru' ? 'Профиль ещё загружается, попробуй ещё раз' : 'Profile is still loading, try again');
      return;
    }
    setClaimingLevel(reward.level);
    try {
      const newClaimed = [...claimedRewards, reward.level];
      const updates = { claimed_battle_pass_rewards: newClaimed };
      if (reward.type === 'gems') {
        const match = reward.titleRu.match(/([\d\s]+)/);
        const gemsAmount = match ? Number(match[1].replace(/\s/g, '')) : 0;
        updates.gems_balance = (profile.gems_balance || 0) + gemsAmount;
        updates.total_gems_earned = (profile.total_gems_earned || 0) + gemsAmount;
      }
      await db.entities.UserProfile.update(profile.id, updates);
      await refreshProfile();
      toast.success(lang === 'ru' ? `Награда за уровень ${reward.level} получена!` : `Reward for level ${reward.level} claimed!`);
    } catch (e) {

      console.error('[BattlePass claim]', e);
      toast.error(e?.message || (lang === 'ru' ? 'Не удалось забрать награду' : 'Failed to claim reward'));
    } finally {
      setClaimingLevel(null);
    }
  };

  return (
    <div className="min-h-screen pb-10" style={{ background: 'hsl(250 20% 6%)' }}>
      {/* Header */}
      <div
        className="relative px-4 pt-5 pb-6 overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, hsl(258 50% 12%) 0%, hsl(250 20% 7%) 70%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Stars bg */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 2 + 1,
                height: Math.random() * 2 + 1,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.4 + 0.1,
              }}
              animate={{ opacity: [0.1, 0.5, 0.1] }}
              transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
            />
          ))}
        </div>

        {/* Back + Title */}
        <div className="relative flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-heading font-black text-white">
              {lang === 'ru' ? '🏆 Путь Чемпиона' : "🏆 Champion's Path"}
            </h1>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {lang === 'ru' ? 'Уровень вверх — награда в кармане' : 'Level up — earn real prizes'}
            </p>
          </div>
        </div>

        {/* Level + XP */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-heading font-black"
                style={{
                  background: 'linear-gradient(135deg, #F5C842, #F59E0B)',
                  boxShadow: '0 0 20px rgba(245,200,66,0.5)',
                  color: '#000',
                }}
              >
                {userLevel}
              </div>
              <div>
                <p className="text-xs font-heading font-bold text-white">
                  {lang === 'ru' ? 'Уровень' : 'Level'} {userLevel}
                </p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {xp} / {xpForLevel} XP
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-heading font-bold" style={{ color: '#00E5CC' }}>
                {unlockedCount} / 50
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {lang === 'ru' ? 'наград' : 'rewards'}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #7C5CFC, #00E5CC)' }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Rewards vertical timeline */}
      <div className="px-4 pt-5">
        {REWARDS.map((reward, i) => (
          <RewardRow
            key={reward.level}
            reward={reward}
            userLevel={userLevel}
            isLast={i === REWARDS.length - 1}
            claimed={claimedRewards.includes(reward.level)}
            onClaim={handleClaim}
            claiming={claimingLevel === reward.level}
          />
        ))}

        {/* Bottom note */}
        <div
          className="mt-2 p-4 rounded-2xl flex items-start gap-3"
          style={{
            background: 'rgba(124,92,252,0.08)',
            border: '1px solid rgba(124,92,252,0.2)',
          }}
        >
          <Gift className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#7C5CFC' }} />
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {lang === 'ru'
              ? 'Призы выдаются вручную. Достигнув нужного уровня, нажми "Забрать награду". TG-подарки приходят прямо в Telegram.'
              : 'Prizes are distributed manually. Click "Claim Reward" upon reaching the required level.'}
          </p>
        </div>
      </div>
    </div>
  );
}