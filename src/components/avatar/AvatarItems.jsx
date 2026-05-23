/* eslint-disable react-refresh/only-export-components */
/*
 * Wearable layer assets. Each item targets exactly ONE slot (`body` or `head`).
 * Items use the same 200x300 viewport as the base characters so they overlay
 * pixel-perfect via absolute positioning.
 *
 * Brand palette:
 *   primary  hsl(265 90% 60%)  — purple
 *   cyan     hsl(180 80% 50%)
 *   gold     hsl(45 95% 55%)
 */

const SVG = {
  viewBox: '0 0 200 300',
  width: '100%',
  height: '100%',
  preserveAspectRatio: 'xMidYMid meet',
  xmlns: 'http://www.w3.org/2000/svg',
};

// ── BODY ──────────────────────────────────────────────────────────────────

function PurpleHoodieSVG() {
  return (
    <svg {...SVG}>
      <defs>
        <linearGradient id="ph-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="hsl(265 90% 60%)" />
          <stop offset="100%" stopColor="hsl(258 70% 35%)" />
        </linearGradient>
      </defs>
      {/* Sleeves */}
      <rect x="44" y="138" width="24" height="74" rx="10" fill="url(#ph-grad)" />
      <rect x="132" y="138" width="24" height="74" rx="10" fill="url(#ph-grad)" />
      {/* Torso */}
      <path d="M58 138 L142 138 L150 230 L50 230 Z" fill="url(#ph-grad)" />
      {/* Hood */}
      <path d="M64 122 Q100 102 136 122 L140 150 L60 150 Z" fill="hsl(265 80% 50%)" />
      {/* Pocket */}
      <rect x="78" y="180" width="44" height="20" rx="6" fill="hsl(258 70% 35%)" opacity="0.7" />
      {/* Drawstrings */}
      <rect x="96" y="142" width="2" height="14" fill="#1a1024" />
      <rect x="102" y="142" width="2" height="14" fill="#1a1024" />
    </svg>
  );
}

function CyanTeeSVG() {
  return (
    <svg {...SVG}>
      <defs>
        <linearGradient id="ct-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="hsl(180 80% 60%)" />
          <stop offset="100%" stopColor="hsl(195 80% 35%)" />
        </linearGradient>
      </defs>
      {/* Sleeves */}
      <path d="M46 142 L66 138 L66 168 L46 172 Z" fill="url(#ct-grad)" />
      <path d="M154 142 L134 138 L134 168 L154 172 Z" fill="url(#ct-grad)" />
      {/* Torso */}
      <path d="M62 138 L138 138 L146 226 L54 226 Z" fill="url(#ct-grad)" />
      {/* Collar */}
      <path d="M86 138 Q100 148 114 138 L112 144 Q100 152 88 144 Z" fill="hsl(195 80% 25%)" />
      {/* Bolt motif (brand) */}
      <path d="M104 168 L92 192 L100 192 L96 210 L112 184 L104 184 Z" fill="hsl(45 95% 55%)" />
    </svg>
  );
}

function GoldJacketSVG() {
  return (
    <svg {...SVG}>
      <defs>
        <linearGradient id="gj-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="hsl(45 95% 60%)" />
          <stop offset="100%" stopColor="hsl(40 80% 32%)" />
        </linearGradient>
      </defs>
      {/* Sleeves */}
      <rect x="44" y="138" width="24" height="74" rx="10" fill="url(#gj-grad)" />
      <rect x="132" y="138" width="24" height="74" rx="10" fill="url(#gj-grad)" />
      {/* Torso */}
      <path d="M58 136 L142 136 L150 230 L50 230 Z" fill="url(#gj-grad)" />
      {/* Lapels */}
      <path d="M86 138 L100 152 L86 200 Z" fill="hsl(40 80% 25%)" />
      <path d="M114 138 L100 152 L114 200 Z" fill="hsl(40 80% 25%)" />
      {/* Zipper */}
      <rect x="99" y="138" width="2" height="92" fill="#1a1024" />
      {/* Brand badge */}
      <circle cx="124" cy="158" r="6" fill="hsl(265 90% 60%)" stroke="#1a1024" strokeWidth="1" />
    </svg>
  );
}

