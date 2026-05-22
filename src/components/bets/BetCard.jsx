import { motion } from 'framer-motion';
import { Clock, Check, X, AlertTriangle } from 'lucide-react';
import { CATEGORIES, DIFFICULTIES } from '@/lib/gameConfig';
import GemsBadge from '../common/GemsBadge';
import { format, formatDistanceToNow, isPast } from 'date-fns';

export default function BetCard({ bet, onComplete, onFail, compact = false }) {
  const cat = CATEGORIES[bet.category] || CATEGORIES.custom;
  const diff = DIFFICULTIES[bet.difficulty] || DIFFICULTIES.medium;
  const isOverdue = bet.status === 'active' && isPast(new Date(bet.deadline));

  const statusConfig = {
    active: { color: 'border-primary/40', icon: <Clock className="w-3.5 h-3.5" />, label: 'Active' },
    completed: { color: 'border-success/40', icon: <Check className="w-3.5 h-3.5" />, label: 'Won' },
    failed: { color: 'border-destructive/40', icon: <X className="w-3.5 h-3.5" />, label: 'Lost' },
    pending_verification: { color: 'border-neon-gold/40', icon: <AlertTriangle className="w-3.5 h-3.5" />, label: 'Pending' },
  };

  const sc = statusConfig[bet.status] || statusConfig.active;

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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${diff.bgColor} ${diff.color}`}>
            {diff.label}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            {sc.icon}
            {bet.status === 'active'
              ? (isOverdue ? 'Overdue!' : formatDistanceToNow(new Date(bet.deadline), { addSuffix: true }))
              : sc.label
            }
          </span>
        </div>

        {bet.status === 'active' && (
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onComplete?.(bet)}
              className="w-8 h-8 rounded-lg bg-success/20 text-success flex items-center justify-center"
            >
              <Check className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onFail?.(bet)}
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