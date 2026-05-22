const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProfile } from '@/lib/useProfile';
import { calculateReward, getXpForLevel } from '@/lib/gameConfig';
import BetCard from '@/components/bets/BetCard';
import { toast } from 'sonner';

export default function MyBets() {
  const [tab, setTab] = useState('active');
  const { profile, user, refreshProfile } = useProfile();
  const qc = useQueryClient();

  const { data: bets = [], isLoading } = useQuery({
    queryKey: ['my-bets', user?.email, tab],
    queryFn: () => {
      if (tab === 'active') {
        return db.entities.Bet.filter({ user_email: user.email, status: 'active' }, '-created_date');
      } else if (tab === 'won') {
        return db.entities.Bet.filter({ user_email: user.email, status: 'completed' }, '-updated_date');
      } else {
        return db.entities.Bet.filter({ user_email: user.email, status: 'failed' }, '-updated_date');
      }
    },
    enabled: !!user,
  });

  const handleComplete = async (bet) => {
    if (!profile) return;
    const reward = calculateReward(bet.stake_amount, bet.difficulty);
    const newStreak = profile.current_streak + 1;
    const xpGain = Math.floor(bet.stake_amount * 0.5) + 25;
    let newXp = profile.xp + xpGain;
    let newLevel = profile.level;

    while (newXp >= getXpForLevel(newLevel)) {
      newXp -= getXpForLevel(newLevel);
      newLevel++;
    }

    await db.entities.Bet.update(bet.id, {
      status: 'completed',
      reward_amount: reward,
    });

    await db.entities.UserProfile.update(profile.id, {
      gems_balance: profile.gems_balance + reward,
      total_gems_earned: profile.total_gems_earned + reward,
      bets_won: profile.bets_won + 1,
      current_streak: newStreak,
      best_streak: Math.max(profile.best_streak, newStreak),
      xp: newXp,
      level: newLevel,
    });

    toast.success(`+${reward} 💎 earned! Streak: ${newStreak}🔥`);
    qc.invalidateQueries({ queryKey: ['my-bets'] });
    qc.invalidateQueries({ queryKey: ['active-bets'] });
    refreshProfile();
  };

  const handleFail = async (bet) => {
    if (!profile) return;

    await db.entities.Bet.update(bet.id, { status: 'failed' });

    await db.entities.UserProfile.update(profile.id, {
      total_gems_lost: profile.total_gems_lost + bet.stake_amount,
      bets_lost: profile.bets_lost + 1,
      current_streak: 0,
    });

    toast.error(`-${bet.stake_amount} 💎 lost. Streak reset.`);
    qc.invalidateQueries({ queryKey: ['my-bets'] });
    qc.invalidateQueries({ queryKey: ['active-bets'] });
    refreshProfile();
  };

  return (
    <div className="px-4 pt-6 space-y-4">
      <h1 className="text-2xl font-heading font-bold text-foreground">My Bets</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full bg-secondary">
          <TabsTrigger value="active" className="flex-1 text-xs">🎯 Active</TabsTrigger>
          <TabsTrigger value="won" className="flex-1 text-xs">✅ Won</TabsTrigger>
          <TabsTrigger value="lost" className="flex-1 text-xs">❌ Lost</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : bets.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-card border border-border/50">
          <span className="text-4xl">
            {tab === 'active' ? '🎯' : tab === 'won' ? '🏆' : '💔'}
          </span>
          <p className="text-sm text-muted-foreground mt-2">
            {tab === 'active' ? 'No active bets' : tab === 'won' ? 'No wins yet' : 'No losses — keep going!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {bets.map((bet) => (
              <BetCard
                key={bet.id}
                bet={bet}
                onComplete={handleComplete}
                onFail={handleFail}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}