// ── HEAD ──────────────────────────────────────────────────────────────────

function NeonGlassesSVG() {
  return (
    <svg {...SVG}>
      <g>
        {/* Bridge */}
        <line x1="92" y1="86" x2="108" y2="86" stroke="hsl(265 90% 60%)" strokeWidth="3" strokeLinecap="round" />
        {/* Left lens */}
        <rect x="68" y="76" width="26" height="20" rx="4" fill="rgba(0,229,204,0.45)" stroke="hsl(180 80% 50%)" strokeWidth="2.5" />
        {/* Right lens */}
        <rect x="106" y="76" width="26" height="20" rx="4" fill="rgba(0,229,204,0.45)" stroke="hsl(180 80% 50%)" strokeWidth="2.5" />
        {/* Temple tips */}
        <line x1="68" y1="84" x2="56" y2="80" stroke="hsl(180 80% 50%)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="132" y1="84" x2="144" y2="80" stroke="hsl(180 80% 50%)" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function PurpleCapSVG() {
  return (
    <svg {...SVG}>
      <defs>
        <linearGradient id="pc-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="hsl(265 90% 60%)" />
          <stop offset="100%" stopColor="hsl(258 70% 30%)" />
        </linearGradient>
      </defs>
      {/* Crown */}
      <path d="M58 56 Q100 28 142 56 L140 70 Q100 56 60 70 Z" fill="url(#pc-grad)" />
      {/* Visor */}
      <path d="M52 68 Q100 88 148 68 L150 76 Q100 96 50 76 Z" fill="hsl(258 70% 22%)" />
      {/* Button */}
      <circle cx="100" cy="40" r="3" fill="hsl(45 95% 55%)" />
      {/* Brand stripe */}
      <rect x="80" y="50" width="40" height="6" fill="hsl(180 80% 50%)" opacity="0.85" />
    </svg>
  );
}

function HeadphonesSVG() {
  return (
    <svg {...SVG}>
      {/* Band */}
      <path d="M52 70 Q100 30 148 70" stroke="hsl(265 90% 60%)" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M52 70 Q100 30 148 70" stroke="hsl(180 80% 50%)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
      {/* Left cup */}
      <rect x="42" y="62" width="20" height="32" rx="8" fill="#1c1430" stroke="hsl(265 90% 60%)" strokeWidth="2" />
      <circle cx="52" cy="78" r="5" fill="hsl(180 80% 50%)" />
      {/* Right cup */}
      <rect x="138" y="62" width="20" height="32" rx="8" fill="#1c1430" stroke="hsl(265 90% 60%)" strokeWidth="2" />
      <circle cx="148" cy="78" r="5" fill="hsl(180 80% 50%)" />
    </svg>
  );
}

export const ITEMS = {
  // body slot
  hoodie_purple: { id: 'hoodie_purple', slot: 'body', name: 'Худи «Неон»',      nameEn: 'Neon Hoodie',     Component: PurpleHoodieSVG },
  tee_cyan:      { id: 'tee_cyan',      slot: 'body', name: 'Футболка «Болт»',  nameEn: 'Bolt Tee',        Component: CyanTeeSVG       },
  jacket_gold:   { id: 'jacket_gold',   slot: 'body', name: 'Куртка «Золото»',  nameEn: 'Gold Jacket',     Component: GoldJacketSVG    },
  // head slot
  glasses_neon:  { id: 'glasses_neon',  slot: 'head', name: 'Неоновые очки',    nameEn: 'Neon Glasses',    Component: NeonGlassesSVG   },
  cap_purple:    { id: 'cap_purple',    slot: 'head', name: 'Кепка «Бренд»',    nameEn: 'Brand Cap',       Component: PurpleCapSVG     },
  headphones:    { id: 'headphones',    slot: 'head', name: 'Наушники',         nameEn: 'Headphones',      Component: HeadphonesSVG    },
};

export const ITEM_IDS = Object.keys(ITEMS);
export const SLOTS = ['body', 'head'];

export function getItem(id) {
  return ITEMS[id] || null;
}
