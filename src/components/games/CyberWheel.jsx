import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { applyGameResult, validateStake } from './useGameBet';
import StakeBar from './StakeBar';

// 8 sectors. Tuned for a real house edge — average payout ~0.91x.
const SECTORS = [
  { mult: 0,    color: 'hsl(0 75% 35%)',   label: 'LOSE' },
  { mult: 1.2,  color: 'hsl(195 95% 55%)', label: '×1.2' },
  { mult: 0,    color: 'hsl(0 75% 35%)',   label: 'LOSE' },
  { mult: 0.5,  color: 'hsl(280 95% 60%)', label: '×0.5' },
  { mult: 0.3,  color: 'hsl(220 30% 35%)', label: '×0.3' },
  { mult: 2,    color: 'hsl(160 95% 50%)', label: '×2' },
  { mult: 0,    color: 'hsl(0 75% 35%)',   label: 'LOSE' },
  { mult: 3,    color: 'hsl(45 95% 60%)',  label: '×3' },
];

const SEGMENT_ANGLE = 360 / SECTORS.length;

export default function CyberWheel({ profile, refreshProfile, lang }) {
  const [stake, setStake] = useState(50);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);

  const spin = () => {
    if (spinning) return;
    if (!validateStake({ profile, stake, lang })) return;

    setSpinning(true);
    setResult(null);

    const targetIdx = Math.floor(Math.random() * SECTORS.length);
    const turns = 7 + Math.floor(Math.random() * 3); // 7..9 full rotations
    const sectorCenter = (targetIdx + 0.5) * SEGMENT_ANGLE;
    // Always rotate FORWARD from the current angle — otherwise a small finalAngle
    // can cause the wheel to barely move (or spin backwards) on repeat plays.
    const currentMod = ((rotation % 360) + 360) % 360;
    const targetMod = ((-sectorCenter) % 360 + 360) % 360;
    let deltaToTarget = (targetMod - currentMod + 360) % 360;
    const finalAngle = rotation + turns * 360 + deltaToTarget;
    setRotation(finalAngle);

    setTimeout(async () => {
      const sector = SECTORS[targetIdx];
      const winAmount = Math.round(stake * sector.mult);
      const ok = await applyGameResult({
        profile,
        refreshProfile,
        stake,
        winAmount,
        lang,
      });
      if (ok) {
        setResult({ ...sector, winAmount, index: targetIdx });
        if (winAmount > stake) {
          toast.success(
            lang === 'ru'
              ? `+${winAmount - stake} GEMS (${sector.label})`
              : `+${winAmount - stake} GEMS (${sector.label})`,
          );
        }
      }
      setSpinning(false);
    }, 4700);
  };

  const max = profile.gems_balance;

  return (
    <div className="space-y-5">
      <div
        className="relative rounded-2xl p-6 overflow-hidden"
        style={{
          background:
            'linear-gradient(160deg, rgba(0,40,30,0.55) 0%, rgba(8,6,16,0.95) 80%)',
          border: '1px solid rgba(0,229,180,0.3)',
          boxShadow: '0 0 28px rgba(0,229,180,0.22)',
        }}
      >
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at center, rgba(0,229,180,0.35), transparent 60%)',
          }}
        />

        <div className="relative flex justify-center">
          <div className="relative w-72 h-72">
            {/* Pointer */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -top-1 z-10"
              style={{
                width: 0,
                height: 0,
                borderLeft: '12px solid transparent',
                borderRight: '12px solid transparent',
                borderTop: '20px solid hsl(45 95% 60%)',
                filter: 'drop-shadow(0 0 10px hsl(45 95% 60%))',
              }}
            />
            <motion.div
              animate={{ rotate: rotation }}
              transition={{ duration: 4.5, ease: [0.12, 0.62, 0.18, 1] }}
              className="w-full h-full"
              style={{
                filter: 'drop-shadow(0 0 16px rgba(0,229,180,0.45))',
              }}
            >
              <svg viewBox="-100 -100 200 200" className="w-full h-full">
                <defs>
                  <radialGradient id="wheel-bg" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(8,6,16,1)" />
                    <stop offset="100%" stopColor="rgba(20,10,40,1)" />
                  </radialGradient>
                </defs>
                <circle cx="0" cy="0" r="96" fill="url(#wheel-bg)" />
                {SECTORS.map((s, i) => {
                  // Sectors start at top (-90deg), go clockwise
                  const start = -90 + i * SEGMENT_ANGLE;
                  const end = start + SEGMENT_ANGLE;
                  const r = 92;
                  const startRad = (start * Math.PI) / 180;
                  const endRad = (end * Math.PI) / 180;
                  const x1 = Math.cos(startRad) * r;
                  const y1 = Math.sin(startRad) * r;
                  const x2 = Math.cos(endRad) * r;
                  const y2 = Math.sin(endRad) * r;
                  const path = `M0,0 L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`;
                  const midAngle = start + SEGMENT_ANGLE / 2;
                  const midRad = (midAngle * Math.PI) / 180;
                  const tx = Math.cos(midRad) * 65;
                  const ty = Math.sin(midRad) * 65;
                  return (
                    <g key={i}>
                      <path
                        d={path}
                        fill={s.color}
                        fillOpacity={0.85}
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="0.7"
                      />
                      <text
                        x={tx}
                        y={ty}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${midAngle + 90}, ${tx}, ${ty})`}
                        fill="#fff"
                        fontSize="10"
                        fontWeight="bold"
                        style={{ filter: `drop-shadow(0 0 4px ${s.color})` }}
                      >
                        {s.label}
                      </text>
                    </g>
                  );
                })}
                {/* Center hub */}
                <circle cx="0" cy="0" r="22" fill="rgba(8,6,16,0.95)" stroke="hsl(160 95% 50%)" strokeWidth="1.5" />
                <text
                  x="0"
                  y="0"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="hsl(160 95% 50%)"
                  fontSize="11"
                  fontWeight="bold"
                  style={{ filter: 'drop-shadow(0 0 4px hsl(160 95% 50%))' }}
                >
                  BETLY
                </text>
              </svg>
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-6 bottom-6 rounded-2xl p-4 backdrop-blur-xl flex items-center justify-between"
              style={{
                background: 'rgba(8,6,16,0.7)',
                border: `1px solid ${result.color}`,
                boxShadow: `0 0 22px ${result.color}88`,
              }}
            >
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {lang === 'ru' ? 'Результат' : 'Result'}
                </p>
                <p className="text-lg font-heading font-bold" style={{ color: result.color }}>
                  {result.label}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-xl font-heading font-bold ${
                    result.winAmount > stake
                      ? 'text-neon-gold'
                      : result.winAmount > 0
                      ? 'text-foreground'
                      : 'text-destructive'
                  }`}
                >
                  {result.winAmount > stake
                    ? `+${result.winAmount - stake}`
                    : result.winAmount === stake
                    ? '±0'
                    : `-${stake - result.winAmount}`}{' '}
                  💎
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <StakeBar stake={stake} setStake={setStake} max={max} disabled={spinning} lang={lang} />

      <Button
        onClick={spin}
        disabled={spinning || stake > max || stake < 1}
        className="w-full h-12 bg-gradient-to-r from-emerald-400 to-teal-600 text-white font-heading font-bold text-base rounded-xl gap-2 disabled:opacity-50"
        style={{ boxShadow: '0 0 22px rgba(0,229,180,0.5)' }}
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
    </div>
  );
}
