import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

export default function PlayerRow({ profile, rank, isCurrentUser = false, delay = 0 }) {
  const photoUrl = profile.tg_photo_url;
  const avatar = profile.avatar_emoji || '🎮';
  const name = profile.display_name || 'Player';
  const username = profile.tg_username ? `@${profile.tg_username}` : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        isCurrentUser
          ? 'bg-primary/10 border-primary/30'
          : 'bg-card border-border/50'
      }`}
    >
      {/* Rank */}
      <span className={`w-6 text-center text-sm font-heading font-bold ${
        rank === 1 ? 'text-neon-gold' : rank === 2 ? 'text-slate-400' : rank === 3 ? 'text-amber-600' : 'text-muted-foreground'
      }`}>
        {rank <= 3 ? ['🥇','🥈','🥉'][rank - 1] : rank}
      </span>

      {/* Avatar */}
      {photoUrl ? (
        <img src={photoUrl} alt={name} className="w-9 h-9 rounded-full object-cover ring-1 ring-border" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-lg">
          {avatar}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
          {name} {isCurrentUser && <span className="text-xs font-normal text-muted-foreground">(you)</span>}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {username && <span className="truncate">{username}</span>}
          <span className="flex items-center gap-0.5"><Flame className="w-3 h-3" />{profile.current_streak || 0}</span>
          <span>Lv.{profile.level || 1}</span>
        </div>
      </div>

      {/* Gems */}
      <div className="text-right">
        <span className="text-sm font-heading font-semibold text-neon-gold">
          💎 {(profile.total_gems_earned || 0).toLocaleString()}
        </span>
      </div>
    </motion.div>
  );
}