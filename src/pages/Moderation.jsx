import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Check, X, Hourglass, ExternalLink, Loader2, AlertTriangle, ArrowLeft, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { db } from '@/api/base44Client';
import { useProfile } from '@/lib/useProfile';
import { useLang } from '@/lib/i18n';
import { CATEGORIES, DIFFICULTIES } from '@/lib/gameConfig';
import GemsBadge from '@/components/common/GemsBadge';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export default function Moderation() {
  const { profile, loading } = useProfile();
  const [tab, setTab] = useState('proofs');

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="px-4 pt-6 pb-24 space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/" className="w-9 h-9 rounded-xl bg-secondary border border-border/50 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="betly-brand-text">Модерация</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Очередь на проверку</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full bg-secondary">
          <TabsTrigger value="proofs" className="flex-1 text-xs gap-1">
            <Hourglass className="w-3.5 h-3.5" />
            Доказательства
          </TabsTrigger>
          <TabsTrigger value="community" className="flex-1 text-xs gap-1">
            <Shield className="w-3.5 h-3.5" />
            Общие ставки
          </TabsTrigger>
          <TabsTrigger value="exchanges" className="flex-1 text-xs gap-1">
            <Wallet className="w-3.5 h-3.5" />
            Обмены
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'proofs' && <ProofsQueue />}
      {tab === 'community' && <CommunityBetsQueue />}
      {tab === 'exchanges' && <ExchangeQueue />}
    </div>
  );
}

