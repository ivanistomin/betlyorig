import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { applyGameResult, validateStake } from './useGameBet';
import StakeBar from './StakeBar';

const WIDTH = 340;
const HEIGHT = 240;

// Crash point distribution. House edge ~3%.
// Cumulative distribution: probability(crash > x) = 0.97 / x  for x >= 1.
function sampleCrashPoint() {
  // r in (0, 1)
  let r = Math.random();
  if (r === 0) r = 0.0001;
  // 3% instant bust
  if (r < 0.03) return 1.0;
  // Otherwise crashPoint = 0.97 / r — clamped to a sane max for UX
  const p = 0.97 / r;
  return Math.max(1.01, Math.min(50, p));
}

export default function AeroCrash({ profile, refreshProfile, lang }) {
  const canvasRef = useRef(null);
  const [stake, setStake] = useState(50);
  const [phase, setPhase] = useState('idle'); // idle | flying | crashed | cashed
  const [multiplier, setMultiplier] = useState(1.0);
  const [history, setHistory] = useState([]); // array of past crash points
  const [result, setResult] = useState(null);

  const stateRef = useRef({
    crashPoint: 0,
    startTime: 0,
    cashedAt: null,
    raf: 0,
    history: [],
  });

  const draw = (mult, exploded) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // BG
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, 'rgba(20,8,40,1)');
    grad.addColorStop(1, 'rgba(8,6,16,1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Dynamic grid (scales with multiplier)
    const scale = 1 + (mult - 1) * 0.06;
    ctx.strokeStyle = 'rgba(0,229,204,0.08)';
    ctx.lineWidth = 1;
    const gridSize = Math.max(14, 30 / scale);
    for (let x = 0; x <= WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
      ctx.stroke();
    }

    // Compute curve. The graph rises with multiplier, mapped to right & up.
    const padX = 20;
    const padY = 20;
    const usableW = WIDTH - padX * 2;
    const usableH = HEIGHT - padY * 2;
    const elapsedM = Math.min(mult, 12); // visual cap
    // X progresses with time (mult roughly exp), Y with multiplier
    const tFrac = Math.min(1, Math.log(mult) / Math.log(12));
    const endX = padX + tFrac * usableW;
    const endY = HEIGHT - padY - tFrac * usableH;

    // Draw curve as ease curve
    const points = 30;
    ctx.beginPath();
    ctx.moveTo(padX, HEIGHT - padY);
    for (let i = 1; i <= points; i++) {
      const f = i / points;
      const ax = padX + f * (endX - padX);
      const ay = HEIGHT - padY - Math.pow(f, 1.6) * (HEIGHT - padY - endY);
      ctx.lineTo(ax, ay);
    }
    const curveColor = exploded ? 'hsl(15 95% 60%)' : 'hsl(195 95% 60%)';
    ctx.strokeStyle = curveColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = curveColor;
    ctx.shadowBlur = 14;
    ctx.stroke();

    // Fill under curve
    ctx.lineTo(endX, HEIGHT - padY);
    ctx.lineTo(padX, HEIGHT - padY);
    ctx.fillStyle = exploded ? 'rgba(255,80,40,0.15)' : 'rgba(0,180,255,0.13)';
    ctx.fill();
    ctx.shadowBlur = 0;

    // Rocket / explosion
    if (exploded) {
      const flashColor = 'hsl(15 95% 60%)';
      ctx.fillStyle = flashColor;
      ctx.shadowColor = flashColor;
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(endX, endY, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Star burst
      ctx.strokeStyle = flashColor;
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(endX + Math.cos(a) * 10, endY + Math.sin(a) * 10);
        ctx.lineTo(endX + Math.cos(a) * 26, endY + Math.sin(a) * 26);
        ctx.stroke();
      }
    } else {
      // Rocket triangle
      ctx.save();
      ctx.translate(endX, endY);
      ctx.rotate(-Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(7, 6);
      ctx.lineTo(-7, 6);
      ctx.closePath();
      ctx.fillStyle = 'hsl(195 95% 65%)';
      ctx.shadowColor = 'hsl(195 95% 60%)';
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.restore();
      ctx.shadowBlur = 0;
    }
  };

  useEffect(() => {
    draw(1, false);
  }, []);

  const start = () => {
    if (phase === 'flying') return;
    if (!validateStake({ profile, stake, lang })) return;

    stateRef.current.crashPoint = sampleCrashPoint();
    stateRef.current.startTime = performance.now();
    stateRef.current.cashedAt = null;

    setMultiplier(1.0);
    setResult(null);
    setPhase('flying');

    const loop = () => {
      const elapsed = (performance.now() - stateRef.current.startTime) / 1000;
      // Multiplier grows exponentially: m(t) = e^(0.55 * t)
      const m = Math.exp(0.55 * elapsed);
      const crashed = m >= stateRef.current.crashPoint;

      if (crashed) {
        const finalMult = stateRef.current.crashPoint;
        setMultiplier(finalMult);
        draw(finalMult, true);
        const cashedAt = stateRef.current.cashedAt;
        const win = cashedAt && cashedAt < finalMult;
        const winAmount = win ? Math.round(stake * cashedAt) : 0;
        applyGameResult({ profile, refreshProfile, stake, winAmount, lang }).then((ok) => {
          if (ok) {
            setResult({
              crashedAt: finalMult,
              cashedAt: cashedAt,
              winAmount,
              win,
            });
            setHistory((h) => [finalMult, ...h].slice(0, 6));
            if (win) {
              toast.success(
                lang === 'ru'
                  ? `Забрал на ×${cashedAt.toFixed(2)}: +${winAmount - stake} GEMS`
                  : `Cashed at ×${cashedAt.toFixed(2)}: +${winAmount - stake} GEMS`,
              );
            }
          }
          setPhase(win ? 'cashed' : 'crashed');
        });
        return;
      }

      setMultiplier(m);
      draw(m, false);
      stateRef.current.raf = requestAnimationFrame(loop);
    };

    stateRef.current.raf = requestAnimationFrame(loop);
  };

  const cashOut = () => {
    if (phase !== 'flying' || stateRef.current.cashedAt) return;
    stateRef.current.cashedAt = multiplier;
  };

  useEffect(() => {
    return () => cancelAnimationFrame(stateRef.current.raf);
  }, []);

  const max = profile.gems_balance;
  const isFlying = phase === 'flying';
  const hasCashed = !!stateRef.current.cashedAt;

  return (
    <div className="space-y-5">
      <div
        className="relative rounded-2xl p-3 mx-auto"
        style={{
          background:
            'linear-gradient(160deg, rgba(40,15,80,0.45) 0%, rgba(8,6,16,0.95) 80%)',
          border: '1px solid rgba(255,140,80,0.3)',
          boxShadow: '0 0 28px rgba(255,140,80,0.2)',
          width: 'fit-content',
        }}
      >
        <canvas ref={canvasRef} className="rounded-xl" />

        {/* Live multiplier overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            key={phase}
            initial={{ scale: 0.85, opacity: 0.5 }}
            animate={{
              scale: phase === 'crashed' ? 1.1 : 1,
              opacity: 1,
            }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            className="font-heading font-black text-5xl"
            style={{
              color:
                phase === 'crashed'
                  ? 'hsl(15 95% 60%)'
                  : phase === 'cashed'
                  ? 'hsl(160 95% 55%)'
                  : 'hsl(195 95% 65%)',
              textShadow:
                phase === 'crashed'
                  ? '0 0 20px hsl(15 95% 60%)'
                  : '0 0 20px hsl(195 95% 60%)',
            }}
          >
            ×{multiplier.toFixed(2)}
          </motion.div>
        </div>
      </div>

      {history.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {history.map((h, i) => (
            <span
              key={i}
              className={`shrink-0 px-2 py-1 rounded-md text-[11px] font-heading font-semibold ${
                h >= 2
                  ? 'bg-neon-gold/10 text-neon-gold border border-neon-gold/30'
                  : 'bg-destructive/10 text-destructive border border-destructive/30'
              }`}
            >
              ×{h.toFixed(2)}
            </span>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.crashedAt + ':' + result.winAmount}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`px-4 py-2 rounded-xl text-center font-heading font-bold text-sm ${
              result.win
                ? 'text-neon-gold bg-neon-gold/10 border border-neon-gold/40'
                : 'text-destructive bg-destructive/10 border border-destructive/30'
            }`}
          >
            {result.win
              ? lang === 'ru'
                ? `Забрал на ×${result.cashedAt.toFixed(2)} — +${result.winAmount - stake} 💎`
                : `Cashed at ×${result.cashedAt.toFixed(2)} — +${result.winAmount - stake} 💎`
              : lang === 'ru'
              ? `Сгорело на ×${result.crashedAt.toFixed(2)} — -${stake} 💎`
              : `Crashed at ×${result.crashedAt.toFixed(2)} — -${stake} 💎`}
          </motion.div>
        )}
      </AnimatePresence>

      <StakeBar stake={stake} setStake={setStake} max={max} disabled={isFlying} lang={lang} />

      {!isFlying ? (
        <Button
          onClick={start}
          disabled={stake > max || stake < 1}
          className="w-full h-12 bg-gradient-to-r from-orange-400 to-red-600 text-white font-heading font-bold text-base rounded-xl gap-2 disabled:opacity-50"
          style={{ boxShadow: '0 0 22px rgba(255,100,60,0.5)' }}
        >
          <Rocket className="w-4 h-4" />
          {lang === 'ru' ? `Старт за ${stake} 💎` : `Launch for ${stake} 💎`}
        </Button>
      ) : (
        <Button
          onClick={cashOut}
          disabled={hasCashed}
          className="w-full h-12 bg-gradient-to-r from-emerald-400 to-teal-600 text-white font-heading font-bold text-base rounded-xl gap-2 disabled:opacity-60"
          style={{ boxShadow: '0 0 22px rgba(0,229,180,0.55)' }}
        >
          <Play className="w-4 h-4" />
          {hasCashed
            ? lang === 'ru'
              ? `Забрал ×${stateRef.current.cashedAt.toFixed(2)}`
              : `Cashed ×${stateRef.current.cashedAt.toFixed(2)}`
            : lang === 'ru'
            ? `Забрать ×${multiplier.toFixed(2)}`
            : `Cash Out ×${multiplier.toFixed(2)}`}
        </Button>
      )}
    </div>
  );
}
