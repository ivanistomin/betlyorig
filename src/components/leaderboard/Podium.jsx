import { motion } from 'framer-motion';

// Visual layout: [2nd (left), 1st (CENTER/TOP), 3rd (right)]
const VISUAL = [
  { dataIdx: 1, medal: '🥈', ring: 'ring-primary/50',   avatarSize: 'w-12 h-12', emojiSize: 'text-2xl', nameSize: 'text-xs', platformH: 'h-14', platformGrad: 'from-primary/20 to-primary/5',     platformBorder: 'border-primary/40' },
  { dataIdx: 0, medal: '🥇', ring: 'ring-neon-gold',    avatarSize: 'w-16 h-16', emojiSize: 'text-3xl', nameSize: 'text-sm', platformH: 'h-24', platformGrad: 'from-neon-gold/30 to-neon-gold/5', platformBorder: 'border-neon-gold/60' },
  { dataIdx: 2, medal: '🥉', ring: 'ring-neon-cyan/50', avatarSize: 'w-12 h-12', emojiSize: 'text-2xl', nameSize: 'text-xs', platformH: 'h-10', platformGrad: 'from-neon-cyan/20 to-neon-cyan/5',  platformBorder: 'border-neon-cyan/40' },
];

export default function Podium({ top3 }) {
  return (
    <div className="flex items-end justify-center gap-2 pt-4 pb-1">
      {VISUAL.map(({ dataIdx, medal, ring, avatarSize, emojiSize, nameSize, platformH, platformGrad, platformBorder }) => {
        const p = top3[dataIdx];
        if (!p) return <div key={dataIdx} className="flex-1 max-w-[95px]" />;

        const isFirst = dataIdx === 0;
        const photoUrl = p.tg_photo_url;
        const avatar = p.avatar_emoji || '🎮';

        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: isFirst ? 30 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: dataIdx * 0.1, duration: 0.4 }}
            className="flex flex-col items-center flex-1 max-w-[95px]"
          >
            {/* Medal */}
            <span className="text-lg mb-1">{medal}</span>

            {/* Avatar */}
            <div className={`relative mb-2`}>
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={p.display_name}
                  className={`${avatarSize} rounded-full object-cover ring-2 ${ring}`}
                />
              ) : (
                <div className={`${avatarSize} rounded-full bg-card border-2 ${ring.replace('ring-', 'border-')} flex items-center justify-center`}>
                  <span className={emojiSize}>{avatar}</span>
                </div>
              )}
              {isFirst && (
                <span className="absolute -top-2 -right-1 text-base">👑</span>
              )}
            </div>

            {/* Name */}
            <p className={`font-heading font-semibold text-foreground text-center w-full truncate px-1 ${nameSize}`}>
              {p.display_name || 'Player'}
            </p>
            <span className="text-[11px] text-neon-gold mt-0.5">💎 {(p.total_gems_earned || 0).toLocaleString()}</span>

            {/* Platform block */}
            <div className={`mt-2 rounded-t-lg w-full flex items-center justify-center bg-gradient-to-t ${platformGrad} border-t border-x ${platformBorder} ${platformH}`}>
              <span className="text-xs text-muted-foreground font-heading font-bold">Lv.{p.level || 1}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}