function ProofsQueue() {
  const qc = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const { data: bets = [], isLoading } = useQuery({
    queryKey: ['moderation-bets'],
    queryFn: () =>
      db.entities.Bet.filter({ status: 'pending_review' }, 'proof_submitted_at'),
  });

  const callModerate = async (payload) => {
    return db.functions.invoke('moderateBet', payload);
  };

  const approve = async (bet) => {
    setBusyId(bet.id);
    try {
      await callModerate({ betId: bet.id, action: 'approve' });
      toast.success('✅ Одобрено');
      qc.invalidateQueries({ queryKey: ['moderation-bets'] });
      qc.invalidateQueries({ queryKey: ['my-bets'] });
    } catch (e) {
      toast.error(`Ошибка: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleRejectConfirm = async (reason) => {
    if (!rejectTarget) return;
    setBusyId(rejectTarget.id);
    try {
      await callModerate({ betId: rejectTarget.id, action: 'reject', reason });
      toast.success('❌ Отклонено');
      qc.invalidateQueries({ queryKey: ['moderation-bets'] });
      qc.invalidateQueries({ queryKey: ['my-bets'] });
      setRejectTarget(null);
    } catch (e) {
      toast.error(`Ошибка: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (bets.length === 0) {
    return (
      <div className="text-center py-12 rounded-xl bg-card border border-border/50 space-y-2">
        <span className="text-4xl">🧹</span>
        <p className="font-heading font-semibold text-foreground">Очередь пуста</p>
        <p className="text-sm text-muted-foreground">Все доказательства разобраны.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <AnimatePresence>
          {bets.map((bet, i) => (
            <ProofCard
              key={bet.id}
              bet={bet}
              index={i}
              busy={busyId === bet.id}
              onApprove={() => approve(bet)}
              onReject={() => setRejectTarget(bet)}
            />
          ))}
        </AnimatePresence>
      </div>

      <RejectionDialog
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
        title={rejectTarget?.title}
      />
    </>
  );
}

function ProofCard({ bet, index, busy, onApprove, onReject }) {
  const cat = CATEGORIES[bet.category] || CATEGORIES.custom;
  const diff = DIFFICULTIES[bet.difficulty] || DIFFICULTIES.medium;

  const submittedAgo = bet.proof_submitted_at
    ? formatDistanceToNow(new Date(bet.proof_submitted_at), { addSuffix: true })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-xl bg-card border border-neon-gold/30 p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-2xl shrink-0">{cat.emoji}</span>
          <div className="min-w-0">
            <h3 className="font-heading font-semibold text-foreground leading-tight truncate">{bet.title}</h3>
            <p className="text-[11px] text-muted-foreground truncate">{bet.user_email}</p>
          </div>
        </div>
        <GemsBadge amount={bet.stake_amount} size="sm" />
      </div>

      {bet.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{bet.description}</p>
      )}

      <div className="rounded-lg bg-secondary/60 border border-border/50 p-3 space-y-2">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Доказательство</p>
        {bet.proof_note
          ? <p className="text-sm text-foreground whitespace-pre-wrap">{bet.proof_note}</p>
          : <p className="text-sm text-muted-foreground italic">— без описания —</p>}
        {bet.proof_url && <ProofAttachment betId={bet.id} url={bet.proof_url} />}
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className={`px-2 py-0.5 rounded-full font-medium ${diff.bgColor} ${diff.color}`}>
            {diff.label}
          </span>
          {submittedAgo && (
            <span className="flex items-center gap-1">
              <Hourglass className="w-3 h-3" /> {submittedAgo}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.92 }}
            disabled={busy}
            onClick={onApprove}
            className="px-3 h-8 rounded-lg bg-success/20 text-success border border-success/30 flex items-center gap-1 text-xs font-heading font-semibold disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" /> Одобрить
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.92 }}
            disabled={busy}
            onClick={onReject}
            className="px-3 h-8 rounded-lg bg-destructive/20 text-destructive border border-destructive/30 flex items-center gap-1 text-xs font-heading font-semibold disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" /> Отклонить
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function CommunityBetsQueue() {
  const qc = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['moderation-community-bets'],
    queryFn: () =>
      db.entities.CommunityBet.filter({ status: 'pending' }, '-created_date'),
  });

  const callModerate = async (payload) => {
    return db.functions.invoke('moderateCommunityBet', payload);
  };

  const approve = async (cb) => {
    setBusyId(cb.id);
    try {
      await callModerate({ communityBetId: cb.id, action: 'approve' });
      toast.success('✅ Опубликовано');
      qc.invalidateQueries({ queryKey: ['moderation-community-bets'] });
      qc.invalidateQueries({ queryKey: ['community-bets-approved'] });
      qc.invalidateQueries({ queryKey: ['community-bets-mine'] });
    } catch (e) {
      toast.error(`Ошибка: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleRejectConfirm = async (reason) => {
    if (!rejectTarget) return;
    setBusyId(rejectTarget.id);
    try {
      await callModerate({ communityBetId: rejectTarget.id, action: 'reject', reason });
      toast.success('❌ Отклонено');
      qc.invalidateQueries({ queryKey: ['moderation-community-bets'] });
      qc.invalidateQueries({ queryKey: ['community-bets-mine'] });
      setRejectTarget(null);
    } catch (e) {
      toast.error(`Ошибка: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="text-center py-12 rounded-xl bg-card border border-border/50 space-y-2">
        <span className="text-4xl">🏟️</span>
        <p className="font-heading font-semibold text-foreground">Ничего нового</p>
        <p className="text-sm text-muted-foreground">Новых предложений ставок нет.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <AnimatePresence>
          {items.map((cb, i) => (
            <CommunityCard
              key={cb.id}
              cb={cb}
              index={i}
              busy={busyId === cb.id}
              onApprove={() => approve(cb)}
              onReject={() => setRejectTarget(cb)}
            />
          ))}
        </AnimatePresence>
      </div>

      <RejectionDialog
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
        title={rejectTarget?.title}
      />
    </>
  );
}

function CommunityCard({ cb, index, busy, onApprove, onReject }) {
  const cat = CATEGORIES[cb.category] || CATEGORIES.custom;
  const diff = DIFFICULTIES[cb.difficulty] || DIFFICULTIES.medium;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-xl bg-card border border-primary/30 p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-2xl shrink-0">{cat.emoji}</span>
          <div className="min-w-0">
            <h3 className="font-heading font-semibold text-foreground leading-tight truncate">{cb.title}</h3>
            <p className="text-[11px] text-muted-foreground truncate">{cb.creator_email}</p>
          </div>
        </div>
        <GemsBadge amount={cb.stake_amount} size="sm" />
      </div>

      <p className="text-xs text-foreground/85 whitespace-pre-wrap">{cb.description}</p>

      <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
        <span className={`px-2 py-0.5 rounded-full font-medium ${diff.bgColor} ${diff.color}`}>
          {diff.label}
        </span>
        <span>{cb.duration_days}д</span>
        <span>Тип: {cb.proof_type}</span>
        <span>Доля автора: {cb.creator_revenue_pct}%</span>
      </div>

      <div className="flex justify-end gap-2">
        <motion.button
          whileTap={{ scale: 0.92 }}
          disabled={busy}
          onClick={onApprove}
          className="px-3 h-8 rounded-lg bg-success/20 text-success border border-success/30 flex items-center gap-1 text-xs font-heading font-semibold disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" /> Одобрить
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.92 }}
          disabled={busy}
          onClick={onReject}
          className="px-3 h-8 rounded-lg bg-destructive/20 text-destructive border border-destructive/30 flex items-center gap-1 text-xs font-heading font-semibold disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" /> Отклонить
        </motion.button>
      </div>
    </motion.div>
  );
}

