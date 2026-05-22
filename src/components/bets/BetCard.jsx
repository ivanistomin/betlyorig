import { motion } from 'framer-motion';
import { Clock, Check, X, AlertTriangle, Hourglass } from 'lucide-react';
import { CATEGORIES, DIFFICULTIES } from '@/lib/gameConfig';
import GemsBadge from '../common/GemsBadge';
import { formatDistanceToNow, isPast } from 'date-fns';
import { useLang } from '@/lib/i18n';

const AUTO_APPROVE_AFTER_MS = 12 * 60 * 60 * 1000;

export default function BetCard({ bet, onComplete, onFail, compact = false }) {
  const { lang } = useLang();
  const cat = CATEGORIES[bet.category] || CATEGORIES.custom;
  const diff = DIFFICULTIES[bet.difficulty] || DIFFICULTIES.medium;
  const isOverdue = bet.status === 'active' && isPast(new Date(bet.deadline));

  const statusConfig = {
    active: { color: 'border-primary/40', icon: <Clock className="w-3.5 h-3.5" />, label: lang === 'ru' ? 'Активна' : 'Active' },
    pending_review: { color: 'border-neon-gold/40', icon: <Hourglass className="w-3.5 h-3.5" />, label: lang === 'ru' ? 'На проверке' : 'Under review' },
    completed: { color: 'border-success/40', icon: <Check className="w-3.5 h-3.5" />, label: lang === 'ru' ? 'Победа' : 'Won' },
    failed: { color: 'border-destructive/40', icon: <X className="w-3.5 h-3.5" />, label: lang === 'ru' ? 'Поражение' : 'Lost' },
    rejected: { color: 'border-destructive/40', icon: <AlertTriangle className="w-3.5 h-3.5" />, label: lang === 'ru' ? 'Отклонено' : 'Rejected' },
  };

  const sc = statusConfig[bet.status] || statusConfig.active;

  // 12-hour auto-approve countdown for pending_review.
  let autoApproveText = null;
  if (bet.status === 'pending_review' && bet.proof_submitted_at) {
    const eta = new Date(new Date(bet.proof_submitted_at).getTime() + AUTO_APPROVE_AFTER_MS);
    autoApproveText = formatDistanceToNow(eta, { addSuffix: true });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl bg-card border ${sc.color} p-4 space-y-3`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{cat.emoji}</span>
          <div>
            <h3 className="font-heading font-semibold text-foreground leading-tight">{bet.title}</h3>
            {!compact && <p className="text-xs text-muted-foreground mt-0.5">{cat.label}</p>}
          </div>
        </div>
        <GemsBadge amount={bet.stake_amount} size="sm" />
      </div>

      {!compact && bet.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{bet.description}</p>
      )}

      {bet.status === 'pending_review' && (
        <div className="rounded-lg bg-neon-gold/5 border border-neon-gold/20 p-2.5 space-y-1">
          <p className="text-[11px] font-heading font-semibold text-neon-gold flex items-center gap-1">
            <Hourglass className="w-3 h-3" />
            {lang === 'ru' ? 'Ждём модератора' : 'Awaiting moderator'}
          </p>
          {autoApproveText && (
            <p className="text-[11px] text-muted-foreground">
              {lang === 'ru' ? 'Авто-одобрение' : 'Auto-approve'} {autoApproveText}
            </p>
          )}
        </div>
      )}

      {bet.status === 'rejected' && bet.rejection_reason && (
        <div className="rounded-lg bg-destructive/5 border border-destructive/30 p-2.5 space-y-1">
          <p className="text-[11px] font-heading font-semibold text-destructive flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {lang === 'ru' ? 'Причина отклонения' : 'Rejection reason'}
          </p>
          <p className="text-xs text-foreground/90 whitespace-pre-wrap">{bet.rejection_reason}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${diff.bgColor} ${diff.color}`}>
            {diff.label}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            {sc.icon}
            {bet.status === 'active'
              ? (isOverdue ? (lang === 'ru' ? 'Просрочена!' : 'Overdue!') : formatDistanceToNow(new Date(bet.deadline), { addSuffix: true }))
              : sc.label
            }
          </span>
        </div>

        {bet.status === 'active' && (
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onComplete?.(bet)}
              title={lang === 'ru' ? 'Отправить на проверку' : 'Submit proof'}
              className="w-8 h-8 rounded-lg bg-success/20 text-success flex items-center justify-center"
            >
              <Check className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onFail?.(bet)}
              title={lang === 'ru' ? 'Признать поражение' : 'Forfeit'}
              className="w-8 h-8 rounded-lg bg-destructive/20 text-destructive flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        )}

        {bet.status === 'completed' && bet.reward_amount > 0 && (
          <GemsBadge amount={bet.reward_amount} size="sm" showPlus />
        )}
      </div>
    </motion.div>
  );
}
