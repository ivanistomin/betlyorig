import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { useProfile } from '@/lib/useProfile';
import GemsBadge from '@/components/common/GemsBadge';
import CyberSlots from '@/components/games/CyberSlots';
import NeonPlinko from '@/components/games/NeonPlinko';
import CyberWheel from '@/components/games/CyberWheel';
import AeroCrash from '@/components/games/AeroCrash';
import {
  SlotsPreview,
  PlinkoPreview,
  WheelPreview,
  CrashPreview,
} from '@/components/games/GamePreviews';

const GAMES = [
  {
    id: 'slots',
    titleRu: 'Cyber Slots',
    titleEn: 'Cyber Slots',
    descRu: 'Кибер-слоты с неоновыми кристаллами',
    descEn: 'Neon crystal slot machine',
    emoji: '🎰',
    accent: 'from-fuchsia-500 to-purple-600',
    glow: 'hsl(290 95% 60%)',
    Preview: SlotsPreview,
  },
  {
    id: 'plinko',
    titleRu: 'Neon Plinko',
    titleEn: 'Neon Plinko',
    descRu: 'Бросай шар в неоновую сетку',
    descEn: 'Drop the orb into neon pegs',
    emoji: '⚡',
    accent: 'from-cyan-400 to-blue-600',
    glow: 'hsl(195 95% 55%)',
    Preview: PlinkoPreview,
  },
  {
    id: 'wheel',
    titleRu: 'Cyber Wheel',
    titleEn: 'Cyber Wheel',
    descRu: 'Колесо удачи в стиле киберпанк',
    descEn: 'Cyberpunk wheel of fortune',
    emoji: '🎡',
    accent: 'from-emerald-400 to-teal-600',
    glow: 'hsl(160 90% 50%)',
    Preview: WheelPreview,
  },
  {
    id: 'crash',
    titleRu: 'Aero Crash',
    titleEn: 'Aero Crash',
    descRu: 'Успей забрать до взрыва ракеты',
    descEn: 'Cash out before the rocket crashes',
    emoji: '🚀',
    accent: 'from-orange-400 to-red-600',
    glow: 'hsl(15 95% 60%)',
    Preview: CrashPreview,
  },
];

export default function Game() {
  const { lang } = useLang();
  const { profile, refreshProfile } = useProfile();
  const [active, setActive] = useState(null);

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (active) {
    const game = GAMES.find((g) => g.id === active);
    const GameComponent = {
      slots: CyberSlots,
      plinko: NeonPlinko,
      wheel: CyberWheel,
      crash: AeroCrash,
    }[active];

    return (
      <div className="px-4 pt-4 pb-28 space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActive(null)}
            className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <h1 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
            <span className="text-2xl">{game.emoji}</span>
            {lang === 'ru' ? game.titleRu : game.titleEn}
          </h1>
          <div className="ml-auto">
            <GemsBadge amount={profile.gems_balance} />
          </div>
        </div>

        <GameComponent profile={profile} refreshProfile={refreshProfile} lang={lang} />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-28 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <span className="text-3xl">🎮</span>
            {lang === 'ru' ? 'Игры' : 'Games'}
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            {lang === 'ru'
              ? 'Играй на GEMS и испытай свою удачу.'
              : 'Play with GEMS and test your luck.'}
          </p>
        </div>
        <GemsBadge amount={profile.gems_balance} />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-heading font-semibold text-neon-cyan"
        style={{
          background: 'rgba(0,229,204,0.12)',
          border: '1px solid rgba(0,229,204,0.3)',
        }}
      >
        <Sparkles className="w-3 h-3" />
        {lang === 'ru' ? 'Выбери мини-игру' : 'Pick a mini-game'}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <AnimatePresence>
          {GAMES.map((g, i) => {
            const Preview = g.Preview;
            return (
              <motion.button
                key={g.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActive(g.id)}
                className="relative aspect-[4/5] rounded-2xl p-3 text-left overflow-hidden flex flex-col"
                style={{
                  background:
                    'linear-gradient(160deg, rgba(22,16,38,0.85) 0%, rgba(8,6,16,0.95) 100%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: `0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 24px ${g.glow}33`,
                }}
              >
                <div
                  className="absolute inset-0 opacity-25 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at top right, ${g.glow}88, transparent 60%)`,
                  }}
                />

                <div className="relative flex items-center justify-between">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg bg-gradient-to-br ${g.accent}`}
                    style={{ boxShadow: `0 0 14px ${g.glow}88` }}
                  >
                    {g.emoji}
                  </div>
                  <span
                    className="text-[9px] uppercase tracking-wider font-heading font-semibold px-1.5 py-0.5 rounded-md"
                    style={{
                      color: g.glow,
                      background: `${g.glow}22`,
                      border: `1px solid ${g.glow}44`,
                    }}
                  >
                    Play
                  </span>
                </div>

                <div className="relative flex-1 my-1 flex items-center justify-center min-h-0">
                  <div className="w-full h-full max-h-[110px] flex items-center justify-center">
                    <Preview />
                  </div>
                </div>

                <div className="relative space-y-0.5">
                  <p className="text-sm font-heading font-bold text-foreground leading-tight">
                    {lang === 'ru' ? g.titleRu : g.titleEn}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {lang === 'ru' ? g.descRu : g.descEn}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

    </div>
  );
}
