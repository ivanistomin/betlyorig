import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { applyGameResult, validateStake } from './useGameBet';
import StakeBar from './StakeBar';

const SYMBOLS = [
  { id: 'gem', label: '💎', weight: 30, color: 'hsl(195 95% 60%)' },
  { id: 'star', label: '⭐', weight: 26, color: 'hsl(45 95% 60%)' },
  { id: 'fire', label: '🔥', weight: 18, color: 'hsl(15 90% 60%)' },
  { id: 'lightning', label: '⚡', weight: 14, color: 'hsl(280 95% 65%)' },
  { id: 'seven', label: '7️⃣', weight: 8, color: 'hsl(0 90% 60%)' },
  { id: 'crown', label: '👑', weight: 4, color: 'hsl(160 95% 55%)' },
];

const TOTAL_WEIGHT = SYMBOLS.reduce((s, x) => s + x.weight, 0);

function randomSymbol() {
  const r = Math.random() * TOTAL_WEIGHT;
  let acc = 0;
  for (const s of SYMBOLS) {
    acc += s.weight;
    if (r < acc) return s;
  }
  return SYMBOLS[0];
}

// Payouts (multipliers on stake)
const PAYOUTS = {
  gem: 2,
  star: 3,
  fire: 5,
  lightning: 8,
  seven: 25,
  crown: 50,
};

function computePayout(reels, stake) {
  if (reels[0].id === reels[1].id && reels[1].id === reels[2].id) {
    const mult = PAYOUTS[reels[0].id] || 1;
    return { winAmount: Math.round(stake * mult), multiplier: mult, kind: 'jackpot' };
  }
  if (reels[0].id === reels[1].id || reels[1].id === reels[2].id || reels[0].id === reels[2].id) {
    return { winAmount: Math.round(stake * 1.2), multiplier: 1.2, kind: 'pair' };
  }
  return { winAmount: 0, multiplier: 0, kind: 'lose' };
}

