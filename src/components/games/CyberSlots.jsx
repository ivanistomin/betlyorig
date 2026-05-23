import { useMemo, useRef, useState } from 'react';
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

const SYMBOL_HEIGHT = 96; // px per symbol cell (matches reel window height)
const STRIP_LEN = 30; // how many symbols in the scrolling strip

function Reel({ target, spinId, durationMs, isLast, onSettle }) {
  // Build a random strip ending with the target symbol on each spin.
  const strip = useMemo(() => {
    if (spinId === 0) return [target];
    const arr = [];
    for (let i = 0; i < STRIP_LEN - 1; i++) {
      arr.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
    }
    arr.push(target);
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinId, target.id]);

  const finalY = -(strip.length - 1) * SYMBOL_HEIGHT;
  const spinning = spinId > 0;

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{
        width: 80,
        height: SYMBOL_HEIGHT,
        background:
          'linear-gradient(180deg, rgba(15,10,30,0.95), rgba(30,15,50,0.95))',
        border: '2px solid rgba(180,80,255,0.4)',
        boxShadow:
          '0 0 18px rgba(180,80,255,0.45), inset 0 0 12px rgba(0,229,204,0.18)',
      }}
    >
      {/* Top / bottom fade so symbols pass through neon haze */}
      <div
        className="absolute inset-x-0 top-0 h-3 z-10 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(15,10,30,1), rgba(15,10,30,0))',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-3 z-10 pointer-events-none"
        style={{
          background:
            'linear-gradient(0deg, rgba(15,10,30,1), rgba(15,10,30,0))',
        }}
      />

      <motion.div
        key={spinId}
        initial={{ y: 0 }}
        animate={{ y: spinning ? finalY : 0 }}
        transition={{
          duration: spinning ? durationMs / 1000 : 0,
          // Sharp acceleration → long decelerating tail, like a real reel braking.
          ease: spinning ? [0.05, 0.65, 0.15, 1] : 'linear',
        }}
        onAnimationComplete={() => {
          if (isLast && spinning) onSettle?.();
        }}
        className="will-change-transform"
      >
        {strip.map((s, i) => {
          const isLanding = i === strip.length - 1 && spinning;
          return (
            <ReelCell key={i} symbol={s} blur={spinning && !isLanding} landing={isLanding} />
          );
        })}
      </motion.div>
    </div>
  );
}

function ReelCell({ symbol, blur, landing }) {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        height: SYMBOL_HEIGHT,
        // Motion blur while flying, sharp + glow on the landed symbol.
        filter: blur
          ? `blur(2.2px) drop-shadow(0 0 6px ${symbol.color}88)`
          : `drop-shadow(0 0 12px ${symbol.color})`,
      }}
    >
      <motion.span
        className="text-5xl select-none"
        animate={landing ? { scale: [0.85, 1.12, 1] } : { scale: 1 }}
        transition={{ duration: 0.45, times: [0, 0.55, 1] }}
      >
        {symbol.label}
      </motion.span>
    </div>
  );
}

export default function CyberSlots({ profile, refreshProfile, lang }) {
  const [stake, setStake] = useState(50);
  const [targets, setTargets] = useState([SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]]);
  const [spinId, setSpinId] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [confetti, setConfetti] = useState(false);
  const pendingRef = useRef(null);

  // Each reel takes longer to stop — cascading deceleration.
  const REEL_DURATIONS = [1800, 2400, 3100];

  const spin = () => {
    if (spinning) return;
    if (!validateStake({ profile, stake, lang })) return;

    const newTargets = [randomSymbol(), randomSymbol(), randomSymbol()];
    pendingRef.current = newTargets;
    setSpinning(true);
    setResult(null);
    setConfetti(false);
    setTargets(newTargets);
    setSpinId((id) => id + 1);
  };

  const handleSettle = async () => {
    const finalReels = pendingRef.current || targets;
    setSpinning(false);
    const payout = computePayout(finalReels, stake);
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
          {targets.map((sym, i) => (
            <Reel
              key={i}
              target={sym}
              spinId={spinId}
              durationMs={REEL_DURATIONS[i]}
              isLast={i === targets.length - 1}
              onSettle={handleSettle}
            />
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
                  ? `+${result.winAmount} 💎  ×${result.multiplier}`
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
