// Inline SVG previews shown on the game-selection cards.
// Each preview fills the middle area of a card with a stylized illustration.

export function SlotsPreview() {
  const symbols = ['💎', '⭐', '7️⃣'];
  return (
    <svg viewBox="0 0 160 110" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="slot-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(40,15,80,1)" />
          <stop offset="100%" stopColor="rgba(15,8,35,1)" />
        </linearGradient>
        <filter id="slot-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Cabinet frame */}
      <rect x="6" y="14" width="148" height="82" rx="10"
        fill="url(#slot-bg)"
        stroke="hsl(290 95% 60%)"
        strokeWidth="1.2"
      />

      {/* Three reels */}
      {symbols.map((s, i) => {
        const x = 18 + i * 44;
        return (
          <g key={i}>
            <rect
              x={x}
              y={26}
              width={36}
              height={58}
              rx={6}
              fill="rgba(8,6,16,0.92)"
              stroke="hsl(195 95% 60%)"
              strokeWidth="0.8"
              filter="url(#slot-glow)"
            />
            <text
              x={x + 18}
              y={62}
              textAnchor="middle"
              fontSize="22"
              dominantBaseline="middle"
            >
              {s}
            </text>
          </g>
        );
      })}

      {/* Win light bar */}
      <rect x="14" y="6" width="132" height="6" rx="3"
        fill="hsl(45 95% 60%)"
        opacity="0.85"
        filter="url(#slot-glow)"
      />
      <text x="80" y="104" textAnchor="middle" fontSize="7" fill="hsl(45 95% 60%)" fontWeight="bold"
        style={{ letterSpacing: 2 }}
      >
        JACKPOT
      </text>
    </svg>
  );
}

export function PlinkoPreview() {
  const rows = 5;
  const pegs = [];
  for (let r = 0; r < rows; r++) {
    const count = r + 3;
    const gap = 140 / (count + 1);
    for (let c = 0; c < count; c++) {
      pegs.push({ x: 10 + gap * (c + 1), y: 18 + r * 14 });
    }
  }
  return (
    <svg viewBox="0 0 160 110" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="plinko-ball" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="hsl(195 95% 60%)" />
        </radialGradient>
        <filter id="plinko-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      {/* Pegs */}
      {pegs.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="1.8"
          fill="hsl(265 90% 65%)"
          filter="url(#plinko-glow)"
        />
      ))}

      {/* Ball with trail */}
      <circle cx={80} cy={28} r="1.6" fill="hsl(195 95% 65%)" opacity="0.25" />
      <circle cx={76} cy={40} r="2" fill="hsl(195 95% 65%)" opacity="0.45" />
      <circle cx={82} cy={56} r="3" fill="url(#plinko-ball)" />

      {/* Buckets */}
      {Array.from({ length: 7 }).map((_, i) => {
        const x = 10 + i * 20;
        return (
          <g key={i}>
            <rect
              x={x}
              y={90}
              width={18}
              height={14}
              rx={2}
              fill="rgba(110,60,220,0.3)"
              stroke="hsl(265 85% 65%)"
              strokeWidth="0.6"
            />
            <text
              x={x + 9}
              y={100}
              textAnchor="middle"
              fontSize="6"
              fill="#fff"
              fontWeight="bold"
            >
              ×{[5, 2, 1, 0.5, 1, 2, 5][i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function WheelPreview() {
  const sectors = 8;
  const segAngle = 360 / sectors;
  const colors = [
    'hsl(160 95% 50%)',
    'hsl(280 95% 60%)',
    'hsl(195 95% 55%)',
    'hsl(45 95% 60%)',
    'hsl(160 95% 50%)',
    'hsl(280 95% 60%)',
    'hsl(195 95% 55%)',
    'hsl(0 75% 50%)',
  ];
  return (
    <svg viewBox="-60 -60 120 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="wheel-prev-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(8,6,16,1)" />
          <stop offset="100%" stopColor="rgba(20,10,40,1)" />
        </radialGradient>
        <filter id="wheel-prev-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
      </defs>

      <circle cx="0" cy="0" r="50" fill="url(#wheel-prev-bg)" />
      {Array.from({ length: sectors }).map((_, i) => {
        const start = -90 + i * segAngle;
        const end = start + segAngle;
        const r = 48;
        const sr = (start * Math.PI) / 180;
        const er = (end * Math.PI) / 180;
        const x1 = Math.cos(sr) * r;
        const y1 = Math.sin(sr) * r;
        const x2 = Math.cos(er) * r;
        const y2 = Math.sin(er) * r;
        return (
          <path
            key={i}
            d={`M0,0 L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`}
            fill={colors[i]}
            fillOpacity="0.85"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
            filter="url(#wheel-prev-glow)"
          />
        );
      })}

      <circle cx="0" cy="0" r="12" fill="rgba(8,6,16,0.95)" stroke="hsl(160 95% 50%)" strokeWidth="1" />
      <text
        x="0"
        y="0"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="hsl(160 95% 50%)"
        fontSize="6"
        fontWeight="bold"
      >
        BETLY
      </text>

      {/* Pointer */}
      <polygon
        points="-4,-52 4,-52 0,-44"
        fill="hsl(45 95% 60%)"
        filter="url(#wheel-prev-glow)"
      />
    </svg>
  );
}

export function CrashPreview() {
  return (
    <svg viewBox="0 0 160 110" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="crash-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,140,80,0.4)" />
          <stop offset="100%" stopColor="rgba(255,140,80,0)" />
        </linearGradient>
        <filter id="crash-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>

      {/* Grid lines */}
      {Array.from({ length: 5 }).map((_, i) => (
        <line
          key={`h${i}`}
          x1={0}
          y1={20 + i * 18}
          x2={160}
          y2={20 + i * 18}
          stroke="rgba(0,229,204,0.08)"
          strokeWidth="0.5"
        />
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <line
          key={`v${i}`}
          x1={20 + i * 25}
          y1={0}
          x2={20 + i * 25}
          y2={110}
          stroke="rgba(0,229,204,0.08)"
          strokeWidth="0.5"
        />
      ))}

      {/* Curve fill */}
      <path
        d="M 12 96 Q 60 92 90 70 T 140 18 L 140 96 Z"
        fill="url(#crash-fill)"
      />
      {/* Curve line */}
      <path
        d="M 12 96 Q 60 92 90 70 T 140 18"
        fill="none"
        stroke="hsl(15 95% 60%)"
        strokeWidth="2"
        strokeLinecap="round"
        filter="url(#crash-glow)"
      />

      {/* Rocket */}
      <g transform="translate(140 18) rotate(-45)" filter="url(#crash-glow)">
        <polygon points="0,-8 6,5 -6,5" fill="hsl(15 95% 60%)" />
        <polygon points="-6,5 6,5 4,8 -4,8" fill="hsl(45 95% 60%)" />
      </g>

      {/* Multiplier text */}
      <text
        x="80"
        y="50"
        textAnchor="middle"
        fontSize="22"
        fontWeight="bold"
        fill="hsl(195 95% 65%)"
        filter="url(#crash-glow)"
      >
        ×2.45
      </text>
    </svg>
  );
}
