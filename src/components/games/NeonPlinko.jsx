import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { applyGameResult, validateStake } from './useGameBet';
import StakeBar from './StakeBar';

// 10 rows of pegs, 11 buckets at the bottom — more bounces, longer fall.
const ROWS = 10;
// Bucket multipliers — edges pay more, center pays less; tuned to ~7% house edge.
const MULTIPLIERS = [15, 4, 2, 1.2, 0.7, 0.3, 0.7, 1.2, 2, 4, 15];

const WIDTH = 320;
const HEIGHT = 440;
const PEG_RADIUS = 3.5;
const BALL_RADIUS = 7;

// Uniform colors — every bucket uses the same purple, every number is white.
const BUCKET_FILL = 'rgba(110, 60, 220, 0.25)';
const BUCKET_STROKE = 'hsl(265 85% 65%)';
const BUCKET_TEXT = '#ffffff';

function buildPegs() {
  const pegs = [];
  const topPad = 40;
  const rowGap = (HEIGHT - topPad - 80) / ROWS;
  for (let r = 0; r < ROWS; r++) {
    const count = r + 3;
    const colGap = WIDTH / (count + 1);
    const y = topPad + r * rowGap;
    for (let c = 0; c < count; c++) {
      pegs.push({ x: colGap * (c + 1), y });
    }
  }
  return pegs;
}

const PEGS = buildPegs();

