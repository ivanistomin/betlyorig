/* eslint-disable react-refresh/only-export-components */
/*
 * Anthropomorphic, front-facing (анфас) characters for the avatar system.
 * Each character is a self-contained SVG (200x300 viewport) with two arms,
 * two legs and a forward-facing head. Colors lean on the brand palette.
 */

const COMMON_PROPS = {
  viewBox: '0 0 200 300',
  width: '100%',
  height: '100%',
  preserveAspectRatio: 'xMidYMid meet',
  xmlns: 'http://www.w3.org/2000/svg',
};

function Limbs({ skin, skinShade }) {
  return (
    <g>
      {/* Left leg */}
      <rect x="78" y="220" width="18" height="60" rx="9" fill={skin} />
      <rect x="78" y="220" width="18" height="60" rx="9" fill={skinShade} opacity="0.25" />
      {/* Right leg */}
      <rect x="104" y="220" width="18" height="60" rx="9" fill={skin} />
      <rect x="104" y="220" width="18" height="60" rx="9" fill={skinShade} opacity="0.25" />
      {/* Feet */}
      <ellipse cx="86" cy="282" rx="14" ry="6" fill="#1c1530" />
      <ellipse cx="114" cy="282" rx="14" ry="6" fill="#1c1530" />
      {/* Left arm */}
      <rect x="48" y="140" width="16" height="74" rx="8" fill={skin} />
      <rect x="48" y="140" width="16" height="74" rx="8" fill={skinShade} opacity="0.25" />
      {/* Right arm */}
      <rect x="136" y="140" width="16" height="74" rx="8" fill={skin} />
      <rect x="136" y="140" width="16" height="74" rx="8" fill={skinShade} opacity="0.25" />
      {/* Paws */}
      <circle cx="56" cy="218" r="11" fill={skin} />
      <circle cx="144" cy="218" r="11" fill={skin} />
    </g>
  );
}

export function CapybaraSVG() {
  const skin = '#8c6a3f';
  const dark = '#5f4424';
  return (
    <svg {...COMMON_PROPS}>
      <Limbs skin={skin} skinShade={dark} />
      {/* Body */}
      <rect x="60" y="130" width="80" height="100" rx="28" fill={skin} />
      <rect x="60" y="130" width="80" height="100" rx="28" fill={dark} opacity="0.2" />
      {/* Neck */}
      <rect x="86" y="118" width="28" height="20" rx="10" fill={skin} />
      {/* Head — long oval, signature capybara */}
      <ellipse cx="100" cy="86" rx="46" ry="40" fill={skin} />
      <ellipse cx="100" cy="86" rx="46" ry="40" fill={dark} opacity="0.18" />
      {/* Snout */}
      <ellipse cx="100" cy="104" rx="26" ry="14" fill="#a98353" />
      {/* Nostrils */}
      <circle cx="92" cy="103" r="2" fill="#3a2a16" />
      <circle cx="108" cy="103" r="2" fill="#3a2a16" />
      {/* Mouth */}
      <path d="M92 114 Q100 120 108 114" stroke="#3a2a16" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Eyes */}
      <ellipse cx="84" cy="78" rx="6.5" ry="7.5" fill="#ffffff" />
      <ellipse cx="116" cy="78" rx="6.5" ry="7.5" fill="#ffffff" />
      <circle cx="85" cy="80" r="3.5" fill="#1a1024" />
      <circle cx="117" cy="80" r="3.5" fill="#1a1024" />
      <circle cx="86" cy="79" r="1.2" fill="#fff" />
      <circle cx="118" cy="79" r="1.2" fill="#fff" />
      {/* Ears */}
      <ellipse cx="64" cy="58" rx="9" ry="6" fill={dark} transform="rotate(-15 64 58)" />
      <ellipse cx="136" cy="58" rx="9" ry="6" fill={dark} transform="rotate(15 136 58)" />
      <ellipse cx="64" cy="58" rx="4" ry="2.5" fill="#3a2918" transform="rotate(-15 64 58)" />
      <ellipse cx="136" cy="58" rx="4" ry="2.5" fill="#3a2918" transform="rotate(15 136 58)" />
    </svg>
  );
}

