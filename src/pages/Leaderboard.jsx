
import { db } from '@/api/base44Client';
import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Globe, UserPlus } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProfile } from '@/lib/useProfile';
import { useTelegram } from '@/lib/useTelegram';
import { createTelegramReferralLink } from '@/lib/referrals';
import Podium from '@/components/leaderboard/Podium';
import PlayerRow from '@/components/leaderboard/PlayerRow';

export default function Leaderboard() {
  const [tab, setTab] = useState('global');
  const { tgUser } = useTelegram();
  const { profile } = useProfile(tgUser);

  // Global leaderboard
  const { data: globalProfiles = [], isLoading: globalLoading } = useQuery({
    queryKey: ['leaderboard-global'],
    queryFn: () => db.entities.UserProfile.list('-total_gems_earned', 50),
  });

  // Friends leaderboard — load profiles of tg_friends_ids
  const friendIds = profile?.tg_friends_ids || [];
  const { data: friendProfiles = [], isLoading: friendsLoading } = useQuery({
    queryKey: ['leaderboard-friends', profile?.id, friendIds.join(',')],
    queryFn: async () => {
      if (friendIds.length === 0) return [];
      // Load all profiles and filter by tg_id matching friend ids
      const all = await db.entities.UserProfile.list('-total_gems_earned', 200);
      const myEntry = profile ? [profile] : [];
      const friends = all.filter((p) => friendIds.includes(p.tg_id));
      // Merge current user into friends list and re-sort
      const combined = [...myEntry, ...friends.filter((f) => f.id !== profile?.id)];
      return combined.sort((a, b) => (b.total_gems_earned || 0) - (a.total_gems_earned || 0));
    },
    enabled: tab === 'friends' && !!profile,
  });

  const isLoading = tab === 'global' ? globalLoading : friendsLoading;
  const profiles = tab === 'global' ? globalProfiles : friendProfiles;
  const top3 = profiles.slice(0, 3);
  const rest = profiles.slice(3);
  const myTgId = profile?.tg_id;

  return (
    <div className="px-4 pt-6 space-y-5 pb-6">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-2xl font-heading font-bold text-foreground">Leaderboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Compete. Win. Dominate.</p>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full bg-secondary">
          <TabsTrigger value="global" className="flex-1 gap-1.5 text-xs">
            <Globe className="w-3.5 h-3.5" /> Global
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex-1 gap-1.5 text-xs">
            <Users className="w-3.5 h-3.5" /> Friends
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : profiles.length === 0 ? (
        <EmptyFriends tab={tab} tgUser={tgUser} profile={profile} />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-5"
          >
            {/* Podium */}
            {top3.length > 0 && <Podium top3={top3} />}

            {/* Rest */}
            {rest.length > 0 && (
              <div className="space-y-2">
                {rest.map((p, i) => (
                  <PlayerRow
                    key={p.id}
                    profile={p}
                    rank={i + 4}
                    isCurrentUser={!!myTgId && p.tg_id === myTgId}
                    delay={i * 0.03}
                  />
                ))}
              </div>
            )}

            {/* My rank highlight if not in top list */}
            {profile && myTgId && !profiles.some((p) => p.tg_id === myTgId) && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground text-center">Your position</p>
                <PlayerRow
                  profile={profile}
                  rank={profiles.length + 1}
                  isCurrentUser
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function EmptyFriends({ tab, tgUser, profile }) {
  if (tab === 'friends') {
    const inviteLink = createTelegramReferralLink(profile?.tg_id || 'user');

    const handleInvite = () => {
      const tg = window?.Telegram?.WebApp;
      if (tg) {
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent('Join me on BetYourself — bet on your goals and earn GEMS! 💎🔥')}`);
      } else {
        navigator.clipboard?.writeText(inviteLink);
      }
    };

    return (
      <div className="text-center py-12 rounded-xl bg-card border border-border/50 space-y-4">
        <span className="text-5xl">👥</span>
        <div>
          <p className="font-heading font-semibold text-foreground">No friends yet</p>
          <p className="text-sm text-muted-foreground mt-1">Invite friends to compete together</p>
        </div>
        <button
          onClick={handleInvite}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-neon-cyan text-white font-heading font-semibold text-sm"
        >
          <UserPlus className="w-4 h-4" /> Invite Friends
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <Trophy className="w-12 h-12 text-muted-foreground mx-auto" />
      <p className="text-sm text-muted-foreground mt-3">No players yet. Be the first!</p>
    </div>
  );
}