export default function NeonPlinko({ profile, refreshProfile, lang }) {
  const canvasRef = useRef(null);
  const [stake, setStake] = useState(50);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);
  const [hitPegs, setHitPegs] = useState({});
  const hitPegsRef = useRef({});

  const draw = (ballPos, hits) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, 'rgba(10,6,30,1)');
    grad.addColorStop(1, 'rgba(8,6,16,1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Subtle grid
    ctx.strokeStyle = 'rgba(0,229,204,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= WIDTH; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }

    // Pegs
    const now = performance.now();
    PEGS.forEach((p, idx) => {
      const hitAt = hits[idx];
      const sinceHit = hitAt ? now - hitAt : Infinity;
      const glow = sinceHit < 220 ? 1 - sinceHit / 220 : 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, PEG_RADIUS + glow * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = glow > 0 ? `rgba(0,229,204,${0.4 + glow * 0.6})` : 'rgba(180,80,255,0.85)';
      ctx.shadowColor = glow > 0 ? 'rgba(0,229,204,0.9)' : 'rgba(180,80,255,0.6)';
      ctx.shadowBlur = 8 + glow * 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Buckets — uniform color, uniform white text.
    const bucketWidth = WIDTH / MULTIPLIERS.length;
    const bucketY = HEIGHT - 50;
    MULTIPLIERS.forEach((m, i) => {
      const x = i * bucketWidth;
      ctx.fillStyle = BUCKET_FILL;
      ctx.strokeStyle = BUCKET_STROKE;
      ctx.lineWidth = 1;
      ctx.fillRect(x + 2, bucketY, bucketWidth - 4, 40);
      ctx.strokeRect(x + 2, bucketY, bucketWidth - 4, 40);
      ctx.fillStyle = BUCKET_TEXT;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = BUCKET_STROKE;
      ctx.shadowBlur = 6;
      ctx.fillText(`×${m}`, x + bucketWidth / 2, bucketY + 25);
      ctx.shadowBlur = 0;
    });

    // Ball with trail
    if (ballPos) {
      ballPos.trail?.forEach((t, i) => {
        const a = (i + 1) / (ballPos.trail.length + 1);
        ctx.beginPath();
        ctx.arc(t.x, t.y, BALL_RADIUS * a, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,229,204,${a * 0.45})`;
        ctx.fill();
      });
      ctx.beginPath();
      ctx.arc(ballPos.x, ballPos.y, BALL_RADIUS, 0, Math.PI * 2);
      const ballGrad = ctx.createRadialGradient(
        ballPos.x - 2,
        ballPos.y - 2,
        1,
        ballPos.x,
        ballPos.y,
        BALL_RADIUS,
      );
      ballGrad.addColorStop(0, '#ffffff');
      ballGrad.addColorStop(1, 'hsl(195 95% 55%)');
      ctx.fillStyle = ballGrad;
      ctx.shadowColor = 'hsl(195 95% 60%)';
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  };

  useEffect(() => {
    draw(null, hitPegsRef.current);
  }, []);

  const drop = async () => {
    if (playing) return;
    if (!validateStake({ profile, stake, lang })) return;

    setPlaying(true);
    setResult(null);
    hitPegsRef.current = {};
    setHitPegs({});

    let x = WIDTH / 2 + (Math.random() - 0.5) * 12;
    let y = 10;
    let vx = (Math.random() - 0.5) * 0.35;
    let vy = 0;
    const gravity = 0.085;
    const damping = 0.62;
    const airFriction = 0.992;
    const trail = [];

    const bucketY = HEIGHT - 50;

    const step = () => {
      vy += gravity;
      vx *= airFriction;
      vy *= airFriction;
      x += vx;
      y += vy;

      // Collide with pegs
      for (let i = 0; i < PEGS.length; i++) {
        const p = PEGS[i];
        const dx = x - p.x;
        const dy = y - p.y;
        const dist = Math.hypot(dx, dy);
        const minDist = PEG_RADIUS + BALL_RADIUS;
        if (dist < minDist && dist > 0.0001) {
          const nx = dx / dist;
          const ny = dy / dist;
          x = p.x + nx * minDist;
          y = p.y + ny * minDist;
          const dot = vx * nx + vy * ny;
          vx = (vx - 2 * dot * nx) * damping + (Math.random() - 0.5) * 0.35;
          vy = (vy - 2 * dot * ny) * damping;
          hitPegsRef.current[i] = performance.now();
        }
      }

      // Walls
      if (x < BALL_RADIUS) {
        x = BALL_RADIUS;
        vx = Math.abs(vx) * damping;
      }
      if (x > WIDTH - BALL_RADIUS) {
        x = WIDTH - BALL_RADIUS;
        vx = -Math.abs(vx) * damping;
      }

      trail.push({ x, y });
      if (trail.length > 8) trail.shift();

      draw({ x, y, trail }, hitPegsRef.current);
      setHitPegs({ ...hitPegsRef.current });

      if (y >= bucketY + 15) {
        // Determine bucket
        const bucketWidth = WIDTH / MULTIPLIERS.length;
        const idx = Math.min(MULTIPLIERS.length - 1, Math.max(0, Math.floor(x / bucketWidth)));
        const mult = MULTIPLIERS[idx];
        const winAmount = Math.round(stake * mult);

        applyGameResult({ profile, refreshProfile, stake, winAmount, lang }).then((ok) => {
          if (ok) {
            setResult({ multiplier: mult, winAmount, bucket: idx });
            if (winAmount > stake) {
              toast.success(
                lang === 'ru'
                  ? `Победа! +${winAmount - stake} GEMS (×${mult})`
                  : `Win! +${winAmount - stake} GEMS (×${mult})`,
              );
            }
          }
          setPlaying(false);
        });
        return;
      }

      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  const max = profile.gems_balance;

  return (
    <div className="space-y-5">
      <div
        className="relative rounded-2xl p-3 mx-auto"
        style={{
          background:
            'linear-gradient(160deg, rgba(20,10,50,0.55) 0%, rgba(8,6,16,0.95) 80%)',
          border: '1px solid rgba(0,229,204,0.3)',
          boxShadow: '0 0 28px rgba(0,229,204,0.2)',
          width: 'fit-content',
        }}
      >
        <canvas ref={canvasRef} className="rounded-xl" />
      </div>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.bucket + ':' + result.winAmount}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-center px-4 py-2 rounded-xl font-heading font-bold text-sm ${
              result.winAmount > stake
                ? 'text-neon-gold bg-neon-gold/10 border border-neon-gold/40'
                : result.winAmount === stake
                ? 'text-foreground bg-white/5 border border-white/10'
                : 'text-destructive bg-destructive/10 border border-destructive/30'
            }`}
          >
            {result.winAmount > stake
              ? lang === 'ru'
                ? `+${result.winAmount - stake} 💎  (×${result.multiplier})`
                : `+${result.winAmount - stake} 💎  (×${result.multiplier})`
              : result.winAmount === stake
              ? lang === 'ru'
                ? 'Ничья — вернули ставку'
                : 'Tie — stake returned'
              : lang === 'ru'
              ? `-${stake - result.winAmount} 💎  (×${result.multiplier})`
              : `-${stake - result.winAmount} 💎  (×${result.multiplier})`}
          </motion.div>
        )}
      </AnimatePresence>

      <StakeBar stake={stake} setStake={setStake} max={max} disabled={playing} lang={lang} />

      <Button
        onClick={drop}
        disabled={playing || stake > max || stake < 1}
        className="w-full h-12 bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-heading font-bold text-base rounded-xl gap-2 disabled:opacity-50"
        style={{ boxShadow: '0 0 22px rgba(0,180,255,0.5)' }}
      >
        <Play className="w-4 h-4" />
        {playing
          ? lang === 'ru'
            ? 'Падает...'
            : 'Dropping...'
          : lang === 'ru'
          ? `Бросить за ${stake} 💎`
          : `Drop for ${stake} 💎`}
      </Button>
    </div>
  );
}
