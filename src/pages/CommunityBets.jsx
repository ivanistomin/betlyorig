
import { db } from '@/api/base44Client';
import { useState } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Clock, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useProfile } from '@/lib/useProfile';
import { useTelegram } from '@/lib/useTelegram';
import { useLang } from '@/lib/i18n';
import {
  CATEGORIES,
  DIFFICULTIES,
  PROOF_MULTIPLIERS,
  getAllowedProofTypes,
  normalizeProofType,
} from '@/lib/gameConfig';
import GemsBadge from '@/components/common/GemsBadge';
import { toast } from 'sonner';
import { addDays } from 'date-fns';

// Community bets are 100% user-authored. There are no presets — the whole
// point of this section is that members invent their own challenges and submit
// them for moderation. The form below is the only way a community bet is
// created.
export default function CommunityBets() {
  const { t, lang } = useLang();
  const { tgUser } = useTelegram();
  const { profile, user, refreshProfile } = useProfile(tgUser);
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'custom',
    stake_amount: 100,
    duration_days: 7,
    difficulty: 'medium',
    proof_type: 'photo',
  });

  const allowedProofTypes = getAllowedProofTypes(form.category);

  const { data: approved = [], isLoading } = useQuery({
    queryKey: ['community-bets-approved'],
    queryFn: () => db.entities.CommunityBet.filter({ status: 'approved' }),
  });

  const { data: myPending = [] } = useQuery({
    queryKey: ['community-bets-mine', user?.email],
    queryFn: () =>
      db.entities.CommunityBet.filter({ creator_email: user.email, status: 'pending' }),
    enabled: !!user,
  });

  const update = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      category: 'custom',
      stake_amount: 100,
      duration_days: 7,
      difficulty: 'medium',
      proof_type: 'photo',
    });
  };

  const handlePropose = async () => {
    const title = form.title.trim();
    const description = form.description.trim();
    if (title.length < 8 || description.length < 20) {
      toast.error(
        lang === 'ru'
          ? 'Название (мин 8 символов) и подробные правила (мин 20 символов) обязательны.'
          : 'Title (min 8 chars) and detailed rules (min 20 chars) are required.',
      );
      return;
    }
    if (form.stake_amount < 50) {
      toast.error(lang === 'ru' ? 'Минимальная ставка — 50 GEMS' : 'Minimum stake is 50 GEMS');
      return;
    }

    setSubmitting(true);
    try {
      await db.entities.CommunityBet.create({
        ...form,
        title,
        description,
        creator_email: user.email,
        creator_tg_id: profile?.tg_id,
        status: 'pending',
        creator_revenue_pct: 10,
      });
      toast.success(
        lang === 'ru' ? '✅ Ставка отправлена на модерацию!' : '✅ Bet sent for moderation!',
      );
      setShowForm(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['community-bets-mine'] });
    } catch (e) {
      toast.error(e.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (cb) => {
    if (!profile || profile.gems_balance < cb.stake_amount) {
      toast.error(lang === 'ru' ? 'Недостаточно GEMS!' : 'Not enough GEMS!');
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
      proof_type: cb.proof_type || 'photo',
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
    toast.success(
      lang === 'ru'
        ? `Присоединились! ${cb.stake_amount} 💎 поставлено`
        : `Joined! ${cb.stake_amount} 💎 staked`,
    );
    refreshProfile();
    qc.invalidateQueries({ queryKey: ['community-bets-approved'] });
  };

  return (
    <div className="px-4 pt-6 space-y-5 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            {t('community_bets')}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lang === 'ru'
              ? 'Только пользовательские челленджи. Придумай свой и брось вызов другим.'
              : 'User-invented challenges only. Make yours and challenge others.'}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm((s) => !s)}
          className="bg-gradient-to-r from-primary to-neon-cyan text-white rounded-xl font-heading gap-1.5"
        >
          <Plus className="w-4 h-4" /> {t('propose_bet')}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl bg-card border border-primary/30 p-4 space-y-4">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-neon-gold mt-0.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {lang === 'ru'
                    ? 'Опиши свой собственный челлендж — никаких готовых шаблонов. Чем подробнее правила, тем выше шанс одобрения.'
                    : 'Describe your very own challenge — no presets here. The more detailed the rules, the higher the chance it gets approved.'}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  {lang === 'ru' ? 'Название челленджа' : 'Challenge title'}
                </label>
                <Input
                  placeholder={
                    lang === 'ru' ? 'напр. «7 дней без сахара»' : 'e.g. "7 days without sugar"'
                  }
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  className="bg-secondary border-border/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  {lang === 'ru' ? 'Правила и условия победы' : 'Rules & winning conditions'}
                </label>
                <Textarea
                  placeholder={
                    lang === 'ru'
                      ? 'Что считается выполнением? Что нужно прикрепить как доказательство? Какие исключения?'
                      : 'What counts as completion? What proof must be attached? Any exceptions?'
                  }
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  className="bg-secondary border-border/50 h-24 resize-none"
                  maxLength={1000}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  {lang === 'ru' ? 'Категория' : 'Category'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <motion.button
                      key={key}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          category: key,
                          proof_type: normalizeProofType(key, p.proof_type),
                        }))
                      }
                      className={`rounded-xl p-2 text-center border transition-all ${
                        form.category === key
                          ? 'border-primary bg-primary/10'
                          : 'border-border/50 bg-secondary'
                      }`}
                    >
                      <span className="text-lg">{cat.emoji}</span>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {lang === 'ru' ? cat.labelRu : cat.label}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">
                    {lang === 'ru' ? 'Ставка (GEMS)' : 'Stake (GEMS)'}
                  </label>
                  <Input
                    type="number"
                    min={50}
                    value={form.stake_amount}
                    onChange={(e) => update('stake_amount', Number(e.target.value))}
                    className="bg-secondary border-border/50 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    {lang === 'ru' ? 'Срок (дн.)' : 'Duration (days)'}
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={90}
                    value={form.duration_days}
                    onChange={(e) => update('duration_days', Number(e.target.value))}
                    className="bg-secondary border-border/50 mt-1"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  {lang === 'ru' ? 'Тип доказательства' : 'Proof type'}
                </label>
                <div
                  className={`grid gap-2 ${
                    allowedProofTypes.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
                  }`}
                >
                  {allowedProofTypes.map((key) => {
                    const pm = PROOF_MULTIPLIERS[key];
                    if (!pm) return null;
                    return (
                      <motion.button
                        key={key}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => update('proof_type', key)}
                        className={`rounded-xl p-2 text-center border transition-all ${
                          form.proof_type === key
                            ? 'border-neon-cyan bg-neon-cyan/10'
                            : 'border-border/50 bg-secondary'
                        }`}
                      >
                        <p
                          className={`text-xs font-medium ${
                            form.proof_type === key ? 'text-neon-cyan' : 'text-foreground'
                          }`}
                        >
                          {lang === 'ru' ? pm.labelRu : pm.labelEn}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neon-gold/5 border border-neon-gold/20 text-xs text-muted-foreground">
                💰{' '}
                {lang === 'ru' ? (
                  <>
                    Ты получишь <strong className="text-neon-gold">10%</strong> от ставок
                    проигравших участников после одобрения модератором.
                  </>
                ) : (
                  <>
                    You'll earn <strong className="text-neon-gold">10%</strong> of every
                    loser's stake once the moderator approves the bet.
                  </>
                )}
              </div>

              <Button
                onClick={handlePropose}
                disabled={submitting}
                className="w-full bg-primary text-white font-heading rounded-xl"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : lang === 'ru' ? (
                  '📤 Отправить на модерацию'
                ) : (
                  '📤 Submit for Moderation'
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {myPending.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {t('pending_moderation')}
          </p>
          {myPending.map((cb) => (
            <div
              key={cb.id}
              className="rounded-xl bg-neon-gold/5 border border-neon-gold/20 p-3 flex items-center gap-3"
            >
              <Clock className="w-4 h-4 text-neon-gold shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{cb.title}</p>
                <p className="text-xs text-muted-foreground">{t('pending_moderation')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : approved.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-card border border-border/50 space-y-3">
          <span className="text-4xl">🏟️</span>
          <p className="font-heading font-semibold text-foreground">
            {lang === 'ru' ? 'Ставок от сообщества пока нет' : 'No community bets yet'}
          </p>
          <p className="text-sm text-muted-foreground">
            {lang === 'ru'
              ? 'Будь первым — придумай свой челлендж!'
              : 'Be the first to invent a challenge!'}
          </p>
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
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-3 whitespace-pre-wrap">
                      {cb.description}
                    </p>
                  </div>
                  <GemsBadge amount={cb.stake_amount} size="sm" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${diff.bgColor} ${diff.color}`}
                  >
                    {diff.label}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" /> {cb.participants_count || 0}
                  </span>
                  <span className="text-xs text-muted-foreground">{cb.duration_days}d</span>
                  <span className="text-xs text-neon-gold">
                    Pool: {(cb.total_pool || 0).toLocaleString()} 💎
                  </span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleJoin(cb)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-neon-cyan text-white text-sm font-heading font-semibold"
                >
                  {lang === 'ru' ? 'Принять вызов' : 'Join Challenge'} — {cb.stake_amount} 💎
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
