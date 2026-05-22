const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Settings, LogOut, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTelegram } from '@/lib/useTelegram';
import { useProfile } from '@/lib/useProfile';
import { ACHIEVEMENTS } from '@/lib/gameConfig';
import GemsBadge from '@/components/common/GemsBadge';
import LevelProgress from '@/components/common/LevelProgress';
import StatCard from '@/components/common/StatCard';
import { toast } from 'sonner';

const AVATARS = ['🎮', '🚀', '🦊', '🐉', '⚡', '🔥', '💎', '🌟', '🎯', '🏆', '👑', '🦁'];

export default function Profile() {
  const { tgUser } = useTelegram();
  const { profile, user, loading, refreshProfile } = useProfile(tgUser);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');

  const { data: allBets = [] } = useQuery({
    queryKey: ['all-bets-stats', user?.email],
    queryFn: () => db.entities.Bet.filter({ user_email: user.email }),
    enabled: !!user,
  });

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const userAchievements = profile.achievements || [];
  const winRate = (profile.bets_won + profile.bets_lost) > 0
    ? Math.round((profile.bets_won / (profile.bets_won + profile.bets_lost)) * 100)
    : 0;

  const handleSaveProfile = async () => {
    const updates = {};
    if (name.trim()) updates.display_name = name.trim();
    if (avatar) updates.avatar_emoji = avatar;
    if (Object.keys(updates).length) {
      await db.entities.UserProfile.update(profile.id, updates);
      toast.success('Profile updated!');
      refreshProfile();
    }
    setEditOpen(false);
  };

  const openEdit = () => {
    setName(profile.display_name || '');
    setAvatar(profile.avatar_emoji || '🎮');
    setEditOpen(true);
  };

  return (
    <div className="px-4 pt-6 space-y-6 pb-8">
      {/* Profile Header */}
      <div className="text-center space-y-3">
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="relative w-20 h-20 mx-auto"
        >
          {(tgUser?.photoUrl || profile.tg_photo_url) ? (
            <img
              src={tgUser?.photoUrl || profile.tg_photo_url}
              alt={profile.display_name}
              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-primary/50 glow-purple"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-neon-cyan flex items-center justify-center text-4xl glow-purple">
              {profile.avatar_emoji || '🎮'}
            </div>
          )}
        </motion.div>
        <div>
          <h1 className="text-xl font-heading font-bold text-foreground">{profile.display_name || 'Player'}</h1>
          {(tgUser?.username || profile.tg_username) && (
            <p className="text-sm text-primary/70 font-medium">@{tgUser?.username || profile.tg_username}</p>
          )}
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <div className="flex justify-center gap-2">
          <GemsBadge amount={profile.gems_balance} size="lg" />
          <Button variant="ghost" size="icon" onClick={openEdit} className="text-muted-foreground">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Level */}
      <LevelProgress level={profile.level} xp={profile.xp} />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon="🏆" label="Wins" value={profile.bets_won} />
        <StatCard icon="💔" label="Losses" value={profile.bets_lost} />
        <StatCard icon="🔥" label="Best Streak" value={profile.best_streak} />
        <StatCard icon="📈" label="Win Rate" value={`${winRate}%`} />
        <StatCard icon="💎" label="Earned" value={(profile.total_gems_earned || 0).toLocaleString()} />
        <StatCard icon="🔻" label="Lost" value={(profile.total_gems_lost || 0).toLocaleString()} />
      </div>

      {/* Achievements */}
      <div>
        <h2 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-neon-gold" /> Achievements
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = userAchievements.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`rounded-xl p-3 border transition-all ${
                  unlocked
                    ? 'bg-neon-gold/5 border-neon-gold/30'
                    : 'bg-card border-border/30 opacity-40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{ach.emoji}</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{ach.title}</p>
                    <p className="text-[10px] text-muted-foreground">{ach.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Logout */}
      <Button
        variant="ghost"
        className="w-full text-destructive hover:text-destructive"
        onClick={() => db.auth.logout()}
      >
        <LogOut className="w-4 h-4 mr-2" /> Log Out
      </Button>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Display Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Avatar</label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAvatar(a)}
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border transition-all ${
                      avatar === a ? 'border-primary bg-primary/10' : 'border-border bg-secondary'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleSaveProfile} className="w-full bg-primary text-primary-foreground">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}