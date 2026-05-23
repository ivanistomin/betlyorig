
import { db } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { useState } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, ChevronRight, Users, Trophy } from 'lucide-react';
import { useTelegram } from '@/lib/useTelegram';
import { useProfile } from '@/lib/useProfile';
import { useLang } from '@/lib/i18n';
import { toast } from 'sonner';
import TgHeader from '@/components/layout/TgHeader';
import StatCard from '@/components/common/StatCard';
import LevelProgress from '@/components/common/LevelProgress';
import BetCard from '@/components/bets/BetCard';
import SubmitProofDialog from '@/components/bets/SubmitProofDialog';

export default function Dashboard() {
  const { tgUser, isReady } = useTelegram();
  const { profile, user, loading: profileLoading, refreshProfile } = useProfile(tgUser);
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const [proofTarget, setProofTarget] = useState(null);

  const { data: activeBets = [], isLoading: betsLoading } = useQuery({
    queryKey: ['active-bets', user?.email],
    queryFn: () => db.entities.Bet.filter({ user_email: user.email, status: 'active' }, '-created_date', 5),
    enabled: !!user,
  });

  const handleSubmitProof = (bet) => setProofTarget(bet);

  const handleProofConfirm = async ({ note, url }) => {
    if (!proofTarget) return;
    await db.entities.Bet.update(proofTarget.id, {
      status: 'pending_review',
      proof_note: note?.trim() || null,
      proof_url: url?.trim() || null,
      proof_submitted_at: new Date().toISOString(),
      rejection_reason: null,
    });
    toast.success(lang === 'ru' ? '📤 Отправлено на проверку (до 12 ч)' : '📤 Sent for review (up to 12h)');
    setProofTarget(null);
    qc.invalidateQueries({ queryKey: ['active-bets'] });
    qc.invalidateQueries({ queryKey: ['my-bets'] });
    qc.invalidateQueries({ queryKey: ['moderation-bets'] });
  };

  const handleFail = async (bet) => {
    if (!profile) return;
    await db.entities.Bet.update(bet.id, { status: 'failed' });
    await db.entities.UserProfile.update(profile.id, {
      total_gems_lost: (profile.total_gems_lost || 0) + bet.stake_amount,
      bets_lost: (profile.bets_lost || 0) + 1,
      current_streak: 0,
    });
    toast.error(`-${bet.stake_amount} 💎 ${lang === 'ru' ? 'потеряно. Серия сброшена.' : 'lost. Streak reset.'}`);
    qc.invalidateQueries({ queryKey: ['active-bets'] });
    qc.invalidateQueries({ queryKey: ['my-bets'] });
    refreshProfile();
  };

  if (!isReady || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const winRate = (profile.bets_won + profile.bets_lost) > 0
    ? Math.round((profile.bets_won / (profile.bets_won + profile.bets_lost)) * 100)
    : 0;

  const MOTIVATION = {
    en: '"Discipline is choosing between what you want now and what you want most."',
    ru: '"Дисциплина — это выбор между тем, что ты хочешь сейчас, и тем, что ты хочешь больше всего."',
  };

  return (
    <div className="space-y-5">
      <TgHeader tgUser={tgUser} profile={profile} />

      <div className="px-4 space-y-5">
        {/* Level Progress + Battle Pass */}
        <Link to="/battle-pass">
          <motion.div whileTap={{ scale: 0.98 }} className="rounded-xl border border-neon-gold/20 bg-card overflow-hidden">
            <div className="px-3 pt-3">
              <LevelProgress level={profile.level} xp={profile.xp} />
            </div>
            <div className="flex items-center justify-between px-3 py-2 mt-1 border-t border-border/30">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-neon-gold" />
                <span className="text-xs font-heading font-semibold text-neon-gold">
                  {lang === 'ru' ? 'Путь Чемпиона' : "Champion's Path"}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>{lang === 'ru' ? 'Смотреть награды' : 'View rewards'}</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </motion.div>
        </Link>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon="🔥"
            label={t('streak')}
            value={profile.current_streak}
            subtext={`${lang === 'ru' ? 'Рекорд' : 'Best'}: ${profile.best_streak}`}
          />
          <StatCard
            icon="📈"
            label={t('win_rate')}
            value={`${winRate}%`}
            subtext={`${profile.bets_won}W / ${profile.bets_lost}L`}
          />
        </div>

        {/* Quick Actions — 2x2 grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* New Bet */}
          <Link to="/new-bet">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="rounded-xl bg-gradient-to-r from-primary to-neon-cyan p-4 flex items-center gap-3 glow-purple"
            >
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-heading font-semibold text-white text-sm">{t('new_bet')}</span>
                <p className="text-xs text-white/70">{t('stake_amount')}</p>
              </div>
            </motion.div>
          </Link>

          {/* My Bets */}
          <Link to="/bets">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="rounded-xl bg-card border border-border/50 p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="font-heading font-semibold text-foreground text-sm">{t('my_bets')}</span>
                <p className="text-xs text-muted-foreground">{activeBets.length} {t('bets').toLowerCase()}</p>
              </div>
            </motion.div>
          </Link>

          {/* Community Bets — spans full width */}
          <Link to="/community" className="col-span-2">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="rounded-xl bg-card border border-neon-cyan/20 p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-neon-cyan/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-neon-cyan" />
              </div>
              <div>
                <span className="font-heading font-semibold text-foreground text-sm">{t('community_bets')}</span>
                <p className="text-xs text-muted-foreground">{t('community_desc').split('.')[0]}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
            </motion.div>
          </Link>
        </div>

        {/* Active Bets */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-foreground">{t('active_bets')}</h2>
            <Link to="/bets" className="text-xs text-primary flex items-center gap-0.5">
              {lang === 'ru' ? 'Все' : 'View all'} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {activeBets.length === 0 ? (
              <div className="text-center py-8 rounded-xl bg-card border border-border/50">
                <span className="text-4xl">🎯</span>
                <p className="text-sm text-muted-foreground mt-2">{t('no_active_bets')}</p>
                <Link to="/new-bet" className="text-primary text-sm font-medium mt-1 inline-block">
                  {t('start_first_bet')} →
                </Link>
              </div>
            ) : (
              <AnimatePresence>
                {activeBets.slice(0, 3).map((bet) => (
                  <BetCard
                    key={bet.id}
                    bet={bet}
                    compact
                    onComplete={handleSubmitProof}
                    onFail={handleFail}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Motivation Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl bg-gradient-to-r from-neon-gold/10 to-neon-gold/5 border border-neon-gold/20 p-4 text-center"
        >
          <p className="text-sm text-neon-gold font-heading font-medium">
            {MOTIVATION[lang] || MOTIVATION.en}
          </p>
        </motion.div>
      </div>

      <SubmitProofDialog
        open={!!proofTarget}
        bet={proofTarget}
        onClose={() => setProofTarget(null)}
        onConfirm={handleProofConfirm}
      />
    </div>
  );
}
