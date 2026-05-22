const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useProfile } from '@/lib/useProfile';
import { useTelegram } from '@/lib/useTelegram';
import { useLang } from '@/lib/i18n';
import { CATEGORIES, DIFFICULTIES } from '@/lib/gameConfig';
import GemsBadge from '@/components/common/GemsBadge';
import ProofTypeSelector from '@/components/bets/ProofTypeSelector';
import { toast } from 'sonner';
import { addDays } from 'date-fns';

export default function CommunityBets() {
  const { t } = useLang();
  const { tgUser } = useTelegram();
  const { profile, user, refreshProfile } = useProfile(tgUser);
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: 'fitness',
    stake_amount: 100, duration_days: 7, difficulty: 'medium', proof_type: 'any',
  });

  const { data: approved = [], isLoading } = useQuery({
    queryKey: ['community-bets-approved'],
    queryFn: () => db.entities.CommunityBet.filter({ status: 'approved' }),
  });

  const { data: myPending = [] } = useQuery({
    queryKey: ['community-bets-mine', user?.email],
    queryFn: () => db.entities.CommunityBet.filter({ creator_email: user.email, status: 'pending' }),
    enabled: !!user,
  });

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handlePropose = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error(t('lang') === 'ru' ? 'Заполните название и описание' : 'Fill in title and description');
      return;
    }
    setSubmitting(true);
    await db.entities.CommunityBet.create({
      ...form,
      creator_email: user.email,
      creator_tg_id: profile?.tg_id,
      status: 'pending',
      creator_revenue_pct: 10,
    });
    toast.success('✅ Sent for moderation!');
    setShowForm(false);
    qc.invalidateQueries({ queryKey: ['community-bets-mine'] });
    setSubmitting(false);
  };

  const handleJoin = async (cb) => {
    if (!profile || profile.gems_balance < cb.stake_amount) {
      toast.error('Not enough GEMS!');
      return;
    }
    const deadline = addDays(new Date(), cb.duration_days).toISOString();
    await db.entities.Bet.create({
      title: cb.title,
      description: cb.description,
      category: cb.category,
      stake_amount: cb.stake_amount,
      duration_days: cb.duration_days,
      difficulty: cb.difficulty,
      deadline,
      status: 'active',
      user_email: user.email,
    });
    await db.entities.UserProfile.update(profile.id, {
      gems_balance: profile.gems_balance - cb.stake_amount,
    });
    await db.entities.CommunityBet.update(cb.id, {
      participants_count: (cb.participants_count || 0) + 1,
      total_pool: (cb.total_pool || 0) + cb.stake_amount,
    });
    toast.success(`Joined! ${cb.stake_amount} 💎 staked`);
    refreshProfile();
    qc.invalidateQueries({ queryKey: ['community-bets-approved'] });
  };

  return (
    <div className="px-4 pt-6 space-y-5 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">{t('community_bets')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('community_desc')}</p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-primary to-neon-cyan text-white rounded-xl font-heading gap-1.5"
        >
          <Plus className="w-4 h-4" /> {t('propose_bet')}
        </Button>
      </div>

      {/* Propose form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl bg-card border border-primary/30 p-4 space-y-4">
              <h3 className="font-heading font-semibold text-foreground">{t('propose_bet')}</h3>
              <Input placeholder="Challenge title" value={form.title} onChange={e => update('title', e.target.value)}
                className="bg-secondary border-border/50" />
              <Textarea placeholder="Describe rules and what counts as success..." value={form.description}
                onChange={e => update('description', e.target.value)} className="bg-secondary border-border/50 h-20 resize-none" />
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(CATEGORIES).map(([key, cat]) => (
                  <motion.button key={key} whileTap={{ scale: 0.95 }} onClick={() => update('category', key)}
                    className={`rounded-xl p-2 text-center border transition-all ${form.category === key ? 'border-primary bg-primary/10' : 'border-border/50 bg-secondary'}`}>
                    <span className="text-lg">{cat.emoji}</span>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{cat.label}</p>
                  </motion.button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Stake (GEMS)</label>
                  <Input type="number" min={50} value={form.stake_amount} onChange={e => update('stake_amount', Number(e.target.value))}
                    className="bg-secondary border-border/50 mt-1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Duration (days)</label>
                  <Input type="number" min={1} max={90} value={form.duration_days} onChange={e => update('duration_days', Number(e.target.value))}
                    className="bg-secondary border-border/50 mt-1" />
                </div>
              </div>
              <ProofTypeSelector value={form.proof_type} onChange={v => update('proof_type', v)} />
              <div className="p-3 rounded-xl bg-neon-gold/5 border border-neon-gold/20 text-xs text-muted-foreground">
                💰 You'll earn <strong className="text-neon-gold">10%</strong> of every loser's stake in your challenge (after moderation approval).
              </div>
              <Button onClick={handlePropose} disabled={submitting} className="w-full bg-primary text-white font-heading rounded-xl">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : '📤 Submit for Moderation'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending mine */}
      {myPending.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('pending_moderation')}</p>
          {myPending.map(cb => (
            <div key={cb.id} className="rounded-xl bg-neon-gold/5 border border-neon-gold/20 p-3 flex items-center gap-3">
              <Clock className="w-4 h-4 text-neon-gold shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{cb.title}</p>
                <p className="text-xs text-muted-foreground">{t('pending_moderation')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active community bets */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : approved.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-card border border-border/50 space-y-3">
          <span className="text-4xl">🏟️</span>
          <p className="font-heading font-semibold text-foreground">No community bets yet</p>
          <p className="text-sm text-muted-foreground">Be the first to propose a challenge!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {approved.map((cb, i) => {
            const cat = CATEGORIES[cb.category] || CATEGORIES.custom;
            const diff = DIFFICULTIES[cb.difficulty] || DIFFICULTIES.medium;
            return (
              <motion.div
                key={cb.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl bg-card border border-border/50 p-4 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{cat.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-foreground">{cb.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{cb.description}</p>
                  </div>
                  <GemsBadge amount={cb.stake_amount} size="sm" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diff.bgColor} ${diff.color}`}>{diff.label}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> {cb.participants_count || 0} joined</span>
                  <span className="text-xs text-muted-foreground">{cb.duration_days}d</span>
                  <span className="text-xs text-neon-gold">Pool: {(cb.total_pool || 0).toLocaleString()} 💎</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleJoin(cb)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-neon-cyan text-white text-sm font-heading font-semibold"
                >
                  Join Challenge — {cb.stake_amount} 💎
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}