function Reel({ symbol, spinning, delay }) {
  return (
    <div
      className="relative w-20 h-24 rounded-xl flex items-center justify-center overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, rgba(15,10,30,0.95), rgba(30,15,50,0.95))',
        border: '2px solid rgba(180,80,255,0.4)',
        boxShadow:
          '0 0 18px rgba(180,80,255,0.45), inset 0 0 12px rgba(0,229,204,0.18)',
      }}
    >
      <AnimatePresence mode="wait">
        {spinning ? (
          <motion.div
            key="spin"
            initial={{ y: -40, opacity: 0 }}
            animate={{
              y: [0, -300, 0, -300, 0, -300, 0],
              opacity: 1,
            }}
            transition={{ duration: 0.8 + delay * 0.2, ease: 'easeInOut' }}
            className="text-5xl"
            style={{ filter: 'blur(2px)' }}
          >
            {SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].label}
          </motion.div>
        ) : (
          <motion.div
            key={symbol.id}
            initial={{ y: 30, opacity: 0, scale: 0.6 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: delay * 0.15, type: 'spring', stiffness: 200 }}
            className="text-5xl"
            style={{
              filter: `drop-shadow(0 0 10px ${symbol.color})`,
            }}
          >
            {symbol.label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CyberSlots({ profile, refreshProfile, lang }) {
  const [stake, setStake] = useState(50);
  const [reels, setReels] = useState([SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [confetti, setConfetti] = useState(false);

  const spin = async () => {
    if (spinning) return;
    if (!validateStake({ profile, stake, lang })) return;

    setSpinning(true);
    setResult(null);
    setConfetti(false);

    const newReels = [randomSymbol(), randomSymbol(), randomSymbol()];
    setTimeout(() => setReels([newReels[0], reels[1], reels[2]]), 700);
    setTimeout(() => setReels([newReels[0], newReels[1], reels[2]]), 1000);
    setTimeout(async () => {
      setReels(newReels);
      setSpinning(false);

      const payout = computePayout(newReels, stake);
      const ok = await applyGameResult({
        profile,
        refreshProfile,
        stake,
        winAmount: payout.winAmount,
        lang,
      });
      if (ok) {
        setResult(payout);
        if (payout.winAmount > 0) {
          setConfetti(true);
          toast.success(
            lang === 'ru'
              ? `Победа! +${payout.winAmount - stake} GEMS`
              : `Win! +${payout.winAmount - stake} GEMS`,
          );
          setTimeout(() => setConfetti(false), 2600);
        }
      }
    }, 1400);
  };

  const max = profile.gems_balance;

  return (
    <div className="space-y-5">
      <div
        className="relative rounded-2xl p-6 overflow-hidden"
        style={{
          background:
            'linear-gradient(160deg, rgba(40,15,80,0.65) 0%, rgba(8,6,16,0.95) 80%)',
          border: '1px solid rgba(180,80,255,0.35)',
          boxShadow:
            '0 0 36px rgba(180,80,255,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at top, rgba(180,80,255,0.5), transparent 60%)',
          }}
        />

        {confetti && <Confetti />}

        <div className="relative flex items-center justify-center gap-3 mb-5">
          {reels.map((sym, i) => (
            <Reel key={i} symbol={sym} spinning={spinning} delay={i} />
          ))}
        </div>

        <div className="relative text-center min-h-[40px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key={result.kind + result.winAmount}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`px-4 py-1.5 rounded-full text-sm font-heading font-bold ${
                  result.winAmount > 0
                    ? 'text-neon-gold bg-neon-gold/10 border border-neon-gold/40'
                    : 'text-destructive bg-destructive/10 border border-destructive/30'
                }`}
              >
                {result.winAmount > 0
                  ? lang === 'ru'
                    ? `+${result.winAmount} 💎  ×${result.multiplier}`
                    : `+${result.winAmount} 💎  ×${result.multiplier}`
                  : lang === 'ru'
                  ? '— Ничего. Крути ещё'
                  : '— Nothing. Try again'}
              </motion.div>
            )}
            {!result && !spinning && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-muted-foreground flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-neon-cyan" />
                {lang === 'ru' ? '3 одинаковых = джекпот' : '3 in a row = jackpot'}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <StakeBar stake={stake} setStake={setStake} max={max} disabled={spinning} lang={lang} />

      <Button
        onClick={spin}
        disabled={spinning || stake > max || stake < 1}
        className="w-full h-12 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-heading font-bold text-base rounded-xl gap-2 disabled:opacity-50"
        style={{ boxShadow: '0 0 22px rgba(180,80,255,0.5)' }}
      >
        <Play className="w-4 h-4" />
        {spinning
          ? lang === 'ru'
            ? 'Крутится...'
            : 'Spinning...'
          : lang === 'ru'
          ? `Крутить за ${stake} 💎`
          : `Spin for ${stake} 💎`}
      </Button>

      <div className="rounded-xl bg-white/5 border border-white/10 p-3">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
          {lang === 'ru' ? 'Выплаты (3 в ряд)' : 'Payouts (3 in a row)'}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {SYMBOLS.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5 text-xs">
              <span className="text-base">{s.label}</span>
              <span className="text-neon-gold font-heading font-semibold">×{PAYOUTS[s.id]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Confetti() {
  const particles = Array.from({ length: 26 });
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((_, i) => {
        const x = Math.random() * 100;
        const dur = 1.4 + Math.random() * 1.2;
        const delay = Math.random() * 0.3;
        const colors = [
          'hsl(45 95% 60%)',
          'hsl(280 95% 65%)',
          'hsl(195 95% 60%)',
          'hsl(160 95% 55%)',
        ];
        const color = colors[i % colors.length];
        return (
          <motion.span
            key={i}
            initial={{ x: `${x}%`, y: '0%', opacity: 1, scale: 1 }}
            animate={{
              y: '120%',
              opacity: 0,
              rotate: Math.random() * 360,
            }}
            transition={{ duration: dur, delay, ease: 'easeIn' }}
            className="absolute top-0 w-1.5 h-3 rounded-sm"
            style={{ background: color, boxShadow: `0 0 6px ${color}` }}
          />
        );
      })}
    </div>
  );
}
