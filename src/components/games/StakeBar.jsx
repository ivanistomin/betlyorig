import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';

const PRESETS = [10, 50, 100, 250];

export default function StakeBar({ stake, setStake, max, disabled, lang }) {
  const adjust = (delta) => {
    const next = Math.max(1, Math.min(max, stake + delta));
    setStake(next);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {lang === 'ru' ? 'Ставка' : 'Stake'}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {lang === 'ru' ? 'Баланс' : 'Balance'}: {max.toLocaleString()} 💎
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          disabled={disabled}
          onClick={() => adjust(-10)}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-foreground flex items-center justify-center disabled:opacity-40"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div
          className="flex-1 h-12 rounded-xl flex items-center justify-center font-heading font-bold text-lg text-neon-gold"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,200,80,0.15), rgba(255,80,200,0.08))',
            border: '1px solid rgba(255,200,80,0.3)',
            boxShadow: '0 0 14px rgba(255,200,80,0.18)',
          }}
        >
          💎 {stake}
        </div>
        <button
          disabled={disabled}
          onClick={() => adjust(10)}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-foreground flex items-center justify-center disabled:opacity-40"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-1.5">
        {PRESETS.map((p) => {
          const isOver = p > max;
          return (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={p}
              disabled={disabled || isOver}
              onClick={() => setStake(Math.min(max, p))}
              className={`flex-1 h-8 rounded-lg text-xs font-heading font-semibold border transition-all ${
                stake === p
                  ? 'border-neon-gold/60 bg-neon-gold/10 text-neon-gold'
                  : 'border-white/10 bg-white/5 text-muted-foreground'
              } disabled:opacity-40`}
            >
              {p}
            </motion.button>
          );
        })}
        <motion.button
          whileTap={{ scale: 0.95 }}
          disabled={disabled || max < 1}
          onClick={() => setStake(Math.min(max, Math.max(1, Math.floor(max / 2))))}
          className="flex-1 h-8 rounded-lg text-xs font-heading font-semibold border border-white/10 bg-white/5 text-muted-foreground disabled:opacity-40"
        >
          ½
        </motion.button>
      </div>
    </div>
  );
}