function ExchangeQueue() {
  const qc = useQueryClient();
  const [busyId, setBusyId] = useState(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['moderation-exchanges'],
    queryFn: () =>
      db.entities.ExchangeRequest.filter({ status: 'pending' }, '-created_date'),
  });

  const updateStatus = async (req, newStatus) => {
    setBusyId(req.id);
    try {
      await db.entities.ExchangeRequest.update(req.id, {
        status: newStatus,
        reviewed_at: new Date().toISOString(),
      });
      toast.success(newStatus === 'approved' ? '✅ Одобрено' : '❌ Отклонено');
      qc.invalidateQueries({ queryKey: ['moderation-exchanges'] });
    } catch (e) {
      toast.error(`Ошибка: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="text-center py-12 rounded-xl bg-card border border-border/50 space-y-2">
        <span className="text-4xl">💸</span>
        <p className="font-heading font-semibold text-foreground">Очередь пуста</p>
        <p className="text-sm text-muted-foreground">Новых запросов на обмен нет.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {items.map((req, i) => (
          <ExchangeCard
            key={req.id}
            req={req}
            index={i}
            busy={busyId === req.id}
            onApprove={() => updateStatus(req, 'approved')}
            onReject={() => updateStatus(req, 'rejected')}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ExchangeCard({ req, index, busy, onApprove, onReject }) {
  const [open, setOpen] = useState(false);
  const submittedAgo = req.created_date
    ? formatDistanceToNow(new Date(req.created_date), { addSuffix: true })
    : null;

  const copyWallet = async () => {
    try {
      await navigator.clipboard?.writeText(req.wallet_address);
      toast.success('Адрес кошелька скопирован');
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-xl bg-card border border-neon-cyan/30 p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-2xl shrink-0">💸</span>
          <div className="min-w-0">
            <h3 className="font-heading font-semibold text-foreground leading-tight truncate">
              Запрос на обмен
            </h3>
            <p className="text-[11px] text-muted-foreground truncate">
              {req.tg_username ? `@${req.tg_username}` : req.user_email}
            </p>
          </div>
        </div>
        <GemsBadge amount={req.gems_amount} size="sm" />
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between rounded-lg bg-secondary/60 border border-border/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {open ? 'Скрыть детали' : 'Показать кошелёк и сумму'}
        </span>
        {submittedAgo && (
          <span className="flex items-center gap-1">
            <Hourglass className="w-3 h-3" /> {submittedAgo}
          </span>
        )}
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="rounded-lg bg-secondary/60 border border-border/50 p-3 space-y-2"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">GEMS</p>
              <p className="text-sm font-heading font-semibold text-foreground">
                {Number(req.gems_amount).toLocaleString()} 💎
              </p>
            </div>
            <div className="min-w-0 text-right">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">TON к выплате</p>
              <p className="text-sm font-heading font-semibold text-neon-cyan">
                {Number(req.ton_amount).toFixed(4)} TON
              </p>
            </div>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
              <Wallet className="w-3 h-3" /> TON кошелёк
            </p>
            <button
              onClick={copyWallet}
              className="w-full text-left font-mono text-xs text-foreground break-all rounded-md bg-black/30 border border-border/50 px-2 py-1.5 hover:bg-black/40 transition-colors"
              title="Нажми, чтобы скопировать"
            >
              {req.wallet_address}
            </button>
          </div>
        </motion.div>
      )}

      <div className="flex justify-end gap-2">
        <motion.button
          whileTap={{ scale: 0.92 }}
          disabled={busy}
          onClick={onApprove}
          aria-label="Одобрить"
          className="px-3 h-8 rounded-lg bg-success/20 text-success border border-success/30 flex items-center gap-1 text-xs font-heading font-semibold disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" /> Одобрить
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.92 }}
          disabled={busy}
          onClick={onReject}
          aria-label="Отклонить"
          className="px-3 h-8 rounded-lg bg-destructive/20 text-destructive border border-destructive/30 flex items-center gap-1 text-xs font-heading font-semibold disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" /> Отклонить
        </motion.button>
      </div>
    </motion.div>
  );
}

function ProofAttachment({ betId, url }) {
  const [signedUrl, setSignedUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const isImage = /\.(png|jpe?g|gif|webp|heic|heif|bmp)(\?|$)/i.test(url);
  const isVideo = /\.(mp4|mov|webm|m4v|ogg)(\?|$)/i.test(url);

  const loadSignedUrl = useCallback(async () => {
    setLoading(true);
    try {
      const { url: signed } = await db.functions.invoke('getProofUrl', { betId });
      setSignedUrl(signed);
    } catch (e) {
      toast.error('Не удалось загрузить файл: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [betId]);

  if (signedUrl) {
    return (
      <div className="space-y-2">
        {isImage && (
          <img
            src={signedUrl}
            alt="Proof"
            className="rounded-lg max-h-72 w-full object-contain bg-black/30 border border-border/40"
          />
        )}
        {isVideo && (
          <video
            src={signedUrl}
            controls
            className="rounded-lg max-h-72 w-full object-contain bg-black/30 border border-border/40"
          />
        )}
        <button
          onClick={() => setSignedUrl(null)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Скрыть
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={loadSignedUrl}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-medium hover:bg-neon-cyan/20 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <ExternalLink className="w-3.5 h-3.5" />
        )}
        {loading ? 'Загрузка...' : (isImage || isVideo ? 'Показать вложение' : 'Скачать файл')}
      </button>
    </div>
  );
}

function RejectionDialog({ open, onClose, onConfirm, title }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { lang } = useLang();

  useEffect(() => {
    if (!open) {
      setReason('');
      setSubmitting(false);
    }
  }, [open]);

  const submit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await onConfirm(reason.trim());
      setReason('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-destructive/40 max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            {lang === 'ru' ? 'Причина отклонения' : 'Rejection reason'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {title
              ? (lang === 'ru' ? `Поясни пользователю, почему «${title}» отклонена.` : `Explain why "${title}" was rejected.`)
              : (lang === 'ru' ? 'Опиши причину — она будет видна пользователю.' : 'Describe the reason — the user will see it.')}
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={lang === 'ru'
            ? 'Например: на фото не видно результат, приложи ссылку на трекер'
            : 'e.g. proof is unclear, please attach a tracker link'}
          maxLength={500}
          className="bg-secondary border-border/50 h-28 resize-none"
        />

        <div className="flex gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} className="flex-1 text-muted-foreground">
            {lang === 'ru' ? 'Отмена' : 'Cancel'}
          </Button>
          <Button
            disabled={!reason.trim() || submitting}
            onClick={submit}
            className="flex-1 bg-destructive text-destructive-foreground font-heading"
          >
            {submitting
              ? (lang === 'ru' ? 'Отправка...' : 'Sending...')
              : (lang === 'ru' ? 'Отклонить' : 'Reject')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