export function RaccoonSVG() {
  const skin = '#9ea4b3';
  const dark = '#3a3e4c';
  return (
    <svg {...COMMON_PROPS}>
      <Limbs skin={skin} skinShade={dark} />
      {/* Body */}
      <rect x="60" y="130" width="80" height="100" rx="26" fill={skin} />
      <rect x="60" y="130" width="80" height="100" rx="26" fill="#ffffff" opacity="0.08" />
      {/* Belly stripe */}
      <ellipse cx="100" cy="180" rx="22" ry="34" fill="#cdd3df" opacity="0.85" />
      {/* Head */}
      <ellipse cx="100" cy="82" rx="44" ry="42" fill={skin} />
      {/* Mask */}
      <path d="M58 80 Q70 100 92 96 L92 70 Q70 64 58 80 Z" fill={dark} />
      <path d="M142 80 Q130 100 108 96 L108 70 Q130 64 142 80 Z" fill={dark} />
      <path d="M86 92 Q100 102 114 92 L114 80 Q100 86 86 80 Z" fill={dark} opacity="0.85" />
      {/* Snout */}
      <ellipse cx="100" cy="104" rx="14" ry="9" fill="#e6ebf3" />
      {/* Nose */}
      <ellipse cx="100" cy="100" rx="4.5" ry="3.5" fill="#1a1024" />
      {/* Mouth */}
      <path d="M92 112 Q100 118 108 112" stroke="#1a1024" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Eyes */}
      <circle cx="84" cy="82" r="5" fill="#ffffff" />
      <circle cx="116" cy="82" r="5" fill="#ffffff" />
      <circle cx="84" cy="83" r="3" fill="#1a1024" />
      <circle cx="116" cy="83" r="3" fill="#1a1024" />
      <circle cx="85" cy="82" r="1" fill="#fff" />
      <circle cx="117" cy="82" r="1" fill="#fff" />
      {/* Ears (pointed) */}
      <path d="M58 50 L66 30 L78 56 Z" fill={dark} />
      <path d="M142 50 L134 30 L122 56 Z" fill={dark} />
      <path d="M64 48 L68 38 L74 54 Z" fill="#c2c8d4" />
      <path d="M136 48 L132 38 L126 54 Z" fill="#c2c8d4" />
    </svg>
  );
}

export function MonkeySVG() {
  const skin = '#7a4c2c';
  const dark = '#4a2a14';
  const face = '#e5b58a';
  return (
    <svg {...COMMON_PROPS}>
      <Limbs skin={skin} skinShade={dark} />
      {/* Body */}
      <rect x="60" y="130" width="80" height="100" rx="26" fill={skin} />
      <rect x="60" y="130" width="80" height="100" rx="26" fill={dark} opacity="0.2" />
      {/* Belly */}
      <ellipse cx="100" cy="180" rx="22" ry="34" fill={face} opacity="0.6" />
      {/* Head */}
      <circle cx="100" cy="84" r="44" fill={skin} />
      {/* Face oval (light skin) */}
      <ellipse cx="100" cy="92" rx="30" ry="28" fill={face} />
      {/* Forehead crease */}
      <path d="M84 72 Q100 64 116 72" stroke={dark} strokeWidth="1.6" fill="none" opacity="0.5" />
      {/* Brows */}
      <path d="M76 78 Q84 74 92 78" stroke={dark} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M108 78 Q116 74 124 78" stroke={dark} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Eyes */}
      <ellipse cx="86" cy="88" rx="5" ry="6" fill="#ffffff" />
      <ellipse cx="114" cy="88" rx="5" ry="6" fill="#ffffff" />
      <circle cx="87" cy="90" r="3" fill="#1a1024" />
      <circle cx="115" cy="90" r="3" fill="#1a1024" />
      <circle cx="88" cy="89" r="1" fill="#fff" />
      <circle cx="116" cy="89" r="1" fill="#fff" />
      {/* Nostrils */}
      <ellipse cx="96" cy="104" rx="2" ry="3" fill={dark} />
      <ellipse cx="104" cy="104" rx="2" ry="3" fill={dark} />
      {/* Mouth */}
      <path d="M88 116 Q100 122 112 116" stroke={dark} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* Ears — big round, signature monkey */}
      <circle cx="56" cy="84" r="12" fill={skin} />
      <circle cx="56" cy="84" r="6" fill={face} />
      <circle cx="144" cy="84" r="12" fill={skin} />
      <circle cx="144" cy="84" r="6" fill={face} />
    </svg>
  );
}

export const CHARACTERS = {
  capybara: { id: 'capybara', name: 'Капибара', nameEn: 'Capybara', Component: CapybaraSVG },
  raccoon:  { id: 'raccoon',  name: 'Енот',     nameEn: 'Raccoon',  Component: RaccoonSVG },
  monkey:   { id: 'monkey',   name: 'Обезьяна', nameEn: 'Monkey',   Component: MonkeySVG },
};

export const CHARACTER_IDS = Object.keys(CHARACTERS);
