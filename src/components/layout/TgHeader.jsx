import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import GemsBadge from '@/components/common/GemsBadge';
import LangToggle from '@/components/common/LangToggle';

export default function TgHeader({ tgUser, profile }) {
  const displayName = tgUser?.displayName || profile?.display_name || 'Player';
  const username = tgUser?.username ? `@${tgUser.username}` : null;
  const photoUrl = tgUser?.photoUrl || profile?.tg_photo_url;
  const avatarEmoji = profile?.avatar_emoji || '🎮';

  return (
    <div className="flex items-center justify-between px-4 pt-5 pb-3">
      <div className="flex items-center gap-3">
        {/* Avatar — tappable, goes to profile */}
        <Link to="/profile">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={displayName}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-primary/40"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-neon-cyan flex items-center justify-center text-xl ring-2 ring-primary/40">
              {avatarEmoji}
            </div>
          )}
          {/* Online dot */}
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-background" />
        </motion.div>
        </Link>

        {/* Name & username */}
        <motion.div
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <p className="font-heading font-bold text-foreground leading-tight text-base">
            {displayName}
          </p>
          {username && (
            <p className="text-xs text-muted-foreground">{username}</p>
          )}
        </motion.div>
      </div>

      {/* Balance + Lang */}
      <motion.div
        initial={{ x: 10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-2"
      >
        <LangToggle />
        {profile && <GemsBadge amount={profile.gems_balance} size="md" animate />}
      </motion.div>
    </div>
  );
}