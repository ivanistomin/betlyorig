
import { db } from '@/api/base44Client';
import { useState } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProfile } from '@/lib/useProfile';
import { useLang } from '@/lib/i18n';
import BetCard from '@/components/bets/BetCard';
import SubmitProofDialog from '@/components/bets/SubmitProofDialog';
import { toast } from 'sonner';

// "Rejected" used to be its own tab, but rejections are now recorded as plain
// losses (stake lost, streak reset). Legacy rows with status='rejected' from
// before the change are still surfaced under the "Lost" tab so users see them.
const STATUS_BY_TAB = {
  active: ['active'],
  pending: ['pending_review'],
  won: ['completed'],
  lost: ['failed', 'rejected'],
};

export default function MyBets() {
  const [tab, setTab] = useState('active');
  const { profile, user, refreshProfile } = useProfile();
  const qc = useQueryClient();
  const [proofTarget, setProofTarget] = useState(null);
  const { lang } = useLang();

  const { data: bets = [], isLoading } = useQuery({
    queryKey: ['my-bets', user?.email, tab],
    queryFn: () => {
      const statuses = STATUS_BY_TAB[tab];
      const sort = tab === 'active' ? '-created_date' : '-updated_date';
      return db.entities.Bet.filter({ user_email: user.email, status: statuses }, sort);
    },
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
    qc.invalidateQueries({ queryKey: ['my-bets'] });
    qc.invalidateQueries({ queryKey: ['active-bets'] });
    qc.invalidateQueries({ queryKey: ['moderation-bets'] });
  };

  const handleFail = async (bet) => {
    if (!profile) return;

    await db.entities.Bet.update(bet.id, { status: 'failed' });

    await db.entities.UserProfile.update(profile.id, {
      total_gems_lost: profile.total_gems_lost + bet.stake_amount,
      bets_lost: profile.bets_lost + 1,
      current_streak: 0,
    });

    toast.error(`-${bet.stake_amount} 💎 ${lang === 'ru' ? 'потеряно. Серия сброшена.' : 'lost. Streak reset.'}`);
    qc.invalidateQueries({ queryKey: ['my-bets'] });
    qc.invalidateQueries({ queryKey: ['active-bets'] });
    refreshProfile();
  };

  const emptyEmoji = {
    active: '🎯',
    pending: '⏳',
    won: '🏆',
    lost: '💔',
  }[tab];
  const emptyLabel = {
    active: lang === 'ru' ? 'Нет активных ставок' : 'No active bets',
    pending: lang === 'ru' ? 'Нет ставок на проверке' : 'Nothing under review',
    won: lang === 'ru' ? 'Побед пока нет' : 'No wins yet',
    lost: lang === 'ru' ? 'Поражений нет — продолжай!' : 'No losses — keep going!',
  }[tab];

  return (
    <div className="px-4 pt-6 space-y-4">
      <h1 className="text-2xl font-heading font-bold text-foreground">
        {lang === 'ru' ? 'Мои ставки' : 'My Bets'}
      </h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full bg-secondary grid grid-cols-4 h-9">
          <TabsTrigger value="active" className="text-[11px] px-1">🎯</TabsTrigger>
          <TabsTrigger value="pending" className="text-[11px] px-1">⏳</TabsTrigger>
          <TabsTrigger value="won" className="text-[11px] px-1">✅</TabsTrigger>
          <TabsTrigger value="lost" className="text-[11px] px-1">❌</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : bets.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-card border border-border/50">
          <span className="text-4xl">{emptyEmoji}</span>
          <p className="text-sm text-muted-foreground mt-2">{emptyLabel}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {bets.map((bet) => (
              <BetCard
                key={bet.id}
                bet={bet}
                onComplete={handleSubmitProof}
                onFail={handleFail}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <SubmitProofDialog
        open={!!proofTarget}
        bet={proofTarget}
        onClose={() => setProofTarget(null)}
        onConfirm={handleProofConfirm}
      />
    </div>
  );
}
